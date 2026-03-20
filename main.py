from flask import Flask, request, jsonify
from src.predictor import predict
from database.db import insert_prediction
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/')
def home():
    return "Credit Risk API Running (PostgreSQL Connected)"


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


if __name__ == '__main__':
    app.run(debug=True)