"""
Database Setup Script
- Drops old tables, creates new schema
- Seeds 3 employee accounts
- Optionally imports loanDefaulter.csv into loan_dataset table
"""

import psycopg2
import bcrypt
import os
import csv
import sys
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "dbname":   os.getenv("DB_NAME", "credit_risk_db"),
    "user":     os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASS", "root"),
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     os.getenv("DB_PORT", "5432"),
}

EMPLOYEES = [
    ("admin", "admin"),
    ("soham", "soham"),
    ("bank",  "bank"),
]

def get_conn():
    return psycopg2.connect(**DB_CONFIG)


def drop_old_tables(cur):
    print("  Dropping old tables (if exist)...")
    cur.execute("DROP TABLE IF EXISTS predictions CASCADE;")
    cur.execute("DROP TABLE IF EXISTS loan_applications CASCADE;")
    cur.execute("DROP TABLE IF EXISTS loan_users CASCADE;")
    cur.execute("DROP TABLE IF EXISTS loan_id_sequence CASCADE;")
    cur.execute("DROP TABLE IF EXISTS employees CASCADE;")
    cur.execute("DROP TABLE IF EXISTS loan_dataset CASCADE;")  # legacy name
    cur.execute("DROP TABLE IF EXISTS users CASCADE;")  # dataset archive table


from datetime import datetime

def create_tables(cur):
    print("  Creating employees table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            id            SERIAL PRIMARY KEY,
            username      VARCHAR(100) UNIQUE NOT NULL,
            password_hash BYTEA NOT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date          VARCHAR(50)
        );
    """)

    print("  Creating users table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id              SERIAL PRIMARY KEY,
            loan_id         VARCHAR(50) UNIQUE NOT NULL,
            full_name       VARCHAR(255) NOT NULL,
            password_hash   BYTEA,
            gender          VARCHAR(50),
            age             INTEGER,
            income          FLOAT,
            loan_amount     FLOAT,
            credit_score    INTEGER,
            months_employed INTEGER,
            num_credit_lines INTEGER,
            interest_rate   FLOAT,
            loan_term       INTEGER,
            dti_ratio       FLOAT,
            education       VARCHAR(100),
            employment_type VARCHAR(100),
            marital_status  VARCHAR(100),
            has_mortgage    INTEGER,
            has_dependents  INTEGER,
            loan_purpose    VARCHAR(100),
            has_cosigner    INTEGER,
            default_flag    INTEGER,

            -- Derived features
            loan_to_income          FLOAT,
            credit_per_line         FLOAT,
            income_per_employment   FLOAT,
            interest_burden         FLOAT,
            high_dti_flag           INTEGER,
            low_credit_flag         INTEGER,
            monthly_income          FLOAT,
            estimated_emi           FLOAT,
            emi_to_income           FLOAT,
            disposable_income       FLOAT,
            income_after_emi        FLOAT,
            creditscore_bucket      VARCHAR(50),
            income_group            VARCHAR(50),
            employment_stability    FLOAT,
            loan_burden             FLOAT,

            -- ML Output & Decision
            ml_prediction       INTEGER,
            ml_probability      FLOAT,
            shap_values         TEXT,

            decision            VARCHAR(20) DEFAULT 'pending',
            decided_by          VARCHAR(255),
            decision_note       TEXT,
            decided_at          TIMESTAMP,

            date                DATE,
            created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)


def seed_employees(cur):
    print("  Seeding employee accounts...")
    for username, password in EMPLOYEES:
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        cur.execute(
            "INSERT INTO employees (username, password_hash) VALUES (%s, %s) ON CONFLICT (username) DO NOTHING;",
            (username, hashed)
        )
        print(f"    -> Employee '{username}' seeded.")


def import_dataset(cur, csv_path):
    if not os.path.exists(csv_path):
        print(f"  ⚠ CSV not found at {csv_path}, skipping dataset import.")
        return

    print(f"  Checking if users table already has data...")
    cur.execute("SELECT COUNT(*) FROM users;")
    count = cur.fetchone()[0]
    if count > 0:
        print(f"  users table already has {count} rows -- skipping import.")
        return

    print(f"  Importing dataset from {csv_path} ...")
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        batch = []
        total = 0
        for row in reader:
            def safe_int(v):
                try:
                    return int(float(v)) if v not in ('', None) else None
                except:
                    return None

            def safe_float(v):
                try:
                    return float(v) if v not in ('', None) else None
                except:
                    return None

            def yesno(v):
                if isinstance(v, str):
                    return 1 if v.strip().lower() in ('yes', '1', 'true') else 0
                return int(v) if v is not None else 0

            # Parse date
            date_str = row.get('Date', '')
            parsed_date = None
            if date_str:
                try:
                    parsed_date = datetime.strptime(date_str.strip(), '%d-%m-%Y').date()
                except:
                    try:
                        parsed_date = datetime.strptime(date_str.strip(), '%Y-%m-%d').date()
                    except:
                        parsed_date = None

            default_val = safe_int(row.get('Default', 0)) or 0
            decision_val = 'rejected' if default_val == 1 else 'approved'

            # Pre-populate some derived calculations if they exist in CSV, otherwise calculate them
            income = safe_float(row.get('Income'))
            loan_amount = safe_float(row.get('LoanAmount'))
            interest_rate = safe_float(row.get('InterestRate'))
            loan_term = safe_int(row.get('LoanTerm'))
            dti_ratio = safe_float(row.get('DTIRatio'))
            credit_score = safe_int(row.get('CreditScore'))
            num_credit_lines = safe_int(row.get('NumCreditLines'))
            months_employed = safe_int(row.get('MonthsEmployed'))
            employment_type = row.get('EmploymentType', '')

            loan_to_income = safe_float(row.get('Loan_to_Income')) or (loan_amount / income if income and loan_amount else 0.0)
            credit_per_line = safe_float(row.get('Credit_per_Line')) or (credit_score / (num_credit_lines + 1) if credit_score and num_credit_lines is not None else 0.0)
            income_per_employment = safe_float(row.get('Income_per_Employment')) or (income / (months_employed + 1) if income and months_employed is not None else 0.0)
            interest_burden = safe_float(row.get('Interest_Burden')) or (interest_rate * loan_term if interest_rate and loan_term else 0.0)
            high_dti_flag = safe_int(row.get('High_DTI_Flag')) or (1 if dti_ratio and dti_ratio > 0.4 else 0)
            low_credit_flag = safe_int(row.get('Low_Credit_Flag')) or (1 if credit_score and credit_score < 600 else 0)

            monthly_income = income / 12.0 if income else 0.0
            estimated_emi = (loan_amount * (interest_rate / 1200) * ((1 + interest_rate / 1200) ** loan_term) / (((1 + interest_rate / 1200) ** loan_term) - 1)) if loan_amount and interest_rate and loan_term else 0.0
            emi_to_income = estimated_emi / monthly_income if monthly_income else 0.0
            disposable_income = income - (income * dti_ratio) if income and dti_ratio else 0.0
            income_after_emi = disposable_income - estimated_emi

            creditscore_bucket = "Poor" if credit_score and credit_score < 550 else "Fair" if credit_score and credit_score < 650 else "Good" if credit_score and credit_score < 750 else "Very Good" if credit_score and credit_score < 800 else "Excellent"
            income_group = "Low" if income and income < 30000 else "Medium" if income and income < 70000 else "High" if income and income < 150000 else "Very High"
            emp_weight = 1.0 if employment_type == "Salaried" else 0.7 if employment_type == "Self-Employed" else 0.2
            employment_stability = months_employed * emp_weight if months_employed else 0.0
            loan_burden = loan_to_income

            batch.append((
                row.get('LoanID', ''),
                row.get('Name-Surname', 'Unknown Applicant'),
                row.get('Gender', 'Unknown'),
                safe_int(row.get('Age')),
                income,
                loan_amount,
                credit_score,
                months_employed,
                num_credit_lines,
                interest_rate,
                loan_term,
                dti_ratio,
                row.get('Education', ''),
                employment_type,
                row.get('MaritalStatus', ''),
                yesno(row.get('HasMortgage', 0)),
                yesno(row.get('HasDependents', 0)),
                row.get('LoanPurpose', ''),
                yesno(row.get('HasCoSigner', 0)),
                default_val,
                loan_to_income,
                credit_per_line,
                income_per_employment,
                interest_burden,
                high_dti_flag,
                low_credit_flag,
                monthly_income,
                estimated_emi,
                emi_to_income,
                disposable_income,
                income_after_emi,
                creditscore_bucket,
                income_group,
                employment_stability,
                loan_burden,
                default_val,            # ml_prediction (map from Default)
                float(default_val),     # ml_probability (1.0 or 0.0)
                '{}',                   # shap_values
                decision_val,           # decision
                parsed_date             # date
            ))

            if len(batch) >= 500:
                cur.executemany("""
                    INSERT INTO users (
                        loan_id, full_name, gender, age, income, loan_amount, credit_score,
                        months_employed, num_credit_lines, interest_rate, loan_term,
                        dti_ratio, education, employment_type, marital_status,
                        has_mortgage, has_dependents, loan_purpose, has_cosigner, default_flag,
                        loan_to_income, credit_per_line, income_per_employment,
                        interest_burden, high_dti_flag, low_credit_flag,
                        monthly_income, estimated_emi, emi_to_income,
                        disposable_income, income_after_emi,
                        creditscore_bucket, income_group, employment_stability, loan_burden,
                        ml_prediction, ml_probability, shap_values, decision, date
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, batch)
                total += len(batch)
                batch = []
                print(f"    >> Imported {total} rows...", end="\r")

        if batch:
            cur.executemany("""
                INSERT INTO users (
                    loan_id, full_name, gender, age, income, loan_amount, credit_score,
                    months_employed, num_credit_lines, interest_rate, loan_term,
                    dti_ratio, education, employment_type, marital_status,
                    has_mortgage, has_dependents, loan_purpose, has_cosigner, default_flag,
                    loan_to_income, credit_per_line, income_per_employment,
                    interest_burden, high_dti_flag, low_credit_flag,
                    monthly_income, estimated_emi, emi_to_income,
                    disposable_income, income_after_emi,
                    creditscore_bucket, income_group, employment_stability, loan_burden,
                    ml_prediction, ml_probability, shap_values, decision, date
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, batch)
            total += len(batch)

    print(f"\n  [OK] Dataset import complete: {total} rows into 'users' table.")


def setup_db(import_data=True):
    conn = get_conn()
    cur = conn.cursor()

    try:
        print("\n[1/4] Dropping old tables...")
        drop_old_tables(cur)

        print("\n[2/4] Creating new tables...")
        create_tables(cur)

        print("\n[3/4] Seeding employees...")
        seed_employees(cur)

        if import_data:
            print("\n[4/4] Importing dataset into 'users' table...")
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            csv_path = os.path.join(base_dir, "data", "loanDefaulter.csv")
            import_dataset(cur, csv_path)
        else:
            print("\n[4/4] Skipping dataset import (import_data=False).")

        conn.commit()
        print("\n[OK] Database setup complete!")
        print("   Tables: employees, users")
        print()

    except Exception as e:
        conn.rollback()
        print(f"\n[ERR] Setup failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    # Pass --no-import to skip CSV import (faster for testing)
    import_data = "--no-import" not in sys.argv
    setup_db(import_data=import_data)

