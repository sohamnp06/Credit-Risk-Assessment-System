"""
User Portal Routes — /user/...
- POST /user/register  → create account + run ML prediction
- POST /user/login     → authenticate by name + password
- GET  /user/status    → check application status (JWT protected)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt

from database.db import (
    create_loan_user, get_loan_user_by_loan_id, get_loan_user_by_name,
    insert_application, get_application_by_loan_id
)
from database.feature_engine import compute_all_features
from src.predictor import predict

user_bp = Blueprint("user", __name__, url_prefix="/user")


@user_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user and submit their first loan application.
    Body: {full_name, password, age, annual_income, education, employment_type,
           months_employed, existing_monthly_debt, loan_amount, loan_purpose,
           loan_term, marital_status, has_mortgage, has_dependents, has_cosigner}
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    required = [
        "full_name", "password", "age", "annual_income", "education",
        "employment_type", "months_employed", "existing_monthly_debt",
        "loan_amount", "loan_purpose", "loan_term", "marital_status",
        "has_mortgage", "has_dependents", "has_cosigner"
    ]
    missing = [f for f in required if f not in data or data[f] == ""]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        # Hash password
        pw_hash = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

        # Create user → get loan_id
        loan_id = create_loan_user(data["full_name"], pw_hash)

        # Compute all features
        features = compute_all_features({
            "age":                  data["age"],
            "annual_income":        data["annual_income"],
            "education":            data["education"],
            "employment_type":      data["employment_type"],
            "months_employed":      data["months_employed"],
            "existing_monthly_debt": data["existing_monthly_debt"],
            "loan_amount":          data["loan_amount"],
            "loan_purpose":         data["loan_purpose"],
            "loan_term":            data["loan_term"],
            "marital_status":       data["marital_status"],
            "has_mortgage":         data["has_mortgage"],
            "has_dependents":       data["has_dependents"],
            "has_cosigner":         data["has_cosigner"],
        })

        # Run ML prediction
        prediction, probability, shap_dict = predict(features)

        # Store application
        app_id = insert_application(loan_id, features, prediction, probability, shap_dict)

        # Issue JWT
        token = create_access_token(identity={"loan_id": loan_id, "role": "user"})

        return jsonify({
            "message": "Registration successful. Your loan application has been submitted.",
            "loan_id": loan_id,
            "application_id": app_id,
            "token": token,
        }), 201

    except Exception as e:
        print(f"[register] Error: {e}")
        return jsonify({"error": str(e)}), 500


@user_bp.route("/login", methods=["POST"])
def login():
    """
    Login with full_name + password (+ optional loan_id for disambiguation).
    Body: {full_name, password}  or  {loan_id, password}
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    password = data.get("password", "")
    loan_id  = data.get("loan_id", "").strip()

    if loan_id:
        # Login by loan_id (unique)
        user = get_loan_user_by_loan_id(loan_id)
        if not user:
            return jsonify({"error": "Loan ID not found"}), 404
        candidates = [user]
    else:
        full_name = data.get("full_name", "").strip()
        if not full_name:
            return jsonify({"error": "Provide full_name or loan_id"}), 400
        candidates = get_loan_user_by_name(full_name)
        if not candidates:
            return jsonify({"error": "User not found"}), 404

    # Try password against all matching users
    matched = None
    for u in candidates:
        if bcrypt.checkpw(password.encode("utf-8"), u["password_hash"]):
            matched = u
            break

    if not matched:
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity={"loan_id": matched["loan_id"], "role": "user"})

    return jsonify({
        "token": token,
        "loan_id": matched["loan_id"],
        "full_name": matched["full_name"],
    }), 200


@user_bp.route("/status", methods=["GET"])
@jwt_required()
def status():
    """
    Return the loan application status for the logged-in user.
    Header: Authorization: Bearer <token>
    """
    identity = get_jwt_identity()
    loan_id  = identity.get("loan_id")
    if not loan_id:
        return jsonify({"error": "Invalid token"}), 401

    application = get_application_by_loan_id(loan_id)
    if not application:
        return jsonify({"error": "No application found for this Loan ID"}), 404

    # Return safe subset for user view
    # Only expose SHAP values when the application was rejected
    response = {
        "loan_id":        application["loan_id"],
        "application_id": application["id"],
        "decision":       application["decision"],
        "decided_by":     application["decided_by"],
        "decision_note":  application["decision_note"],
        "decided_at":     application["decided_at"],
        "ml_prediction":  application["ml_prediction"],
        "ml_probability": application["ml_probability"],
        "loan_amount":    application["loan_amount"],
        "loan_purpose":   application["loan_purpose"],
        "loan_term":      application["loan_term"],
        "created_at":     application["created_at"],
    }
    # Expose SHAP explanations only for rejected applications
    if application["decision"] == "rejected":
        response["shap_values"] = application.get("shap_values", {})

    return jsonify(response), 200
