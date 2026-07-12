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
    cur.execute("DROP TABLE IF EXISTS users CASCADE;")
    cur.execute("DROP TABLE IF EXISTS loan_applications CASCADE;")
    cur.execute("DROP TABLE IF EXISTS loan_users CASCADE;")
    cur.execute("DROP TABLE IF EXISTS loan_id_sequence CASCADE;")
    cur.execute("DROP TABLE IF EXISTS employees CASCADE;")
    cur.execute("DROP TABLE IF EXISTS loan_dataset CASCADE;")


def create_tables(cur):
    print("  Creating loan_users table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS loan_users (
            loan_id     VARCHAR(20) PRIMARY KEY,
            full_name   VARCHAR(255) NOT NULL,
            password_hash BYTEA NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    print("  Creating loan_id_sequence table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS loan_id_sequence (
            id SERIAL PRIMARY KEY,
            last_val INTEGER NOT NULL DEFAULT 0
        );
    """)
    # Insert initial row if not present
    cur.execute("SELECT COUNT(*) FROM loan_id_sequence;")
    if cur.fetchone()[0] == 0:
        cur.execute("INSERT INTO loan_id_sequence (last_val) VALUES (0);")

    print("  Creating loan_applications table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS loan_applications (
            id                  SERIAL PRIMARY KEY,
            loan_id             VARCHAR(20) NOT NULL REFERENCES loan_users(loan_id),

            -- User-entered fields (13 ML features)
            age                 INTEGER,
            annual_income       FLOAT,
            education           VARCHAR(100),
            employment_type     VARCHAR(100),
            months_employed     INTEGER,
            existing_monthly_debt FLOAT,
            loan_amount         FLOAT,
            loan_purpose        VARCHAR(100),
            loan_term           INTEGER,
            marital_status      VARCHAR(100),
            has_mortgage        INTEGER,
            has_dependents      INTEGER,
            has_cosigner        INTEGER,

            -- Bureau-simulated fields
            credit_score        INTEGER,
            num_credit_lines    INTEGER,
            interest_rate       FLOAT,
            dti_ratio           FLOAT,

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

            -- ML Output
            ml_prediction       INTEGER,
            ml_probability      FLOAT,
            shap_values         TEXT,

            -- Employee Decision
            decision            VARCHAR(20) DEFAULT 'pending',
            decided_by          VARCHAR(255),
            decision_note       TEXT,
            decided_at          TIMESTAMP,

            created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    print("  Creating employees table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            id          SERIAL PRIMARY KEY,
            username    VARCHAR(100) UNIQUE NOT NULL,
            password_hash BYTEA NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    print("  Creating loan_dataset table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS loan_dataset (
            id              SERIAL PRIMARY KEY,
            loan_id_orig    VARCHAR(50),
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
            default_flag    INTEGER
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

    print(f"  Checking if loan_dataset already has data...")
    cur.execute("SELECT COUNT(*) FROM loan_dataset;")
    count = cur.fetchone()[0]
    if count > 0:
        print(f"  loan_dataset already has {count} rows — skipping import.")
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

            batch.append((
                row.get('LoanID', ''),
                safe_int(row.get('Age')),
                safe_float(row.get('Income')),
                safe_float(row.get('LoanAmount')),
                safe_int(row.get('CreditScore')),
                safe_int(row.get('MonthsEmployed')),
                safe_int(row.get('NumCreditLines')),
                safe_float(row.get('InterestRate')),
                safe_int(row.get('LoanTerm')),
                safe_float(row.get('DTIRatio')),
                row.get('Education', ''),
                row.get('EmploymentType', ''),
                row.get('MaritalStatus', ''),
                yesno(row.get('HasMortgage', 0)),
                yesno(row.get('HasDependents', 0)),
                row.get('LoanPurpose', ''),
                yesno(row.get('HasCoSigner', 0)),
                safe_int(row.get('Default', 0)),
            ))

            if len(batch) >= 500:
                cur.executemany("""
                    INSERT INTO loan_dataset (
                        loan_id_orig, age, income, loan_amount, credit_score,
                        months_employed, num_credit_lines, interest_rate, loan_term,
                        dti_ratio, education, employment_type, marital_status,
                        has_mortgage, has_dependents, loan_purpose, has_cosigner, default_flag
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, batch)
                total += len(batch)
                batch = []
                print(f"    → Imported {total} rows...", end="\r")

        if batch:
            cur.executemany("""
                INSERT INTO loan_dataset (
                    loan_id_orig, age, income, loan_amount, credit_score,
                    months_employed, num_credit_lines, interest_rate, loan_term,
                    dti_ratio, education, employment_type, marital_status,
                    has_mortgage, has_dependents, loan_purpose, has_cosigner, default_flag
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, batch)
            total += len(batch)

    print(f"\n  ✓ Dataset import complete: {total} rows.")


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
            print("\n[4/4] Importing dataset...")
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            csv_path = os.path.join(base_dir, "data", "loanDefaulter.csv")
            import_dataset(cur, csv_path)
        else:
            print("\n[4/4] Skipping dataset import (import_data=False).")

        conn.commit()
        print("\n✅ Database setup complete!\n")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR Setup failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    # Pass --no-import to skip CSV import (faster for testing)
    import_data = "--no-import" not in sys.argv
    setup_db(import_data=import_data)
