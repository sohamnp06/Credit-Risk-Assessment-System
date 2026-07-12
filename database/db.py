"""
Database CRUD functions for the Credit Risk Assessment System.
All operations use the new schema (loan_users, loan_applications, employees).
"""

import psycopg2
import json
import os
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
    """Atomically increment the sequence and return the next LoanID."""
    cur.execute("UPDATE loan_id_sequence SET last_val = last_val + 1 RETURNING last_val;")
    val = cur.fetchone()[0]
    return f"LN{val:06d}"


# ─── User (Loan User) Operations ─────────────────────────────────────────────

def create_loan_user(full_name: str, password_hash: bytes) -> str:
    """Create a new loan user and return their generated loan_id."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        loan_id = generate_loan_id(cur)
        cur.execute(
            "INSERT INTO loan_users (loan_id, full_name, password_hash) VALUES (%s, %s, %s);",
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
        "SELECT loan_id, full_name, password_hash FROM loan_users WHERE loan_id = %s;",
        (loan_id,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    return {"loan_id": row[0], "full_name": row[1], "password_hash": bytes(row[2])}


def get_loan_user_by_name(full_name: str) -> list[dict]:
    """Fetch all users with the given name (duplicates allowed)."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT loan_id, full_name, password_hash FROM loan_users WHERE full_name = %s;",
        (full_name,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"loan_id": r[0], "full_name": r[1], "password_hash": bytes(r[2])} for r in rows]


# ─── Loan Application Operations ─────────────────────────────────────────────

def insert_application(loan_id: str, features: dict, prediction: int, probability: float, shap_values: dict) -> int:
    """Insert a new loan application with all features and ML result. Returns app id."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO loan_applications (
                loan_id,
                age, annual_income, education, employment_type, months_employed,
                existing_monthly_debt, loan_amount, loan_purpose, loan_term,
                marital_status, has_mortgage, has_dependents, has_cosigner,
                credit_score, num_credit_lines, interest_rate, dti_ratio,
                loan_to_income, credit_per_line, income_per_employment,
                interest_burden, high_dti_flag, low_credit_flag,
                monthly_income, estimated_emi, emi_to_income,
                disposable_income, income_after_emi,
                creditscore_bucket, income_group,
                employment_stability, loan_burden,
                ml_prediction, ml_probability, shap_values,
                decision
            ) VALUES (
                %s,
                %s,%s,%s,%s,%s,
                %s,%s,%s,%s,
                %s,%s,%s,%s,
                %s,%s,%s,%s,
                %s,%s,%s,
                %s,%s,%s,
                %s,%s,%s,
                %s,%s,
                %s,%s,
                %s,%s,
                %s,%s,%s,
                'pending'
            ) RETURNING id;
        """, (
            loan_id,
            features["Age"], features["Income"], features["Education"], features["EmploymentType"],
            features["MonthsEmployed"],
            features.get("_existing_monthly_debt", 0), features["LoanAmount"], features["LoanPurpose"],
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
        ))
        app_id = cur.fetchone()[0]
        conn.commit()
        return app_id
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def get_application_by_loan_id(loan_id: str) -> dict | None:
    """Get the most recent application for a given loan_id."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, loan_id, age, annual_income, education, employment_type,
               months_employed, existing_monthly_debt, loan_amount, loan_purpose,
               loan_term, marital_status, has_mortgage, has_dependents, has_cosigner,
               credit_score, num_credit_lines, interest_rate, dti_ratio,
               loan_to_income, credit_per_line, income_per_employment,
               interest_burden, high_dti_flag, low_credit_flag,
               monthly_income, estimated_emi, emi_to_income,
               disposable_income, income_after_emi,
               creditscore_bucket, income_group, employment_stability, loan_burden,
               ml_prediction, ml_probability, shap_values,
               decision, decided_by, decision_note, decided_at, created_at
        FROM loan_applications
        WHERE loan_id = %s
        ORDER BY created_at DESC
        LIMIT 1;
    """, (loan_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    return _row_to_application(row)


def get_application_by_id(app_id: int) -> dict | None:
    """Get a specific application by its id."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, loan_id, age, annual_income, education, employment_type,
               months_employed, existing_monthly_debt, loan_amount, loan_purpose,
               loan_term, marital_status, has_mortgage, has_dependents, has_cosigner,
               credit_score, num_credit_lines, interest_rate, dti_ratio,
               loan_to_income, credit_per_line, income_per_employment,
               interest_burden, high_dti_flag, low_credit_flag,
               monthly_income, estimated_emi, emi_to_income,
               disposable_income, income_after_emi,
               creditscore_bucket, income_group, employment_stability, loan_burden,
               ml_prediction, ml_probability, shap_values,
               decision, decided_by, decision_note, decided_at, created_at
        FROM loan_applications
        WHERE id = %s;
    """, (app_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    return _row_to_application(row)


def get_all_applications(decision_filter: str = None) -> list[dict]:
    """Get all applications, optionally filtered by decision status."""
    conn = get_connection()
    cur = conn.cursor()
    if decision_filter:
        cur.execute("""
            SELECT a.id, a.loan_id, a.age, a.annual_income, a.education, a.employment_type,
                   a.months_employed, a.existing_monthly_debt, a.loan_amount, a.loan_purpose,
                   a.loan_term, a.marital_status, a.has_mortgage, a.has_dependents, a.has_cosigner,
                   a.credit_score, a.num_credit_lines, a.interest_rate, a.dti_ratio,
                   a.loan_to_income, a.credit_per_line, a.income_per_employment,
                   a.interest_burden, a.high_dti_flag, a.low_credit_flag,
                   a.monthly_income, a.estimated_emi, a.emi_to_income,
                   a.disposable_income, a.income_after_emi,
                   a.creditscore_bucket, a.income_group, a.employment_stability, a.loan_burden,
                   a.ml_prediction, a.ml_probability, a.shap_values,
                   a.decision, a.decided_by, a.decision_note, a.decided_at, a.created_at,
                   u.full_name
            FROM loan_applications a
            JOIN loan_users u ON a.loan_id = u.loan_id
            WHERE a.decision = %s
            ORDER BY a.created_at DESC;
        """, (decision_filter,))
    else:
        cur.execute("""
            SELECT a.id, a.loan_id, a.age, a.annual_income, a.education, a.employment_type,
                   a.months_employed, a.existing_monthly_debt, a.loan_amount, a.loan_purpose,
                   a.loan_term, a.marital_status, a.has_mortgage, a.has_dependents, a.has_cosigner,
                   a.credit_score, a.num_credit_lines, a.interest_rate, a.dti_ratio,
                   a.loan_to_income, a.credit_per_line, a.income_per_employment,
                   a.interest_burden, a.high_dti_flag, a.low_credit_flag,
                   a.monthly_income, a.estimated_emi, a.emi_to_income,
                   a.disposable_income, a.income_after_emi,
                   a.creditscore_bucket, a.income_group, a.employment_stability, a.loan_burden,
                   a.ml_prediction, a.ml_probability, a.shap_values,
                   a.decision, a.decided_by, a.decision_note, a.decided_at, a.created_at,
                   u.full_name
            FROM loan_applications a
            JOIN loan_users u ON a.loan_id = u.loan_id
            ORDER BY a.created_at DESC;
        """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [_row_to_application(row, has_name=True) for row in rows]


def update_decision(app_id: int, decision: str, decided_by: str, note: str = "") -> bool:
    """Update the decision for a loan application."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE loan_applications
            SET decision = %s, decided_by = %s, decision_note = %s, decided_at = NOW()
            WHERE id = %s;
        """, (decision, decided_by, note, app_id))
        conn.commit()
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

    cur.execute("SELECT COUNT(*) FROM loan_applications;")
    total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM loan_applications WHERE decision = 'pending';")
    pending = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM loan_applications WHERE decision = 'approved';")
    approved = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM loan_applications WHERE decision = 'rejected';")
    rejected = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM loan_applications WHERE decision = 'hold';")
    hold = cur.fetchone()[0]

    cur.execute("SELECT AVG(ml_probability) FROM loan_applications;")
    avg_prob = cur.fetchone()[0] or 0.0

    cur.execute("SELECT COUNT(*) FROM loan_applications WHERE ml_prediction = 1;")
    high_risk = cur.fetchone()[0]

    cur.execute("""
        SELECT DATE(created_at), COUNT(*) FROM loan_applications
        GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 7;
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
    if has_name:
        result["full_name"] = row[42]
    return result