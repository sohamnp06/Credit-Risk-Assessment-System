from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import psycopg2
import bcrypt

auth = Blueprint("auth", __name__)

def get_db_connection():
    return psycopg2.connect(
        dbname="credit_risk_db",
        user="postgres",
        password="root",
        host="localhost",
        port="5432"
    )
# =====================
# SIGNUP
# =====================
@auth.route("/signup", methods=["POST"])
def signup():
    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "analyst")

    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user exists
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            return jsonify({"error": "User with this email already exists"}), 200

        cur.execute("""
            INSERT INTO users (name, email, password, role)
            VALUES (%s, %s, %s, %s)
        """, (name, email, hashed_pw, role))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "User created successfully"}), 201

    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"error": "Failed to create user. Please try again later."}), 500

# =====================
# LOGIN
# =====================
@auth.route("/login", methods=["POST"])
def login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, password, role FROM users WHERE email=%s", (email,))
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    user_id, hashed_pw, role = user

    if not bcrypt.checkpw(password.encode("utf-8"), bytes(hashed_pw)):
        return jsonify({"error": "Invalid password"}), 401

    access_token = create_access_token(identity={
        "id": user_id,
        "role": role
    })

    return jsonify({
        "token": access_token,
        "role": role
    })