from flask import Flask, request, jsonify, send_file
from src.predictor import predict
from database.db import insert_prediction, get_connection
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from auth import auth
import os
import json
import io
from dotenv import load_dotenv

# Load .env
load_dotenv()

# PDF
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "super-secret-key")

jwt = JWTManager(app)
app.register_blueprint(auth, url_prefix="/auth")


# =========================
# HOME
# =========================
@app.route('/')
def home():
    return "Credit Risk API Running (PostgreSQL Connected)"


# =========================
# DASHBOARD
# =========================
@app.route('/dashboard', methods=['GET'])
def dashboard():
    try:
        from database.db import get_dashboard_data
        data = get_dashboard_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)})


# =========================
# PREDICT
# =========================
@app.route('/predict', methods=['POST'])
def get_prediction():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No input data provided"})

        print("Incoming Data:", data)

        prediction, prob, shap_values = predict(data)

        print("Prediction:", prediction, "Probability:", prob)

        # ✅ STORE EVERYTHING (IMPORTANT)
        insert_prediction(
            data,                 # features
            prediction,
            prob,
            shap_values           # shap
        )

        return jsonify({
            "prediction": int(prediction),
            "probability": float(prob),
            "shap_values": shap_values
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)})


# =========================
# APPROVAL TREND
# =========================
@app.route('/approval-trend', methods=['GET'])
def approval_trend():
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


# =========================
# HISTORY (UPDATED)
# =========================
@app.route("/prediction-history", methods=["GET"])
def prediction_history():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT 
            id,
            prediction,
            probability,
            created_at,
            age, income, loanamount, creditscore,
            monthsemployed, numcreditlines, interestrate,
            loanterm, dtiratio, education, employmenttype,
            maritalstatus, hasmortgage, hasdependents,
            loanpurpose, hascosigner,
            shap_values
        FROM predictions
        ORDER BY created_at DESC
        LIMIT 100;
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        data = []

        for row in rows:
            features = {
                "Age": row[4],
                "Income": row[5],
                "LoanAmount": row[6],
                "CreditScore": row[7],
                "MonthsEmployed": row[8],
                "NumCreditLines": row[9],
                "InterestRate": row[10],
                "LoanTerm": row[11],
                "DTIRatio": row[12],
                "Education": row[13],
                "EmploymentType": row[14],
                "MaritalStatus": row[15],
                "HasMortgage": row[16],
                "HasDependents": row[17],
                "LoanPurpose": row[18],
                "HasCoSigner": row[19]
            }

            shap_values = {}
            if row[20]:
                try:
                    shap_values = json.loads(row[20])
                except:
                    shap_values = {}

            data.append({
                "id": row[0],
                "prediction": row[1],
                "probability": float(row[2]),
                "created_at": row[3],
                "features": features,          # ✅ FIXED
                "shap_values": shap_values     # ✅ FIXED
            })

        cursor.close()
        conn.close()

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)})

# =========================
# MODEL METRICS
# =========================
@app.route("/model-metrics", methods=["GET"])
def model_metrics():
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        # Try root directory first, then fallback to credit-risk-ui folder
        metrics_path = os.path.join(base_dir, "metrics.json")
        if not os.path.exists(metrics_path):
            metrics_path = os.path.join(base_dir, "credit-risk-ui", "metrics.json")

        with open(metrics_path, "r") as f:
            metrics = json.load(f)

        return jsonify(metrics)

    except Exception as e:
        return jsonify({"error": str(e)})


# =========================
# PDF DOWNLOAD
# =========================
@app.route("/download-report", methods=["POST"])
def download_report():
    data = request.json

    prediction = data.get("prediction")
    probability = data.get("probability")
    shap_values = data.get("shap_values", {})
    features = data.get("features", {})

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer)
    styles = getSampleStyleSheet()

    content = []

    # TITLE
    content.append(Paragraph("Credit Risk Assessment Report", styles["Title"]))
    content.append(Spacer(1, 12))

    # FEATURES
    content.append(Paragraph("User Input Features:", styles["Heading2"]))
    for key, value in features.items():
        content.append(Paragraph(f"{key}: {value}", styles["Normal"]))

    content.append(Spacer(1, 12))

    # RESULT
    content.append(Paragraph("Prediction Result:", styles["Heading2"]))
    content.append(Paragraph(f"Prediction: {prediction}", styles["Normal"]))
    content.append(Paragraph(f"Probability: {round(probability*100,2)}%", styles["Normal"]))

    content.append(Spacer(1, 12))

    # SHAP
    content.append(Paragraph("SHAP Explanation:", styles["Heading2"]))
    for key, value in shap_values.items():
        content.append(Paragraph(f"{key}: {value}", styles["Normal"]))

    doc.build(content)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="credit_risk_report.pdf",
        mimetype="application/pdf"
    )


# =========================
# RUN
# =========================
if __name__ == '__main__':
    app.run(debug=True)