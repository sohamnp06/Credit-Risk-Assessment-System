import pandas as pd
import pickle
import json

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

# =========================
# 1. LOAD DATA
# =========================
df = pd.read_csv("../data/loanDefaulter.csv")

# =========================
# 2. MANUAL ENCODING (ONLY if NOT already applied)
# =========================
df['LoanPurpose'] = df['LoanPurpose'].map({
    'Home': 0,
    'Auto': 1,
    'Education': 1,
    'Other': 2,
    'Business': 3
})

df['MaritalStatus'] = df['MaritalStatus'].map({
    "Single": 0,
    "Married": 1,
    "Divorced": 0
})

df['EmploymentType'] = df['EmploymentType'].map({
    'Full-time': 0,
    'Self-employed': 1,
    'Part-time': 2,
    'Unemployed': 3
})

df['Education'] = df['Education'].map({
    "High School": 1,
    "Bachelor's": 2,
    "Master's": 3,
    "PhD": 4
})

# =========================
# 3. SPLIT FEATURES / TARGET
# =========================
X = df.drop(columns=["Default", "LoanID"], errors="ignore")
y_true = df["Default"]

# =========================
# 4. LOAD PIPELINE
# =========================
with open("../artifacts/completeXgboost.pkl", "rb") as f:
    data = pickle.load(f)

pipeline = data["pipeline"]
threshold = data["threshold"]

# =========================
# 5. PREDICTIONS (PIPELINE HANDLES EVERYTHING)
# =========================
y_prob = pipeline.predict_proba(X)[:, 1]
y_pred = (y_prob >= threshold).astype(int)

# =========================
# 6. METRICS
# =========================
metrics = {
    "accuracy": float(accuracy_score(y_true, y_pred)),
    "precision": float(precision_score(y_true, y_pred)),
    "recall": float(recall_score(y_true, y_pred)),
    "f1_score": float(f1_score(y_true, y_pred)),
    "roc_auc": float(roc_auc_score(y_true, y_prob)),
    "confusion_matrix": confusion_matrix(y_true, y_pred).tolist()
}

# =========================
# 7. SAVE METRICS
# =========================
with open("metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)

print("✅ metrics.json created successfully")