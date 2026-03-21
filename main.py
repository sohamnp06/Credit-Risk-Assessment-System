from flask import Flask, json, request, jsonify
from src.predictor import predict
from database.db import insert_prediction
from flask_cors import CORS
import os 

app = Flask(__name__)
CORS(app)


@app.route('/')
def home():
    return "Credit Risk API Running (PostgreSQL Connected)"

@app.route('/dashboard', methods=['GET'])
def dashboard():
    try:
        from database.db import get_dashboard_data

        data = get_dashboard_data()

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/predict', methods=['GET', 'POST'])
def get_prediction():
    try:
        if request.method == 'GET':
            return jsonify({
                "message": "Use POST request with JSON data to get prediction"
            })

        data = request.get_json()

        if not data:
            return jsonify({"error": "No input data provided"})

        print("Incoming Data:", data)

        prediction, prob, shap_values = predict(data)

        print("Prediction:", prediction, "Probability:", prob)

        insert_prediction(data, prediction, prob)

        print("Inserted into DB")

        return jsonify({
            "prediction": int(prediction),
            "probability": float(prob),
            "shap_values": shap_values
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)})

@app.route('/approval-trend', methods=['GET'])
def approval_trend():
    from database.db import get_connection
    conn = get_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN prediction = 0 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN prediction = 1 THEN 1 ELSE 0 END) as defaulted
    FROM predictions
    GROUP BY DATE(created_at)
    ORDER BY date;
    """

    cursor.execute(query)
    rows = cursor.fetchall()

    result = []
    for row in rows:
        result.append({
            "date": str(row[0]),
            "approved": int(row[1]),
            "defaulted": int(row[2])
        })

    cursor.close()
    conn.close()

    return jsonify(result)

@app.route("/prediction-history", methods=["GET"])
def prediction_history():
    try:
        import psycopg2
        import os
        from flask import jsonify

        conn = psycopg2.connect(
            dbname="credit_risk_db",
            user="postgres",
            password="root",
            host="localhost",
            port="5432"
        )

        cursor = conn.cursor()

        query = """
        SELECT 
            id,
            prediction,
            probability,
            created_at
        FROM predictions
        ORDER BY created_at DESC
        LIMIT 100;
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        data = []
        for row in rows:
            data.append({
                "id": row[0],
                "prediction": row[1],
                "probability": float(row[2]),
                "created_at": row[3]
            })

        cursor.close()
        conn.close()

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)})
    
@app.route("/model-metrics", methods=["GET"])
def model_metrics():
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))

        # 👇 FIXED PATH
        metrics_path = os.path.join(base_dir, "credit-risk-ui", "metrics.json")

        with open(metrics_path, "r") as f:
            metrics = json.load(f)

        return jsonify(metrics)

    except Exception as e:
        return jsonify({"error": str(e)})
    
if __name__ == '__main__':
    app.run(debug=True)