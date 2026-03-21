from flask import Flask, request, jsonify
from src.predictor import predict
from database.db import insert_prediction
from flask_cors import CORS

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

if __name__ == '__main__':
    app.run(debug=True)