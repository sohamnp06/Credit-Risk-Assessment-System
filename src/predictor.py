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

    try:
        feature_names = preprocessor.get_feature_names_out()
    except:
        feature_names = [f"feature_{i}" for i in range(transformed.shape[1])]

    shap_pairs = list(zip(feature_names, shap_values.values[0]))

    shap_pairs = sorted(shap_pairs, key=lambda x: abs(x[1]), reverse=True)

    top_5 = shap_pairs[:5]

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