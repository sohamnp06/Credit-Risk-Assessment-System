"""
Credit Risk Assessment System — Flask Application Entry Point
Dual Portal: /user (applicants) and /employee (bank staff)
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
import io
import json
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

load_dotenv()

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "super-secret-key-change-in-prod")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # Tokens don't expire for demo

jwt = JWTManager(app)

@jwt.user_identity_loader
def user_identity_lookup(identity):
    if isinstance(identity, dict):
        return json.dumps(identity)
    return str(identity)

# ─── Register Blueprints ─────────────────────────────────────────────────────
from routes.user_routes     import user_bp
from routes.employee_routes import employee_bp

app.register_blueprint(user_bp)
app.register_blueprint(employee_bp)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({
        "status": "running",
        "system": "Credit Risk Assessment API",
        "portals": {
            "user":     "/user/register, /user/login, /user/status",
            "employee": "/employee/login, /employee/dashboard, /employee/applications, /employee/decide/<id>"
        }
    })


# ─── PDF Report Download ──────────────────────────────────────────────────────
@app.route("/download-report", methods=["POST"])
def download_report():
    data = request.json or {}

    decision     = data.get("decision", "Pending")
    probability  = data.get("probability", 0)
    shap_values  = data.get("shap_values", {})
    features     = data.get("features", {})
    loan_id      = data.get("loan_id", "N/A")

    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(buffer)
    styles = getSampleStyleSheet()
    content = []

    content.append(Paragraph("Credit Risk Assessment Report", styles["Title"]))
    content.append(Spacer(1, 12))
    content.append(Paragraph(f"Loan ID: {loan_id}", styles["Normal"]))
    content.append(Spacer(1, 8))

    content.append(Paragraph("Decision:", styles["Heading2"]))
    content.append(Paragraph(f"Decision: {decision}", styles["Normal"]))
    content.append(Paragraph(f"Risk Probability: {round(probability * 100, 2)}%", styles["Normal"]))
    content.append(Spacer(1, 12))

    if features:
        content.append(Paragraph("Applicant Information:", styles["Heading2"]))
        for key, value in features.items():
            if not key.startswith("_"):
                content.append(Paragraph(f"{key}: {value}", styles["Normal"]))
        content.append(Spacer(1, 12))

    if shap_values:
        content.append(Paragraph("SHAP Risk Explanation (Top Factors):", styles["Heading2"]))
        for key, value in shap_values.items():
            content.append(Paragraph(f"  • {key}: {value}", styles["Normal"]))

    doc.build(content)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"credit_risk_report_{loan_id}.pdf",
        mimetype="application/pdf"
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000, use_reloader=False)