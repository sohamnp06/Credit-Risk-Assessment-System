"""
Database CRUD functions for the Credit Risk Assessment System.
All operations now target the two consolidated tables: employees and users.
"""

import psycopg2
import json
import os
import csv
import tempfile
import shutil
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "dbname":   os.getenv("DB_NAME", "credit_risk_db"),
    "user":     os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASS", "root"),
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     os.getenv("DB_PORT", "5432"),
}


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


# ─── Loan ID Generation ───────────────────────────────────────────────────────

def generate_loan_id(cur) -> str:
    """Atomically query max ID and return next loan_id."""
    cur.execute("SELECT COALESCE(MAX(id), 0) FROM users;")
    val = cur.fetchone()[0] + 1
    return f"LN{val:06d}"


# ─── User (Applicant) Operations ──────────────────────────────────────────────

def create_loan_user(full_name: str, password_hash: bytes) -> str:
    """Create a new loan user in the users table and return their generated loan_id."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        loan_id = generate_loan_id(cur)
        cur.execute(
            "INSERT INTO users (loan_id, full_name, password_hash, decision) VALUES (%s, %s, %s, 'pending') RETURNING loan_id;",
            (loan_id, full_name, password_hash)
        )
        conn.commit()
        return loan_id
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def get_loan_user_by_loan_id(loan_id: str) -> dict | None:
    """Fetch a user by loan_id."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT loan_id, full_name, password_hash FROM users WHERE loan_id = %s;",
        (loan_id,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    return {"loan_id": row[0], "full_name": row[1], "password_hash": bytes(row[2]) if row[2] else None}


def get_loan_user_by_name(full_name: str) -> list[dict]:
    """Fetch all users with the given name."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT loan_id, full_name, password_hash FROM users WHERE full_name = %s;",
        (full_name,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"loan_id": r[0], "full_name": r[1], "password_hash": bytes(r[2]) if r[2] else None} for r in rows]


# ─── Loan Application Operations (Stored directly in users table) ────────────

def insert_application(loan_id: str, features: dict, prediction: int, probability: float, shap_values: dict) -> int:
    """Update the existing user row with all loan application features and ML results. Returns database row id."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur_date = datetime.now().date()
        cur.execute("""
            UPDATE users
            SET
                age = %s, income = %s, education = %s, employment_type = %s, months_employed = %s,
                gender = 'Unknown',
                loan_amount = %s, loan_purpose = %s, loan_term = %s,
                marital_status = %s, has_mortgage = %s, has_dependents = %s, has_cosigner = %s,
                credit_score = %s, num_credit_lines = %s, interest_rate = %s, dti_ratio = %s,
                loan_to_income = %s, credit_per_line = %s, income_per_employment = %s,
                interest_burden = %s, high_dti_flag = %s, low_credit_flag = %s,
                monthly_income = %s, estimated_emi = %s, emi_to_income = %s,
                disposable_income = %s, income_after_emi = %s,
                creditscore_bucket = %s, income_group = %s,
                employment_stability = %s, loan_burden = %s,
                ml_prediction = %s, ml_probability = %s, shap_values = %s,
                decision = 'pending',
                date = %s
            WHERE loan_id = %s
            RETURNING id;
        """, (
            features["Age"], features["Income"], features["Education"], features["EmploymentType"],
            features["MonthsEmployed"],
            features["LoanAmount"], features["LoanPurpose"],
            features["LoanTerm"],
            features["MaritalStatus"], features["HasMortgage"], features["HasDependents"],
            features["HasCoSigner"],
            features["CreditScore"], features["NumCreditLines"], features["InterestRate"],
            features["DTIRatio"],
            features["Loan_to_Income"], features["Credit_per_Line"], features["Income_per_Employment"],
            features["Interest_Burden"], features["High_DTI_Flag"], features["Low_Credit_Flag"],
            features["Monthly_Income"], features["Estimated_EMI"], features["EMI_to_Income"],
            features["Disposable_Income"], features["Income_After_EMI"],
            features["CreditScore_Bucket"], features["Income_Group"],
            features["Employment_Stability"], features["Loan_Burden"],
            int(prediction), float(probability), json.dumps(shap_values),
            cur_date,
            loan_id
        ))
        row = cur.fetchone()
        app_id = row[0] if row else None
        conn.commit()
        return app_id
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def get_application_by_loan_id(loan_id: str) -> dict | None:
    """Get the application details for a given loan_id."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, loan_id, age, income, education, employment_type,
               months_employed, 0.0 as existing_monthly_debt, loan_amount, loan_purpose,
               loan_term, marital_status, has_mortgage, has_dependents, has_cosigner,
               credit_score, num_credit_lines, interest_rate, dti_ratio,
               loan_to_income, credit_per_line, income_per_employment,
               interest_burden, high_dti_flag, low_credit_flag,
               monthly_income, estimated_emi, emi_to_income,
               disposable_income, income_after_emi,
               creditscore_bucket, income_group, employment_stability, loan_burden,
               ml_prediction, ml_probability, shap_values,
               decision, decided_by, decision_note, decided_at, created_at, full_name, date
        FROM users
        WHERE loan_id = %s;
    """, (loan_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    return _row_to_application(row, has_name=True)


def get_application_by_id(app_id: int) -> dict | None:
    """Get a specific application by its id."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, loan_id, age, income, education, employment_type,
               months_employed, 0.0 as existing_monthly_debt, loan_amount, loan_purpose,
               loan_term, marital_status, has_mortgage, has_dependents, has_cosigner,
               credit_score, num_credit_lines, interest_rate, dti_ratio,
               loan_to_income, credit_per_line, income_per_employment,
               interest_burden, high_dti_flag, low_credit_flag,
               monthly_income, estimated_emi, emi_to_income,
               disposable_income, income_after_emi,
               creditscore_bucket, income_group, employment_stability, loan_burden,
               ml_prediction, ml_probability, shap_values,
               decision, decided_by, decision_note, decided_at, created_at, full_name, date
        FROM users
        WHERE id = %s;
    """, (app_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    return _row_to_application(row, has_name=True)


def get_all_applications(decision_filter: str = None) -> list[dict]:
    """Get all applications ordered by date desc (most recent first), limit 1,000."""
    conn = get_connection()
    cur = conn.cursor()
    if decision_filter:
        cur.execute("""
            SELECT id, loan_id, age, income, education, employment_type,
                   months_employed, 0.0 as existing_monthly_debt, loan_amount, loan_purpose,
                   loan_term, marital_status, has_mortgage, has_dependents, has_cosigner,
                   credit_score, num_credit_lines, interest_rate, dti_ratio,
                   loan_to_income, credit_per_line, income_per_employment,
                   interest_burden, high_dti_flag, low_credit_flag,
                   monthly_income, estimated_emi, emi_to_income,
                   disposable_income, income_after_emi,
                   creditscore_bucket, income_group, employment_stability, loan_burden,
                   ml_prediction, ml_probability, shap_values,
                   decision, decided_by, decision_note, decided_at, created_at,
                   full_name, date
            FROM users
            WHERE decision = %s
            ORDER BY date DESC, id DESC
            LIMIT 1000;
        """, (decision_filter,))
    else:
        cur.execute("""
            SELECT id, loan_id, age, income, education, employment_type,
                   months_employed, 0.0 as existing_monthly_debt, loan_amount, loan_purpose,
                   loan_term, marital_status, has_mortgage, has_dependents, has_cosigner,
                   credit_score, num_credit_lines, interest_rate, dti_ratio,
                   loan_to_income, credit_per_line, income_per_employment,
                   interest_burden, high_dti_flag, low_credit_flag,
                   monthly_income, estimated_emi, emi_to_income,
                   disposable_income, income_after_emi,
                   creditscore_bucket, income_group, employment_stability, loan_burden,
                   ml_prediction, ml_probability, shap_values,
                   decision, decided_by, decision_note, decided_at, created_at,
                   full_name, date
            FROM users
            ORDER BY date DESC, id DESC
            LIMIT 1000;
        """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [_row_to_application(row, has_name=True) for row in rows]


def update_decision_in_csv(loan_id: str, decision: str):
    """Line-by-line streaming update for high performance on 40MB+ CSV files."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_paths = [
        os.path.join(base_dir, "data", "loanDefaulter.csv"),
        os.path.join(base_dir, "data", "da-loanDefaulter.csv")
    ]
    
    for csv_path in csv_paths:
        if not os.path.exists(csv_path):
            continue
            
        temp_fd, temp_path = tempfile.mkstemp()
        try:
            with open(csv_path, 'r', newline='', encoding='utf-8') as infile, \
                 open(temp_path, 'w', newline='', encoding='utf-8') as outfile:
                
                reader = csv.reader(infile)
                writer = csv.writer(outfile)
                
                header = next(reader)
                
                if 'Decision' not in header:
                    header.append('Decision')
                    decision_idx = len(header) - 1
                else:
                    decision_idx = header.index('Decision')
                    
                loan_id_idx = header.index('LoanID')
                writer.writerow(header)
                
                for row in reader:
                    if len(row) > loan_id_idx and row[loan_id_idx] == loan_id:
                        while len(row) < len(header):
                            row.append('')
                        row[decision_idx] = decision
                    writer.writerow(row)
            
            os.close(temp_fd)
            shutil.move(temp_path, csv_path)
            print(f"[CSV Sync] Updated decision to '{decision}' for {loan_id} in {os.path.basename(csv_path)}")
        except Exception as e:
            try:
                os.close(temp_fd)
            except:
                pass
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e


def update_decision(app_id: int, decision: str, decided_by: str, note: str = "") -> bool:
    """Update decision in users table and sync to CSV files."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE users
            SET decision = %s, decided_by = %s, decision_note = %s, decided_at = NOW()
            WHERE id = %s
            RETURNING loan_id;
        """, (decision, decided_by, note, app_id))
        row = cur.fetchone()
        if not row:
            conn.rollback()
            return False
        loan_id = row[0]
        conn.commit()

        # Update CSV files
        try:
            update_decision_in_csv(loan_id, decision)
        except Exception as csv_err:
            print(f"[CSV Sync Error] {csv_err}")
            
        return True
    except Exception:
        conn.rollback()
        return False
    finally:
        cur.close()
        conn.close()


def get_dashboard_stats() -> dict:
    """Return aggregate stats for the employee dashboard."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM users;")
    total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users WHERE decision = 'pending';")
    pending = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users WHERE decision = 'approved';")
    approved = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users WHERE decision = 'rejected';")
    rejected = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users WHERE decision = 'hold';")
    hold = cur.fetchone()[0]

    cur.execute("SELECT AVG(ml_probability) FROM users;")
    avg_prob = cur.fetchone()[0] or 0.0

    cur.execute("SELECT COUNT(*) FROM users WHERE ml_prediction = 1;")
    high_risk = cur.fetchone()[0]

    cur.execute("""
        SELECT COALESCE(date, DATE(created_at)), COUNT(*) FROM users
        GROUP BY COALESCE(date, DATE(created_at)) ORDER BY COALESCE(date, DATE(created_at)) DESC LIMIT 7;
    """)
    trend = [{"date": str(r[0]), "count": r[1]} for r in cur.fetchall()]

    cur.close()
    conn.close()

    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "hold": hold,
        "avg_risk_probability": round(float(avg_prob), 4),
        "high_risk_count": high_risk,
        "daily_trend": trend,
    }


# ─── Employee Operations ──────────────────────────────────────────────────────

def get_employee_by_username(username: str) -> dict | None:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, username, password_hash FROM employees WHERE username = %s;",
        (username,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "password_hash": bytes(row[2])}


# ─── Helper ───────────────────────────────────────────────────────────────────

def _row_to_application(row: tuple, has_name: bool = False) -> dict:
    shap_values = {}
    if row[36]:
        try:
            shap_values = json.loads(row[36])
        except Exception:
            shap_values = {}

    result = {
        "id":               row[0],
        "loan_id":          row[1],
        "age":              row[2],
        "annual_income":    row[3],
        "education":        row[4],
        "employment_type":  row[5],
        "months_employed":  row[6],
        "existing_monthly_debt": row[7],
        "loan_amount":      row[8],
        "loan_purpose":     row[9],
        "loan_term":        row[10],
        "marital_status":   row[11],
        "has_mortgage":     row[12],
        "has_dependents":   row[13],
        "has_cosigner":     row[14],
        "credit_score":     row[15],
        "num_credit_lines": row[16],
        "interest_rate":    row[17],
        "dti_ratio":        row[18],
        "loan_to_income":   row[19],
        "credit_per_line":  row[20],
        "income_per_employment": row[21],
        "interest_burden":  row[22],
        "high_dti_flag":    row[23],
        "low_credit_flag":  row[24],
        "monthly_income":   row[25],
        "estimated_emi":    row[26],
        "emi_to_income":    row[27],
        "disposable_income": row[28],
        "income_after_emi": row[29],
        "creditscore_bucket": row[30],
        "income_group":     row[31],
        "employment_stability": row[32],
        "loan_burden":      row[33],
        "ml_prediction":    row[34],
        "ml_probability":   float(row[35]) if row[35] is not None else None,
        "shap_values":      shap_values,
        "decision":         row[37],
        "decided_by":       row[38],
        "decision_note":    row[39],
        "decided_at":       str(row[40]) if row[40] else None,
        "created_at":       str(row[41]) if row[41] else None,
    }
    if has_name and len(row) > 42:
        result["full_name"] = row[42]
    if len(row) > 43 and row[43]:
        result["date"] = str(row[43])
    else:
        result["date"] = result["created_at"].split(" ")[0] if result["created_at"] else None
    return result