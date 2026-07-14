# 🏦 Credit Risk Assessment System

> **AI-powered loan application platform** — Dual-portal (Applicant + Bank Employee) system using XGBoost machine learning, SHAP explainability, Flask REST API, and React frontend.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Portals](#-portals)
- [ML Model & SHAP](#-ml-model--shap-explainability)
- [Database Schema](#-database-schema)
- [Setup & Installation](#-setup--installation)
- [Running the App](#-running-the-app)
- [API Reference](#-api-reference)
- [Employee Credentials](#-employee-credentials)

---

## 🎯 Overview

The Credit Risk Assessment System is a full-stack web application that helps a bank automate and explain loan decisions using machine learning.

**Applicants** submit their loan application through a self-service portal. The system immediately runs an **XGBoost classifier** to score their default risk and stores the result. A **bank employee** then reviews the application with full AI insights and SHAP factor explanations before making a final Approve / Reject / Hold decision.

When rejected, the applicant can see exactly **why** — via SHAP explainability charts that highlight the top risk factors in plain language.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│   ┌──────────────────┐       ┌──────────────────────────┐  │
│   │  Loan Applicant  │       │    Bank Employee Portal  │  │
│   │  Portal (React)  │       │        (React)           │  │
│   └────────┬─────────┘       └────────────┬─────────────┘  │
│            │  Vite Proxy (relative URLs)  │                 │
└────────────┼──────────────────────────────┼─────────────────┘
             │                              │
             ▼         HTTP/REST            ▼
┌────────────────────────────────────────────────────────────┐
│               Flask REST API  (port 5000)                  │
│   /user/*  routes          /employee/*  routes             │
│   ┌──────────────────────────────────────────────┐         │
│   │              Business Logic                  │         │
│   │  feature_engine.py → predictor.py → SHAP     │         │
│   └──────────────────────────────────────────────┘         │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                           │
│  loan_users │ loan_applications │ employees               │
└────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router v7, Recharts, Vite |
| **Styling** | Vanilla CSS (dark glassmorphism theme), Inter font |
| **Backend** | Python 3.11, Flask 3, Flask-JWT-Extended, Flask-CORS |
| **Machine Learning** | XGBoost classifier, scikit-learn pipeline |
| **Explainability** | SHAP (SHapley Additive exPlanations) |
| **Database** | PostgreSQL (via psycopg2) |
| **Auth** | JWT (JSON Web Tokens), bcrypt password hashing |
| **PDF Reports** | ReportLab |
| **Dev Tools** | concurrently (run backend + frontend together) |

---

## 📁 Project Structure

```
Credit Risk Assessment System/
│
├── main.py                     # Flask application entry point
├── package.json                # Root npm scripts (concurrently runner)
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (DB, JWT)
│
├── routes/
│   ├── user_routes.py          # /user/* endpoints (register, login, status)
│   └── employee_routes.py      # /employee/* endpoints (login, dashboard, decide)
│
├── database/
│   ├── db.py                   # All PostgreSQL CRUD functions
│   ├── feature_engine.py       # Feature computation from raw inputs
│   └── setup.py                # DB schema creation + employee seeding
│
├── src/
│   ├── predictor.py            # ML prediction + SHAP explanation
│   ├── pipeline.py             # sklearn pipeline (FeatureEngineer + XGBoost)
│   └── train.py                # Model training script
│
├── artifacts/
│   └── pipeline.pkl            # Saved trained XGBoost pipeline
│
├── data/
│   └── loanDefaulter.csv       # Training dataset
│
├── notebooks/                  # Jupyter notebooks for EDA and model training
│
└── credit-risk-ui/             # React frontend (Vite)
    ├── vite.config.js          # Vite config with dev proxy to Flask
    ├── src/
    │   ├── pages/
    │   │   ├── Portal.jsx          # Landing page (choose portal)
    │   │   ├── UserRegister.jsx    # Loan application form
    │   │   ├── UserLogin.jsx       # Applicant sign in
    │   │   ├── UserStatus.jsx      # Application status + SHAP (if rejected)
    │   │   ├── EmployeeLogin.jsx   # Bank employee sign in
    │   │   ├── EmployeeDashboard.jsx  # All applications list + stats
    │   │   └── ApplicationReview.jsx  # Single application full review + SHAP
    │   ├── services/
    │   │   └── api.js              # All API calls (relative URLs → Vite proxy)
    │   └── components/
    │       ├── ShapChart.jsx       # SHAP factor bar chart
    │       ├── KPICards.jsx        # Dashboard KPI cards
    │       └── ...
    └── package.json
```

---

## ⚙️ How It Works

### Applicant Flow

```
1. Applicant fills loan form (age, income, loan amount, purpose, etc.)
         ↓
2. Backend computes derived features via feature_engine.py
   (credit score simulation, DTI ratio, EMI, income groups, etc.)
         ↓
3. XGBoost pipeline predicts default probability + binary prediction
         ↓
4. SHAP values computed → top 5 risk factors identified
         ↓
5. Application stored in PostgreSQL with all features + ML output
         ↓
6. Applicant gets a Loan ID and JWT token → views status page
```

### Employee Flow

```
1. Employee logs in with secure credentials → receives JWT
         ↓
2. Dashboard shows pending/approved/rejected/hold counts + trend charts
         ↓
3. Employee opens individual application → sees full applicant profile,
   AI risk score, SHAP explanation of top risk factors
         ↓
4. Employee makes decision: Approve / Reject / Hold (with optional note)
         ↓
5. Decision saved → applicant's status page updates immediately
```

### SHAP Visibility Rules

| Who | When | Sees SHAP? |
|-----|------|-----------|
| Bank Employee | Always (any decision) | ✅ Yes |
| Loan Applicant | Decision = Rejected | ✅ Yes — "Why was I rejected?" |
| Loan Applicant | Decision = Approved / Hold / Pending | ❌ No |

---

## 🖥 Portals

### Loan Applicant Portal

- **Register** → Submit loan application with 13 input fields
- **Login** → Authenticate by Name or Loan ID
- **Status Page** → View decision, loan details, AI risk score
- **SHAP Section** → Visible only if rejected; explains the top factors

### Bank Employee Portal

- **Login** → Secure login (3 authorized accounts only, no registration)
- **Dashboard** → KPI cards (total, pending, approved, rejected counts), approval trend chart
- **Application List** → Filterable by decision status, sortable
- **Application Review** → Full applicant profile, AI risk percentage, SHAP bars, decision panel (approve/reject/hold + note), PDF report download

---

## 🤖 ML Model & SHAP Explainability

### Model

The system uses an **XGBoost classifier** wrapped in a scikit-learn pipeline. The pipeline includes:
- Custom `FeatureEngineer` transformer (ratio features, flag features)
- Custom `ManualEncoder` (ordinal encoding for categoricals)
- `OHEFixer` (handles one-hot encoding alignment)
- XGBoost classifier with a tuned decision threshold

### Input Features (16 raw)

| Feature | Type | Description |
|---------|------|-------------|
| Age | int | Applicant age |
| Income | float | Annual income |
| LoanAmount | float | Requested loan amount |
| CreditScore | int | Credit bureau score (simulated) |
| MonthsEmployed | int | Employment tenure |
| NumCreditLines | int | Number of credit accounts |
| InterestRate | float | Assigned interest rate |
| LoanTerm | int | Repayment period (months) |
| DTIRatio | float | Debt-to-income ratio |
| Education | category | High School / Bachelor / Master / PhD |
| EmploymentType | category | Full-time / Part-time / Self-employed / Unemployed |
| MaritalStatus | category | Single / Married / Divorced |
| HasMortgage | binary | 1 = Yes, 0 = No |
| HasDependents | binary | 1 = Yes, 0 = No |
| LoanPurpose | category | Home / Auto / Education / Business / Other |
| HasCoSigner | binary | 1 = Yes, 0 = No |

### Derived Features (computed automatically)

- `Loan_to_Income`, `Credit_per_Line`, `Income_per_Employment`
- `Interest_Burden` (interest rate × loan amount)
- `High_DTI_Flag` (DTI > 0.4), `Low_Credit_Flag` (score < 600)
- `monthly_income`, `estimated_emi`, `emi_to_income`
- `disposable_income`, `income_after_emi`
- `creditscore_bucket`, `income_group`, `employment_stability`

### SHAP Explanation

After prediction, SHAP values are computed using `shap.Explainer(model)`. The top 5 features by absolute SHAP value are stored and displayed as color-coded impact bars:

- 🔴 **↑ Risk** — this factor increases default probability
- 🟢 **↓ Risk** — this factor decreases default probability
- Impact levels: **High** (|val| > 0.5) · **Medium** (> 0.2) · **Low** (< 0.2)

---

## 🗃 Database Schema

### `loan_users`
| Column | Type | Description |
|--------|------|-------------|
| loan_id | VARCHAR(20) PK | Generated (LN000001 format) |
| full_name | VARCHAR | Applicant name |
| password_hash | BYTEA | bcrypt-hashed password |

### `loan_applications`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Application ID |
| loan_id | FK | References loan_users |
| [13 input fields] | various | Raw applicant inputs |
| [derived features] | float | Computed by feature_engine |
| ml_prediction | int | 0 = Low Risk, 1 = High Risk |
| ml_probability | float | Default probability (0–1) |
| shap_values | TEXT (JSON) | Top 5 SHAP factors |
| decision | VARCHAR | pending / approved / rejected / hold |
| decided_by | VARCHAR | Employee username |
| decision_note | TEXT | Reviewer's note |

### `employees`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Employee ID |
| username | VARCHAR UNIQUE | Login username |
| password_hash | BYTEA | bcrypt-hashed password |

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repository

```bash
git clone https://github.com/your-repo/credit-risk-assessment-system.git
cd "Credit Risk Assessment System"
```

### 2. Create Python virtual environment

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Edit `.env` in the project root:

```env
DB_HOST=localhost
DB_NAME=credit_risk_db
DB_USER=postgres
DB_PASS=your_postgres_password
DB_PORT=5432
JWT_SECRET=your-secret-key
```

### 5. Set up PostgreSQL database

Create the database first:

```sql
CREATE DATABASE credit_risk_db;
```

Then run the setup script:

```bash
venv\Scripts\python.exe database\setup.py
```

This will:
- Create all tables (`loan_users`, `loan_applications`, `employees`, etc.)
- Seed the 3 bank employee accounts
- Import the training dataset (optional)

### 6. Train the ML model (first-time only)

```bash
venv\Scripts\python.exe src\train.py
```

This generates `artifacts/pipeline.pkl`.

> **Note:** If `artifacts/pipeline.pkl` already exists, skip this step.

### 7. Install Node.js dependencies

```bash
npm install                        # installs concurrently in root
cd credit-risk-ui && npm install   # installs React/Vite deps
cd ..
```

---

## ▶️ Running the App

From the **project root**, run a single command:

```bash
npm run dev
```

This starts **both** services simultaneously:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** (Vite) | http://localhost:5173 | React UI |
| **Backend** (Flask) | http://127.0.0.1:5000 | REST API |

> The Vite dev server proxies all API requests (`/user/*`, `/employee/*`, `/download-report`) to the Flask backend automatically — no CORS issues, no hardcoded URLs.

### Individual commands (if needed)

```bash
npm run backend    # Start Flask only (uses venv Python)
npm run frontend   # Start Vite only
```

---

## 📡 API Reference

### User Routes (`/user/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/user/register` | None | Register + submit loan application |
| POST | `/user/login` | None | Login with name/loan_id + password |
| GET | `/user/status` | JWT | Get application status (+ SHAP if rejected) |

#### POST `/user/register` — Request Body
```json
{
  "full_name": "John Doe",
  "password": "secret",
  "age": 35,
  "annual_income": 60000,
  "education": "Bachelor",
  "employment_type": "Full-time",
  "months_employed": 48,
  "existing_monthly_debt": 500,
  "loan_amount": 15000,
  "loan_purpose": "Home",
  "loan_term": 36,
  "marital_status": "Married",
  "has_mortgage": 0,
  "has_dependents": 1,
  "has_cosigner": 0
}
```

#### GET `/user/status` — Response
```json
{
  "loan_id": "LN000001",
  "decision": "rejected",
  "ml_probability": 0.72,
  "shap_values": {
    "DTIRatio": { "impact": "High", "direction": "↑ Risk", "value": 0.63, "label": "High (↑ Risk)" },
    "CreditScore": { "impact": "Medium", "direction": "↑ Risk", "value": 0.31, "label": "Medium (↑ Risk)" }
  }
}
```
> `shap_values` is **only included** when `decision == "rejected"`.

---

### Employee Routes (`/employee/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/employee/login` | None | Employee authentication |
| GET | `/employee/dashboard` | JWT | Aggregate stats |
| GET | `/employee/applications` | JWT | List all applications (optional `?decision=pending`) |
| GET | `/employee/application/<id>` | JWT | Full application detail + SHAP |
| POST | `/employee/decide/<id>` | JWT | Submit approve/reject/hold decision |

#### POST `/employee/decide/<id>` — Request Body
```json
{
  "decision": "rejected",
  "note": "High DTI ratio and low credit score."
}
```

---

### Utility Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/download-report` | Generate PDF risk report |

---

## 🔐 Employee Credentials

There are exactly **3 authorized bank employee accounts**. No self-registration is possible.

> Credentials are confidential and managed by the system administrator via `database/setup.py`.

---

## 🔒 Security Notes

- All employee and applicant passwords are hashed with **bcrypt** (salt rounds auto-managed)
- JWT tokens are used for all protected routes; no session state on the server
- SHAP values are **never exposed to applicants unless their application is rejected**
- Employee access is gated by role check on every protected route

---

## 📄 PDF Report

Employees can download a PDF risk report for any application via the **📄 PDF Report** button in the Application Review page. The report includes:
- Applicant information
- Loan details
- AI decision & probability
- SHAP risk factor explanation

---

## 🧪 Training the Model

```bash
# Activate venv first
venv\Scripts\activate

# Run training script
python src/train.py
```

The training pipeline:
1. Loads `data/loanDefaulter.csv`
2. Engineers features
3. Trains XGBoost with cross-validation
4. Tunes the decision threshold (optimizes F1)
5. Saves pipeline to `artifacts/pipeline.pkl`

---

*Built with ❤️ using XGBoost + SHAP · PostgreSQL · React · Flask*
