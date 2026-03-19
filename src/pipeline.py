import pandas as pd
import numpy as np
import pickle
import os
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class FeatureEngineer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        X['Loan_to_Income'] = X['LoanAmount'] / (X['Income'] + 1e-6)
        X['Credit_per_Line'] = X['CreditScore'] / (X['NumCreditLines'] + 1)
        X['Income_per_Employment'] = X['Income'] / (X['MonthsEmployed'] + 1)
        X['Interest_Burden'] = X['InterestRate'] * X['LoanTerm']
        X['High_DTI_Flag'] = (X['DTIRatio'] > 0.4).astype(int)
        X['Low_Credit_Flag'] = (X['CreditScore'] < 600).astype(int)
        return X

class ManualEncoder(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        loan_purpose_map = {'Home': 0, 'Auto': 1, 'Education': 2, 'Business': 3, 'Other': 4}
        marital_map = {'Single': 0, 'Married': 1, 'Divorced': 2}
        employment_map = {'Salaried': 0, 'Self-Employed': 1, 'Unemployed': 2}
        education_map = {'High School': 0, 'Bachelor': 1, 'Master': 2, 'PhD': 3}

        X['LoanPurpose'] = X['LoanPurpose'].map(loan_purpose_map)
        X['MaritalStatus'] = X['MaritalStatus'].map(marital_map)
        X['EmploymentType'] = X['EmploymentType'].map(employment_map)
        X['Education'] = X['Education'].map(education_map)

        return X

class OHEFixer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        cols = ['HasMortgage', 'HasDependents', 'HasCoSigner', 'High_DTI_Flag', 'Low_Credit_Flag']
        for col in cols:
            X[col] = X[col].astype(str)
        return X

numerical_cols = [
    'Age', 'Income', 'LoanAmount', 'CreditScore', 'MonthsEmployed',
    'NumCreditLines', 'InterestRate', 'LoanTerm', 'DTIRatio',
    'Loan_to_Income', 'Credit_per_Line', 'Income_per_Employment',
    'Interest_Burden'
]

manual_encoded_cols = [
    'LoanPurpose', 'MaritalStatus', 'EmploymentType', 'Education'
]

ohe_cols = [
    'HasMortgage', 'HasDependents', 'HasCoSigner',
    'High_DTI_Flag', 'Low_Credit_Flag'
]

preprocessor = ColumnTransformer(
    transformers=[
        ('num', 'passthrough', numerical_cols),
        ('manual', 'passthrough', manual_encoded_cols),
        ('ohe', OneHotEncoder(handle_unknown='ignore'), ohe_cols)
    ]
)

model_path = os.path.join(BASE_DIR, 'artifacts', 'tunedXgboost.pkl')
with open(model_path, 'rb') as f:
    model_data = pickle.load(f)

model = model_data['model']
threshold = model_data['threshold']

pipeline = Pipeline([
    ('feature_engineering', FeatureEngineer()),
    ('manual_encoding', ManualEncoder()),
    ('ohe_fix', OHEFixer()),
    ('preprocessing', preprocessor),
    ('model', model)
])

data_path = os.path.join(BASE_DIR, 'data', 'loanDefaulter.csv')
df = pd.read_csv(data_path)

X = df.drop(columns=['Default', 'LoanID'], errors='ignore')
y = df['Default']

pipeline.fit(X, y)

pipeline_path = os.path.join(BASE_DIR, 'artifacts', 'pipeline.pkl')
with open(pipeline_path, 'wb') as f:
    pickle.dump({
        'pipeline': pipeline,
        'threshold': threshold
    }, f)

print("Pipeline saved successfully!")

def predict(data_dict):
    pipeline_path = os.path.join(BASE_DIR, 'artifacts', 'pipeline.pkl')
    with open(pipeline_path, 'rb') as f:
        saved = pickle.load(f)

    pipeline = saved['pipeline']
    threshold = saved['threshold']

    df = pd.DataFrame([data_dict])

    prob = pipeline.predict_proba(df)[0][1]
    prediction = 1 if prob >= threshold else 0

    return prediction, prob

