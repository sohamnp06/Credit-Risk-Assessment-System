import psycopg2

def setup_db():
    try:
        conn = psycopg2.connect(
            dbname="credit_risk_db",
            user="postgres",
            password="root",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password BYTEA NOT NULL,
                role VARCHAR(50) DEFAULT 'analyst',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id SERIAL PRIMARY KEY,
                loan_id INTEGER,
                age INTEGER,
                income FLOAT,
                loanamount FLOAT,
                creditscore INTEGER,
                monthsemployed INTEGER,
                numcreditlines INTEGER,
                interestrate FLOAT,
                loanterm INTEGER,
                dtiratio FLOAT,
                education VARCHAR(100),
                employmenttype VARCHAR(100),
                maritalstatus VARCHAR(100),
                hasmortgage INTEGER,
                hasdependents INTEGER,
                loanpurpose VARCHAR(100),
                hascosigner INTEGER,
                loan_to_income FLOAT,
                credit_per_line FLOAT,
                income_per_employment FLOAT,
                interest_burden FLOAT,
                high_dti_flag INTEGER,
                low_credit_flag INTEGER,
                prediction INTEGER,
                probability FLOAT,
                shap_values TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("Database setup successfully")
    except Exception as e:
        print(f"Error setting up database: {e}")

if __name__ == "__main__":
    setup_db()
