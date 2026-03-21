import pickle
import os
import pandas as pd
import shap

from src.pipeline import FeatureEngineer, ManualEncoder, OHEFixer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pipeline_path = os.path.join(BASE_DIR, 'artifacts', 'pipeline.pkl')

with open(pipeline_path, 'rb') as f:
    saved = pickle.load(f)

pipeline = saved['pipeline']
threshold = saved['threshold']

model = pipeline.named_steps['model']
preprocessor = pipeline[:-1]

explainer = shap.Explainer(model)


def predict(data: dict):
    df = pd.DataFrame([data])

    prob = pipeline.predict_proba(df)[0][1]
    prediction = 1 if prob >= threshold else 0

    transformed = preprocessor.transform(df)
    shap_values = explainer(transformed)

    values = shap_values.values[0]

    feature_map = [
        "Age","Income","LoanAmount","CreditScore","MonthsEmployed",
        "NumCreditLines","InterestRate","LoanTerm","DTIRatio",
        "Education","EmploymentType","MaritalStatus",
        "HasMortgage","HasDependents","LoanPurpose","HasCoSigner",
        "Loan_to_Income","Credit_per_Line","Income_per_Employment",
        "Interest_Burden","High_DTI_Flag","Low_Credit_Flag"
    ]

    mapped = []

    for i in range(min(len(values), len(feature_map))):
        mapped.append((feature_map[i], values[i]))

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

        shap_dict[fname] = f"{impact} ({direction})"

    return prediction, prob, shap_dict