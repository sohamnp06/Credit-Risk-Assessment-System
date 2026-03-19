import pickle
import os
import pandas as pd

from src.pipeline import FeatureEngineer, ManualEncoder, OHEFixer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pipeline_path = os.path.join(BASE_DIR, 'artifacts', 'pipeline.pkl')

with open(pipeline_path, 'rb') as f:
    saved = pickle.load(f)

pipeline = saved['pipeline']
threshold = saved['threshold']


def predict(data: dict):
    df = pd.DataFrame([data])

    prob = pipeline.predict_proba(df)[0][1]
    prediction = 1 if prob >= threshold else 0

    return prediction, prob