import psycopg2
import os

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="credit_risk_db",
        user="postgres",
        password="root"
    )

def insert_prediction(data, prediction, probability):
    conn = get_connection()
    cur = conn.cursor()

    query = """
    INSERT INTO predictions (
        loan_id, age, income, loanamount, creditscore,
        monthsemployed, numcreditlines, interestrate, loanterm, dtiratio,
        education, employmenttype, maritalstatus,
        hasmortgage, hasdependents, loanpurpose, hascosigner,
        loan_to_income, credit_per_line, income_per_employment,
        interest_burden, high_dti_flag, low_credit_flag,
        prediction, probability
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s,
            %s, %s)
    """

    # Derived features (IMPORTANT)
    loan_to_income = data['LoanAmount'] / data['Income'] if data['Income'] != 0 else 0
    credit_per_line = data['CreditScore'] / data['NumCreditLines'] if data['NumCreditLines'] != 0 else 0
    income_per_employment = data['Income'] / data['MonthsEmployed'] if data['MonthsEmployed'] != 0 else 0
    interest_burden = data['LoanAmount'] * (data['InterestRate'] / 100)

    high_dti_flag = 1 if data['DTIRatio'] > 0.4 else 0
    low_credit_flag = 1 if data['CreditScore'] < 600 else 0

    values = (
        data.get('LoanID', 0),
        data['Age'],
        data['Income'],
        data['LoanAmount'],
        data['CreditScore'],
        data['MonthsEmployed'],
        data['NumCreditLines'],
        data['InterestRate'],
        data['LoanTerm'],
        data['DTIRatio'],
        data['Education'],
        data['EmploymentType'],
        data['MaritalStatus'],
        data['HasMortgage'],
        data['HasDependents'],
        data['LoanPurpose'],
        data['HasCoSigner'],
        loan_to_income,
        credit_per_line,
        income_per_employment,
        interest_burden,
        high_dti_flag,
        low_credit_flag,
        int(prediction),
        float(probability)
    )

    cur.execute(query, values)
    conn.commit()

    cur.close()
    conn.close()
    
def get_dashboard_data():
    conn = get_connection()
    cur = conn.cursor()

    # Total applications
    cur.execute("SELECT COUNT(*) FROM predictions;")
    total = cur.fetchone()[0]

    # Default count (prediction = 1)
    cur.execute("SELECT COUNT(*) FROM predictions WHERE prediction = 1;")
    defaults = cur.fetchone()[0]

    # Avg probability
    cur.execute("SELECT AVG(probability) FROM predictions;")
    avg_prob = cur.fetchone()[0] or 0

    # Approval rate (prediction = 0)
    approval_rate = 0
    if total > 0:
        approval_rate = round(((total - defaults) / total) * 100, 2)

    default_rate = 0
    if total > 0:
        default_rate = round((defaults / total) * 100, 2)

    # Risk distribution
    cur.execute("""
        SELECT 
            CASE 
                WHEN probability < 0.3 THEN 'Low'
                WHEN probability < 0.6 THEN 'Medium'
                ELSE 'High'
            END AS risk,
            COUNT(*)
        FROM predictions
        GROUP BY risk;
    """)

    risk_rows = cur.fetchall()

    risk_distribution = [
        {"risk": row[0], "count": row[1]} for row in risk_rows
    ]

    cur.close()
    conn.close()

    return {
        "total": total,
        "approval_rate": approval_rate,
        "default_rate": default_rate,
        "avg_risk": round(avg_prob, 2),
        "risk_distribution": risk_distribution
    }