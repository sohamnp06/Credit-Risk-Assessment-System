"""
Employee Portal Routes — /employee/...
- POST /employee/login          → authenticate (3 hardcoded employees)
- GET  /employee/dashboard      → aggregate stats
- GET  /employee/applications   → list all applications (filterable)
- GET  /employee/application/<id> → single application detail
- POST /employee/decide/<id>    → approve / reject / hold
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt

from database.db import (
    get_employee_by_username,
    get_all_applications,
    get_application_by_id,
    update_decision,
    get_dashboard_stats,
)

employee_bp = Blueprint("employee", __name__, url_prefix="/employee")


def _get_identity():
    from flask_jwt_extended import get_jwt_identity
    import json
    identity = get_jwt_identity()
    if isinstance(identity, str):
        try:
            return json.loads(identity)
        except Exception:
            return identity
    return identity


def _require_employee(identity):
    """Validate that the JWT belongs to an employee role."""
    if not identity or identity.get("role") != "employee":
        return False
    return True


@employee_bp.route("/login", methods=["POST"])
def login():
    """
    Employee login — no signup allowed.
    Body: {username, password}
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    employee = get_employee_by_username(username)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    if not bcrypt.checkpw(password.encode("utf-8"), employee["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity={"username": username, "role": "employee"})

    return jsonify({
        "token": token,
        "username": username,
    }), 200


@employee_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    """Return aggregate stats for the employee dashboard."""
    identity = _get_identity()
    if not _require_employee(identity):
        return jsonify({"error": "Unauthorized"}), 403

    stats = get_dashboard_stats()
    return jsonify(stats), 200


@employee_bp.route("/applications", methods=["GET"])
@jwt_required()
def list_applications():
    """
    List all loan applications.
    Query param: ?decision=pending|approved|rejected|hold  (optional)
    """
    identity = _get_identity()
    if not _require_employee(identity):
        return jsonify({"error": "Unauthorized"}), 403

    decision_filter = request.args.get("decision", None)
    apps = get_all_applications(decision_filter)
    return jsonify(apps), 200


@employee_bp.route("/application/<int:app_id>", methods=["GET"])
@jwt_required()
def get_application(app_id):
    """Get a single application's full detail."""
    identity = _get_identity()
    if not _require_employee(identity):
        return jsonify({"error": "Unauthorized"}), 403

    app = get_application_by_id(app_id)
    if not app:
        return jsonify({"error": "Application not found"}), 404

    # Fetch applicant name
    from database.db import get_loan_user_by_loan_id
    user = get_loan_user_by_loan_id(app["loan_id"])
    if user:
        app["full_name"] = user["full_name"]

    return jsonify(app), 200


@employee_bp.route("/decide/<int:app_id>", methods=["POST"])
@jwt_required()
def decide(app_id):
    """
    Make a lending decision on an application.
    Body: {decision: 'approved'|'rejected'|'hold', note: '...'}
    """
    identity = _get_identity()
    if not _require_employee(identity):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    decision = data.get("decision", "").lower()
    note     = data.get("note", "")

    if decision not in ("approved", "rejected", "hold"):
        return jsonify({"error": "Decision must be 'approved', 'rejected', or 'hold'"}), 400

    app = get_application_by_id(app_id)
    if not app:
        return jsonify({"error": "Application not found"}), 404

    decided_by = identity.get("username", "unknown")
    ok = update_decision(app_id, decision, decided_by, note)

    if not ok:
        return jsonify({"error": "Failed to update decision"}), 500

    return jsonify({
        "message": f"Application {app_id} marked as '{decision}'.",
        "application_id": app_id,
        "decision": decision,
        "decided_by": decided_by,
    }), 200
