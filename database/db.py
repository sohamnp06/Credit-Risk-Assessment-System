import psycopg2

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="credit_risk_db",
        user="postgres",
        password="root",
        port="5432"
    )


def insert_prediction(data, prediction, probability):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO predictions (
            age, income, loan_amount, credit_score,
            months_employed, num_credit_lines,
            interest_rate, loan_term, dti_ratio,
            education, employment_type, marital_status,
            has_mortgage, has_dependents,
            loan_purpose, has_cosigner,
            prediction, probability
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        data.get("Age"),
        data.get("Income"),
        data.get("LoanAmount"),
        data.get("CreditScore"),
        data.get("MonthsEmployed"),
        data.get("NumCreditLines"),
        data.get("InterestRate"),
        data.get("LoanTerm"),
        data.get("DTIRatio"),
        data.get("Education"),
        data.get("EmploymentType"),
        data.get("MaritalStatus"),
        data.get("HasMortgage"),
        data.get("HasDependents"),
        data.get("LoanPurpose"),
        data.get("HasCoSigner"),
        prediction,
        probability
    ))

    conn.commit()
    cursor.close()
    conn.close()