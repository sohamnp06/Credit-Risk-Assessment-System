"""
Feature Engineering Module
- Simulates credit bureau data (CreditScore, NumCreditLines, InterestRate)
- Computes all 15 derived ML features from raw inputs
- Consistent with the training pipeline in src/pipeline.py
"""

import math
import random


# ─── Bureau Simulation ──────────────────────────────────────────────────────

def simulate_bureau_data(age: int, annual_income: float, seed_extra: int = 0) -> dict:
    """
    Simulate credit bureau data deterministically based on applicant attributes.
    Uses a seeded random so the same inputs always produce the same values.
    """
    seed = int(age * 1000 + annual_income / 100 + seed_extra)
    rng = random.Random(seed)

    # CreditScore: 300–900, higher income / older → slightly higher
    base_score = 500
    income_boost = min(200, annual_income / 1000)  # up to +200 for high income
    age_boost = min(100, (age - 20) * 2)           # up to +100 for older applicants
    noise = rng.uniform(-80, 80)
    credit_score = int(min(900, max(300, base_score + income_boost + age_boost + noise)))

    # NumCreditLines: 1–15
    num_credit_lines = rng.randint(1, 10)

    # InterestRate: lower credit score → higher rate (range 5%–25%)
    if credit_score >= 750:
        rate = rng.uniform(5.0, 10.0)
    elif credit_score >= 650:
        rate = rng.uniform(8.0, 14.0)
    elif credit_score >= 550:
        rate = rng.uniform(12.0, 18.0)
    else:
        rate = rng.uniform(16.0, 25.0)

    interest_rate = round(rate, 2)

    return {
        "CreditScore":      credit_score,
        "NumCreditLines":   num_credit_lines,
        "InterestRate":     interest_rate,
    }


# ─── DTI Computation ─────────────────────────────────────────────────────────

def compute_dti_ratio(existing_monthly_debt: float, annual_income: float) -> float:
    """DTI = monthly debt / monthly income"""
    monthly_income = annual_income / 12.0
    if monthly_income <= 0:
        return 0.0
    return round(existing_monthly_debt / monthly_income, 4)


# ─── CreditScore Bucket ───────────────────────────────────────────────────────

def get_creditscore_bucket(credit_score: int) -> str:
    if credit_score < 550:
        return "Poor"
    elif credit_score < 650:
        return "Fair"
    elif credit_score < 750:
        return "Good"
    elif credit_score < 800:
        return "Very Good"
    else:
        return "Excellent"


# ─── Income Group ────────────────────────────────────────────────────────────

def get_income_group(annual_income: float) -> str:
    if annual_income < 30000:
        return "Low"
    elif annual_income < 70000:
        return "Medium"
    elif annual_income < 150000:
        return "High"
    else:
        return "Very High"


# ─── Employment Stability ────────────────────────────────────────────────────

EMPLOYMENT_WEIGHTS = {
    "Salaried":     1.0,
    "Self-Employed": 0.7,
    "Unemployed":   0.2,
}

def compute_employment_stability(months_employed: int, employment_type: str) -> float:
    weight = EMPLOYMENT_WEIGHTS.get(employment_type, 0.5)
    return round(months_employed * weight, 4)


# ─── EMI Formula ─────────────────────────────────────────────────────────────

def compute_emi(principal: float, annual_rate_pct: float, months: int) -> float:
    """Standard EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)"""
    if months <= 0:
        return 0.0
    r = annual_rate_pct / (12.0 * 100.0)
    if r == 0:
        return principal / months
    n = months
    emi = principal * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)
    return round(emi, 4)


# ─── Main Feature Engine ──────────────────────────────────────────────────────

def compute_all_features(user_inputs: dict) -> dict:
    """
    Takes 13 user-input fields + simulated bureau data and returns
    the full feature dict ready for ML prediction.

    user_inputs keys (user-entered):
        age, annual_income, education, employment_type, months_employed,
        existing_monthly_debt, loan_amount, loan_purpose, loan_term,
        marital_status, has_mortgage, has_dependents, has_cosigner

    Returns full dict including all derived features.
    """
    age             = int(user_inputs["age"])
    income          = float(user_inputs["annual_income"])
    education       = user_inputs["education"]
    employment_type = user_inputs["employment_type"]
    months_employed = int(user_inputs["months_employed"])
    monthly_debt    = float(user_inputs["existing_monthly_debt"])
    loan_amount     = float(user_inputs["loan_amount"])
    loan_purpose    = user_inputs["loan_purpose"]
    loan_term       = int(user_inputs["loan_term"])
    marital_status  = user_inputs["marital_status"]
    has_mortgage    = int(user_inputs["has_mortgage"])
    has_dependents  = int(user_inputs["has_dependents"])
    has_cosigner    = int(user_inputs["has_cosigner"])

    # ── Bureau simulation ──
    bureau = simulate_bureau_data(age, income)
    credit_score     = bureau["CreditScore"]
    num_credit_lines = bureau["NumCreditLines"]
    interest_rate    = bureau["InterestRate"]

    # ── DTI ──
    dti_ratio = compute_dti_ratio(monthly_debt, income)

    # ── Derived features ──
    loan_to_income         = loan_amount / (income + 1e-6)
    credit_per_line        = credit_score / (num_credit_lines + 1)
    income_per_employment  = income / (months_employed + 1)
    interest_burden        = interest_rate * loan_term          # InterestRate * LoanTerm (matches pipeline)
    high_dti_flag          = 1 if dti_ratio > 0.4 else 0
    low_credit_flag        = 1 if credit_score < 600 else 0

    monthly_income         = income / 12.0
    estimated_emi          = compute_emi(loan_amount, interest_rate, loan_term)
    emi_to_income          = estimated_emi / (monthly_income + 1e-6)
    disposable_income      = income - (income * dti_ratio)
    income_after_emi       = disposable_income - estimated_emi

    creditscore_bucket     = get_creditscore_bucket(credit_score)
    income_group           = get_income_group(income)
    employment_stability   = compute_employment_stability(months_employed, employment_type)
    loan_burden            = loan_amount / (income + 1e-6)      # same as Loan_to_Income per training

    return {
        # Raw user inputs
        "Age":              age,
        "Income":           income,
        "LoanAmount":       loan_amount,
        "MonthsEmployed":   months_employed,
        "LoanTerm":         loan_term,
        "Education":        education,
        "EmploymentType":   employment_type,
        "MaritalStatus":    marital_status,
        "HasMortgage":      has_mortgage,
        "HasDependents":    has_dependents,
        "LoanPurpose":      loan_purpose,
        "HasCoSigner":      has_cosigner,

        # Bureau-simulated
        "CreditScore":      credit_score,
        "NumCreditLines":   num_credit_lines,
        "InterestRate":     interest_rate,
        "DTIRatio":         dti_ratio,

        # Derived features
        "Loan_to_Income":          loan_to_income,
        "Credit_per_Line":         credit_per_line,
        "Income_per_Employment":   income_per_employment,
        "Interest_Burden":         interest_burden,
        "High_DTI_Flag":           high_dti_flag,
        "Low_Credit_Flag":         low_credit_flag,
        "Monthly_Income":          monthly_income,
        "Estimated_EMI":           estimated_emi,
        "EMI_to_Income":           emi_to_income,
        "Disposable_Income":       disposable_income,
        "Income_After_EMI":        income_after_emi,
        "CreditScore_Bucket":      creditscore_bucket,
        "Income_Group":            income_group,
        "Employment_Stability":    employment_stability,
        "Loan_Burden":             loan_burden,

        # Store separately for DB (user-entered)
        "_existing_monthly_debt":  monthly_debt,
    }
