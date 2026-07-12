"""
ML Prediction module.
Accepts a full feature dict (with derived features pre-computed by feature_engine.py)
and returns prediction, probability, and SHAP explanation.
"""

import pickle
import os
import pandas as pd
import shap

from src.pipeline import FeatureEngineer, ManualEncoder, OHEFixer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pipeline_path = os.path.join(BASE_DIR, "artifacts", "pipeline.pkl")

with open(pipeline_path, "rb") as f:
    saved = pickle.load(f)

pipeline  = saved["pipeline"]
threshold = saved["threshold"]

model       = pipeline.named_steps["model"]
preprocessor = pipeline[:-1]

explainer = shap.Explainer(model)


# Features the pipeline expects (must match training columns exactly)
PIPELINE_FEATURES = [
    "Age", "Income", "LoanAmount", "CreditScore", "MonthsEmployed",
    "NumCreditLines", "InterestRate", "LoanTerm", "DTIRatio",
    "Education", "EmploymentType", "MaritalStatus",
    "HasMortgage", "HasDependents", "LoanPurpose", "HasCoSigner",
]

SHAP_FEATURE_MAP = [
    "Age", "Income", "LoanAmount", "CreditScore", "MonthsEmployed",
    "NumCreditLines", "InterestRate", "LoanTerm", "DTIRatio",
    "Education", "EmploymentType", "MaritalStatus",
    "HasMortgage", "HasDependents", "LoanPurpose", "HasCoSigner",
    "Loan_to_Income", "Credit_per_Line", "Income_per_Employment",
    "Interest_Burden", "High_DTI_Flag", "Low_Credit_Flag",
]


def predict(features: dict) -> tuple[int, float, dict]:
    """
    Run ML prediction on a full feature dict.
    features should contain all keys from PIPELINE_FEATURES.
    Returns (prediction: int, probability: float, shap_dict: dict)
    """
    # Build DataFrame with only the columns the pipeline expects
    row = {k: features[k] for k in PIPELINE_FEATURES if k in features}
    df = pd.DataFrame([row])

    prob = pipeline.predict_proba(df)[0][1]
    prediction = 1 if prob >= threshold else 0

    # SHAP explanation
    try:
        transformed = preprocessor.transform(df)
        shap_values = explainer(transformed)
        values = shap_values.values[0]

        mapped = []
        for i in range(min(len(values), len(SHAP_FEATURE_MAP))):
            mapped.append((SHAP_FEATURE_MAP[i], float(values[i])))

        mapped = sorted(mapped, key=lambda x: abs(x[1]), reverse=True)
        top_5 = mapped[:5]

        shap_dict = {}
        for fname, val in top_5:
            if abs(val) > 0.5:
                impact = "High"
            elif abs(val) > 0.2:
                impact = "Medium"
            else:
                impact = "Low"

            direction = "↑ Risk" if val > 0 else "↓ Risk"
            shap_dict[fname] = {
                "impact": impact,
                "direction": direction,
                "value": round(val, 4),
                "label": f"{impact} ({direction})"
            }
    except Exception as e:
        print(f"[predictor] SHAP error: {e}")
        shap_dict = {}

    return prediction, float(prob), shap_dict