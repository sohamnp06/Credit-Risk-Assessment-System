# 🏦 Credit Risk Assessment System

> **AI-powered loan application platform** — Dual-portal (Applicant + Bank Employee) system using XGBoost machine learning, SHAP explainability, Flask REST API, and React frontend.

---

## 📋 Table of Contents

- [Live Demo](#-live-end-to-end-project-walkthrough)
- [Business Problem and Motivation](#-business-problem--motivation)
- [What We Found — Key Patterns](#-what-we-found-key-patterns-from-the-data)
- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Feature Engineering](#-feature-engineering)
- [SHAP Explainability](#-shap-explainability)
- [Dual Portal Design](#-dual-portal-design)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Setup and Installation](#-setup--installation)
- [Running the App](#-running-the-app)
- [Security Notes](#-security-notes)
- [Employee Credentials](#-employee-credentials)

---

## 🎬 Live End-to-End Project Walkthrough

> A full demonstration of the system — from applicant registration, real-time ML scoring, employee dashboard review, decision making, and SHAP-based rejection explanation.

![Live Demo](dashboard/workingDemo.gif)

---

## 🏢 Business Problem & Motivation

This system was built in response to a real lending institution problem surfaced through analysis of **255,000+ historical loan applications** spanning a **₹32.58 Billion disbursed portfolio**.

### The Core Problem

The institution's approval rate stood at **88.39%** — well above the 40–85% range typical across banks and digital lenders. Despite this aggressive approval posture, the institution had no dedicated ML risk screen, no forward-looking default rate estimation, and no mechanism to explain *why* an applicant was rejected.

Three compounding issues were identified:

**1. Credit risk was not differentiating approvals.**
The applicant pool skewed heavily toward the Poor credit tier (~45% of applicants). Yet these low-credit applicants were being approved at **87.54%** — almost identical to the overall approval rate. Having weak credit barely changed an applicant's odds of getting approved.

**2. Debt burden signals were being ignored at the point of decision.**
- **61.87%** of applicants (158K) already carried a High DTI classification *before* taking on this new loan, yet most were still approved.
- The average Debt-to-Income ratio across the entire book was **0.50** — the typical approved borrower was already committing half their income to debt service.
- More critically: **Income After EMI was negative for more than 25% of the portfolio**, meaning a quarter of approved borrowers mathematically couldn't cover their monthly installment from income alone — invisible in top-line dashboard averages.

**3. High-risk combinations were not being caught as combinations.**
Individual signals (co-signer status, loan size, employment type, loan purpose) were captured in the data but *not combined* into specific risk gates. For example:
- **No co-signer + High loan amount**: default rate of **15.42%**
- **Co-signer + Low loan amount**: default rate of **8.20%** — nearly half the risk
- **Unemployed + Business loan purpose**: default rate of **14.37%** vs. 8.05% for Full-time + Home loan

The institution was measuring *growth* (total disbursed, approval volume) but had no reporting layer for *portfolio health* (default rate, delinquency buckets, expected credit loss, non-performing assets).

---

## 🔍 What We Found — Key Patterns from the Data

> These patterns emerged from EDA and modeling across 255K+ applications. They directly shaped the system's ML feature set, model selection strategy, and business logic.

### Pattern 1 — Accuracy is a Trap on Imbalanced Data

Only **11.6%** of historical loans actually defaulted. A model that blindly predicts "no default" for everyone achieves **88%+ accuracy** — which is exactly what unweighted tree models did. Every tree-based model (Gradient Boosting, CatBoost, AdaBoost, XGBoost, Random Forest, Extra Trees) posted 88%+ accuracy while catching only **2.5% to 8.4%** of actual defaulters.

The solution: optimize for **ROC-AUC + Recall on the default class**, not accuracy. A model that misses 90% of defaulters while being "accurate" is worthless in production.

### Pattern 2 — Loan Burden Beats DTI as a Default Predictor

The institution used DTI as its primary debt-screening gate — but the data revealed a counterintuitive finding: **Low-DTI + High-Loan-Burden** applicants produced the single highest observed default rate (**17.26%**) — *higher* than High-DTI + High-Burden (**13.92%**). Raw DTI alone was not separating defaulters from non-defaulters. The stronger signal was loan size relative to income combined with what remains after the EMI is paid.

### Pattern 3 — The "Affordable EMI" Average Hides a Dangerous Tail

Average EMI looked manageable in aggregate (₹5.65K). But the distribution was heavily right-skewed: **EMI-to-income ratios ran as high as 18× monthly income** for some borrowers, and **>25% of the approved portfolio had negative Income After EMI**. Aggregate KPIs were actively hiding the riskiest slice of the book.

### Pattern 4 — A Sustained 50% Drop in Application Volume (Unexplained)

Monthly application volume ran a steady **29K–33K from January through May**, then dropped sharply to **16K–17K from June onward** and stayed there — a ~50% decline that persisted rather than reverting. No attributed cause was found in the data, representing a material strategic unknown.

### Model Selection: Recall Over Precision

| Model | Accuracy | Recall (Catches Defaulters) | ROC-AUC |
|---|---|---|---|
| **Logistic Regression** *(selected)* | 69.1% | **69.6%** | 0.7615 |
| XGBoost (tuned, weighted) | 69.3% | 68.7% | 0.7604 |
| CatBoost (tuned, weighted) | 69.4% | 69.2% | 0.7603 |
| Random Forest (tuned, weighted) | 87.3% | 21.5% | 0.7471 |

The final production model correctly **flags ~70% of applicants who go on to default**, at the cost of lower precision (~23%). This is intentional: the model is designed as a **screening and triage layer**, not an auto-decline gate. A human reviewer makes the final call.

> **The Credit Risk Assessment System operationalizes this model** — it runs every new application through XGBoost (matching LR recall with better SHAP compatibility), generates SHAP explanations for each prediction, and routes decisions through a bank employee who reviews the AI output before approving or rejecting.

---

## 🎯 Overview

The Credit Risk Assessment System is a full-stack web application that automates and explains loan decisions using machine learning.

**Applicants** submit their loan application through a self-service portal. The system immediately runs an **XGBoost classifier** to score their default risk, engineers all financial features automatically, and stores the result along with SHAP explainability data. A **bank employee** then reviews the application with full AI insights before making a final Approve / Reject / Hold decision.

When rejected, the applicant can see exactly **why** — via SHAP explainability charts that highlight the top risk factors in plain, actionable language.

---

## 🏗 Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                           Browser                             │
│   ┌──────────────────────┐     ┌───────────────────────────┐  │
│   │   Loan Applicant     │     │   Bank Employee Portal    │  │
│   │   Portal (React)     │     │        (React)            │  │
│   └──────────┬───────────┘     └──────────────┬────────────┘  │
│              │    Vite Proxy (relative URLs)   │               │
└──────────────┼─────────────────────────────────┼──────────────┘
               │                                 │
               ▼          HTTP / REST             ▼
┌──────────────────────────────────────────────────────────────┐
│               Flask REST API  (port 5000)                     │
│     /user/* routes           /employee/* routes               │
│   ┌────────────────────────────────────────────────────┐      │
│   │               Business Logic                       │      │
│   │  feature_engine.py → predictor.py → SHAP           │      │
│   │  PDF generation (ReportLab)                        │      │
│   └────────────────────────────────────────────────────┘      │
│   ┌────────────────────────────────────────────────────┐      │
│   │          JWT Authentication Layer                  │      │
│   │    flask-jwt-extended + bcrypt hashing             │      │
│   └────────────────────────────────────────────────────┘      │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                         │
│       users  │  loan_applications  │  employees              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, React Router v7, Vite | SPA with client-side routing |
| **Charts** | Recharts | Approval trend, risk distribution charts |
| **Styling** | Vanilla CSS, Inter font, glassmorphism | Dark-mode premium UI |
| **Backend** | Python 3.11, Flask 2.3 | REST API server |
| **API Auth** | Flask-JWT-Extended, Flask-CORS | Role-based JWT auth (user / employee) |
| **Machine Learning** | XGBoost 2.0, scikit-learn 1.3 | Default risk classification pipeline |
| **Explainability** | SHAP 0.42 | Per-prediction feature attribution |
| **Feature Engineering** | pandas 2.1, numpy 1.25 | 22+ derived financial features |
| **Database** | PostgreSQL 14+, psycopg2 | Persistent storage for all applications |
| **Password Security** | bcrypt 4.0 | Salted hash for all passwords |
| **PDF Generation** | ReportLab 4.0 | Downloadable credit risk reports |
| **Dev Runner** | concurrently (npm) | Single command starts Flask + Vite |
| **Notebooks** | Jupyter | Full EDA + model training pipeline |

---

## 📁 Project Structure

```
Credit Risk Assessment System/
│
├── main.py                      # Flask entry point — blueprints + PDF route
├── auth.py                      # JWT identity helpers
├── requirements.txt             # Python dependencies (pinned)
├── package.json                 # npm scripts (concurrently dev runner)
├── .env                         # Environment variables (DB, JWT secret)
│
├── routes/
│   ├── user_routes.py           # /user/register, /user/login, /user/status
│   └── employee_routes.py       # /employee/login, /employee/dashboard,
│                                #   /employee/applications, /employee/application/<id>,
│                                #   /employee/decide/<id>
│
├── database/
│   ├── db.py                    # All PostgreSQL CRUD operations
│   ├── feature_engine.py        # 22+ feature computation from raw inputs
│   └── setup.py                 # DB schema creation + employee seeding
│
├── src/
│   ├── predictor.py             # ML inference: predict + SHAP top-5
│   └── pipeline.py              # sklearn Pipeline: FeatureEngineer → XGBoost
│
├── models/
│   ├── best_model_pipeline.pkl  # Serialized best model from notebook
│   └── feature_metadata.json   # Feature types, ordinal mappings
│
├── artifacts/
│   └── pipeline.pkl             # Production pipeline (fitted on full dataset)
│
├── data/
│   └── loanDefaulter.csv        # Training dataset (255K+ applications)
│
├── notebooks/
│   ├── basic-eda.ipynb          # Initial exploratory data analysis
│   ├── eda2.ipynb               # Advanced EDA — DTI, income tiers, default rates
│   ├── cleaning.ipynb           # Data cleaning pipeline
│   └── preprocessing.ipynb     # Feature engineering + 10-algorithm comparison
│
├── dashboard/
│   ├── Credit_Assessment.pbix  # Power BI executive dashboard
│   └── workingDemo.gif          # Live end-to-end demo recording
│
└── credit-risk-ui/              # React + Vite frontend
    ├── vite.config.js           # Dev proxy: /user/*, /employee/*, /download-report → :5000
    └── src/
        ├── App.jsx              # React Router — user & employee route guards
        ├── index.css            # Global dark glassmorphism design system
        ├── pages/
        │   ├── Portal.jsx              # Landing — choose applicant or employee portal
        │   ├── UserRegister.jsx        # Loan application form (13 fields)
        │   ├── UserLogin.jsx           # Applicant sign in (name or Loan ID)
        │   ├── UserStatus.jsx          # Application status + SHAP (if rejected)
        │   ├── EmployeeLogin.jsx       # Bank employee sign in
        │   ├── EmployeeDashboard.jsx   # Applications list, KPI stats, filter/search
        │   └── ApplicationReview.jsx   # Full applicant detail, SHAP chart, decision panel
        ├── components/
        │   ├── ShapChart.jsx           # SHAP impact bar chart (color-coded)
        │   ├── KPICards.jsx            # Dashboard statistic cards
        │   ├── ApprovalTrendChart.jsx  # Approval trend (Recharts)
        │   ├── RiskDistributionChart.jsx  # Risk score distribution
        │   ├── ConfusionMatrix.jsx     # Model performance matrix
        │   └── Sidebar.jsx            # Employee portal sidebar nav
        └── services/
            └── api.js                  # All API calls (relative URLs → Vite proxy)
```

---

## 🤖 Machine Learning Pipeline

### Model Selection Rationale

Ten classification algorithms were evaluated. The deciding metric was **ROC-AUC + Recall on the default class** — not accuracy — because loan default prediction is a deeply asymmetric cost problem:

- **Approving a defaulter** = full loan principal lost
- **Rejecting a good borrower** = foregone interest income only

On a dataset where only **11.6% of loans defaulted**, a model optimizing for accuracy trivially achieves 88%+ by predicting "no default" for everyone — catching essentially no actual defaulters. All unweighted tree ensembles fell into exactly this trap.

**XGBoost with class-weighting and threshold tuning** was selected for the production pipeline — matching the final recall of Logistic Regression while offering richer SHAP compatibility and faster inference.

### Sklearn Pipeline Architecture

```
Raw Input (16 features)
        ↓
FeatureEngineer          — Ratio features + binary risk flags
        ↓
ManualEncoder            — Ordinal encoding for categorical columns
        ↓
OHEFixer                 — OHE alignment for binary flag columns
        ↓
ColumnTransformer        — Numerical passthrough + OHE for binary cols
        ↓
XGBoostClassifier        — Tuned with scale_pos_weight for class imbalance
        ↓
Custom Threshold (≠ 0.5) — Threshold tuned on held-out set to maximize F1
        ↓
Prediction + Probability
```

The full pipeline is serialized via `pickle` to `artifacts/pipeline.pkl` and loaded once at server start for zero-latency inference.

---

## ⚙️ Feature Engineering

The system engineers **22+ features** from 13 user inputs. Features fall into three groups:

### 1. User-Entered Inputs (13 fields)

| Feature | Type | Description |
|---|---|---|
| Age | int | Applicant age |
| Annual Income | float | Gross annual income |
| Loan Amount | float | Requested loan size |
| Months Employed | int | Employment tenure |
| Loan Term | int | Repayment period (months) |
| Existing Monthly Debt | float | Current monthly obligations |
| Education | category | High School / Bachelor / Master / PhD |
| Employment Type | category | Salaried / Self-Employed / Unemployed |
| Marital Status | category | Single / Married / Divorced |
| Has Mortgage | binary | 1 = Yes, 0 = No |
| Has Dependents | binary | 1 = Yes, 0 = No |
| Loan Purpose | category | Home / Auto / Education / Business / Other |
| Has Co-Signer | binary | 1 = Yes, 0 = No |

### 2. Simulated Bureau Data (deterministic, seeded RNG)

| Feature | Simulation Method |
|---|---|
| CreditScore | 300–900, income + age boosted, seeded RNG |
| NumCreditLines | 1–10, seeded RNG |
| InterestRate | 5–25%, inversely proportional to credit score tier |

### 3. Derived / Engineered Features

| Feature | Formula | Why It Matters |
|---|---|---|
| `DTIRatio` | monthly_debt / (annual_income / 12) | Existing debt affordability |
| `Loan_to_Income` | loan_amount / income | Loan size relative to income |
| `Credit_per_Line` | credit_score / (num_lines + 1) | Credit quality per account |
| `Income_per_Employment` | income / (months_employed + 1) | Income growth proxy |
| `Interest_Burden` | interest_rate x loan_term | Total interest cost exposure |
| `High_DTI_Flag` | 1 if DTI > 0.4 | Binary risk flag |
| `Low_Credit_Flag` | 1 if credit_score < 600 | Binary risk flag |
| `Estimated_EMI` | P·r·(1+r)^n / ((1+r)^n - 1) | Monthly repayment amount |
| `EMI_to_Income` | estimated_emi / monthly_income | Repayment burden ratio |
| `Disposable_Income` | income - (income x DTI) | Income after existing debt |
| `Income_After_EMI` | disposable_income - estimated_emi | **Key affordability signal** |
| `CreditScore_Bucket` | Poor / Fair / Good / Very Good / Excellent | Categorical credit tier |
| `Income_Group` | Low / Medium / High / Very High | Income segmentation |
| `Employment_Stability` | months_employed x employment_type_weight | Stability score |
| `Loan_Burden` | loan_amount / income | Matches training pipeline |

---

## 🔮 SHAP Explainability

After every prediction, the system computes **SHAP (SHapley Additive exPlanations)** values using `shap.Explainer(model)` on the transformed feature space.

The **top 5 features by absolute SHAP value** are extracted, ranked, and stored in the database. Each factor is labeled with:

- **Impact level**: High (|val| > 0.5) · Medium (> 0.2) · Low (< 0.2)
- **Direction**: ↑ Risk (increases default probability) · ↓ Risk (decreases it)
- **Human label**: e.g. `"High (↑ Risk)"` — displayed directly in the UI

### SHAP Visibility Policy

| Who Sees It | Condition |
|---|---|
| **Bank Employee** | Always — on every application review |
| **Loan Applicant** | Only when `decision = rejected` — "Why was I rejected?" |
| **Loan Applicant** | Hidden for `pending`, `approved`, `hold` statuses |

This policy ensures rejected applicants receive a transparent, data-driven explanation, without exposing internal risk scores for in-progress or approved applications.

---

## 🖥 Dual Portal Design

### Loan Applicant Portal (`/user/*`)

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Choose applicant or employee portal |
| Register | `/user/register` | 13-field loan form — ML runs immediately on submit |
| Login | `/user/login` | Authenticate by full name or Loan ID + password |
| Status | `/user/status` | Decision, loan details, ML risk score, SHAP (if rejected) |

**Registration Flow:**
1. Applicant fills 13-field form
2. Backend computes all 22+ features via `feature_engine.py`
3. XGBoost pipeline runs inference → probability + binary prediction
4. SHAP values computed → top 5 factors stored
5. Everything persisted in PostgreSQL
6. Applicant receives unique `Loan ID` (format: `LN000001`) + JWT token

### Bank Employee Portal (`/employee/*`)

| Page | Route | Description |
|---|---|---|
| Login | `/employee/login` | Secure login for authorized employees only |
| Dashboard | `/employee/dashboard` | KPI cards, approval trend, filterable applications table |
| Review | `/employee/review/:id` | Full applicant profile, AI risk score, SHAP bars, decision panel |

**Employee Capabilities:**
- Filter applications by status (All / Pending / Approved / Rejected / Hold)
- Search by applicant name or Loan ID
- View full feature breakdown per applicant
- Make a decision: **Approve / Reject / Hold** with an optional note
- Download a **PDF Risk Report** (applicant info + AI score + SHAP factors)

---

## 🗃 Database Schema

### `users`

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Internal auto-increment ID |
| `loan_id` | VARCHAR(20) UNIQUE | Generated ID (e.g. `LN000001`) |
| `full_name` | VARCHAR | Applicant name |
| `password_hash` | BYTEA | bcrypt-hashed password |
| `decision` | VARCHAR | Current decision status |

### `loan_applications`

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Application ID |
| `loan_id` | FK → users | References applicant |
| `age`, `income`, `loan_amount`, ... | various | All 13 raw input fields |
| `credit_score`, `dti_ratio`, ... | float | Simulated + derived features |
| `ml_prediction` | int | 0 = Low Risk, 1 = High Risk |
| `ml_probability` | float | Default probability (0.0–1.0) |
| `shap_values` | TEXT (JSON) | Top 5 SHAP factors with impact + direction |
| `decision` | VARCHAR | `pending` / `approved` / `rejected` / `hold` |
| `decided_by` | VARCHAR | Employee username who made the call |
| `decision_note` | TEXT | Reviewer's free-text note |
| `decided_at` | TIMESTAMP | When the decision was recorded |
| `created_at` | TIMESTAMP | Application submission time |

### `employees`

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Employee ID |
| `username` | VARCHAR UNIQUE | Login username |
| `password_hash` | BYTEA | bcrypt-hashed password |

---

## 📡 API Reference

### User Routes (`/user/`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/user/register` | None | Register + submit loan application → runs ML immediately |
| `POST` | `/user/login` | None | Login with `full_name` (or `loan_id`) + `password` |
| `GET` | `/user/status` | JWT | Application status (+ SHAP values if rejected) |

#### `POST /user/register` — Request Body

```json
{
  "full_name": "Priya Sharma",
  "password": "securepass123",
  "age": 34,
  "annual_income": 75000,
  "education": "Master",
  "employment_type": "Salaried",
  "months_employed": 60,
  "existing_monthly_debt": 800,
  "loan_amount": 20000,
  "loan_purpose": "Home",
  "loan_term": 48,
  "marital_status": "Married",
  "has_mortgage": 0,
  "has_dependents": 1,
  "has_cosigner": 0
}
```

#### `GET /user/status` — Response (rejected example)

```json
{
  "loan_id": "LN000042",
  "decision": "rejected",
  "ml_probability": 0.74,
  "shap_values": {
    "DTIRatio":      { "impact": "High",   "direction": "up Risk", "value": 0.63, "label": "High (up Risk)" },
    "CreditScore":   { "impact": "Medium", "direction": "up Risk", "value": 0.31, "label": "Medium (up Risk)" },
    "Loan_to_Income":{ "impact": "Medium", "direction": "up Risk", "value": 0.28, "label": "Medium (up Risk)" }
  }
}
```

> `shap_values` is **only included** when `decision == "rejected"`.

---

### Employee Routes (`/employee/`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/employee/login` | None | Employee authentication → returns JWT |
| `GET` | `/employee/dashboard` | JWT | Aggregate stats (total, pending, approved, rejected) |
| `GET` | `/employee/applications` | JWT | All applications — optional `?decision=pending\|approved\|rejected\|hold` |
| `GET` | `/employee/application/<id>` | JWT | Full single application detail + SHAP |
| `POST` | `/employee/decide/<id>` | JWT | Submit approve / reject / hold decision |

#### `POST /employee/decide/<id>` — Request Body

```json
{
  "decision": "rejected",
  "note": "High DTI ratio combined with low credit score and no co-signer."
}
```

---

### Utility Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — lists all available route groups |
| `POST` | `/download-report` | Generate and stream PDF risk report |

---

## 🚀 Setup & Installation

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/credit-risk-assessment-system.git
cd "Credit Risk Assessment System"
```

### 2. Create Python Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac / Linux
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create or edit `.env` in the project root:

```env
DB_HOST=localhost
DB_NAME=credit_risk_db
DB_USER=postgres
DB_PASS=your_postgres_password
DB_PORT=5432
JWT_SECRET=your-secret-key-change-in-production
```

### 5. Set Up PostgreSQL Database

Create the database:

```sql
CREATE DATABASE credit_risk_db;
```

Run the setup script (creates all tables + seeds employee accounts):

```bash
venv\Scripts\python.exe database\setup.py
```

### 6. Build the ML Pipeline (first-time only)

```bash
venv\Scripts\python.exe src\pipeline.py
```

This trains the XGBoost pipeline on `data/loanDefaulter.csv` and saves it to `artifacts/pipeline.pkl`.

> **Note:** If `artifacts/pipeline.pkl` already exists, skip this step.

### 7. Install Node.js Dependencies

```bash
npm install                         # installs concurrently at project root
cd credit-risk-ui && npm install    # installs React + Vite dependencies
cd ..
```

---

## ▶️ Running the App

From the **project root**, a single command starts both services:

```bash
npm run dev
```

| Service | URL | Description |
|---|---|---|
| **Frontend** (Vite) | http://localhost:5173 | React UI |
| **Backend** (Flask) | http://127.0.0.1:5000 | REST API |

The Vite dev server proxies all API requests (`/user/*`, `/employee/*`, `/download-report`) to Flask automatically — no CORS issues, no hardcoded URLs.

### Individual Commands

```bash
npm run backend     # Start Flask only (via venv Python)
npm run frontend    # Start Vite only
```

---

## 🔒 Security Notes

- All passwords (applicant and employee) are hashed with **bcrypt** — salted, never stored in plaintext
- JWT tokens carry a `role` claim (`user` or `employee`) — every protected route validates this role before serving data
- **SHAP values are never exposed to applicants unless their application is rejected** — preventing reverse-engineering of the model's decision boundary
- Employee portal has **no self-registration** — accounts are seeded by the administrator via `database/setup.py` only
- All employee actions are **attributed** — `decided_by` stores the employee username for every decision, creating a full audit trail

---

## 🔐 Employee Credentials

There are exactly **3 authorized bank employee accounts**. No self-registration is possible from the UI.

> Credentials are managed by the system administrator via `database/setup.py`. Contact your system admin for login details.

---

## 📄 PDF Risk Report

Employees can download a full PDF risk report for any application via the **📄 Download Report** button on the Application Review page.

The report includes:
- Loan ID and applicant information
- Full loan details (amount, purpose, term)
- AI decision + risk probability
- Top SHAP risk factors with impact levels and directions

Reports are generated on-demand via **ReportLab** and streamed directly from Flask — no files stored on disk.

---

## 🧪 Notebooks & EDA

The `notebooks/` directory contains the full research pipeline:

| Notebook | Purpose |
|---|---|
| `basic-eda.ipynb` | Initial exploration — distributions, missingness, class balance |
| `eda2.ipynb` | Advanced EDA — DTI patterns, income tiers, cross-feature default rates |
| `cleaning.ipynb` | Data cleaning — type coercion, outlier handling |
| `preprocessing.ipynb` | Feature engineering + comparison of 10 classification algorithms |

---

## 📊 Power BI Dashboard

The `dashboard/Credit_Assessment.pbix` file contains the executive Power BI report covering:
- Portfolio size and approval behavior (88.39% approval rate, 255K+ applications)
- Credit score tier distribution across the book
- DTI and income mix analysis
- Debt burden, EMI, and loan-to-income ratio deep-dives
- Monthly application volume trend (including the unexplained June drop)

---

*Built with care using XGBoost + SHAP · PostgreSQL · Flask · React · Vite*
