import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userRegister } from "../services/api";

// ── Reusable field components ─────────────────────────────────────────────────
const Field = ({ label, name, value, onChange, type = "text", placeholder }) => (
  <div>
    <label className="form-label">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder || label} id={`reg-${name}`} />
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="form-label">{label}</label>
    <select name={name} value={value} onChange={onChange} id={`reg-${name}`}>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  </div>
);

const SECTIONS = [
  {
    title: "👤 Personal Information",
    fields: [
      { label: "Full Name", name: "full_name", type: "text" },
      { label: "Age", name: "age", type: "number", placeholder: "e.g. 35" },
      { label: "Password", name: "password", type: "password" },
    ],
  },
  {
    title: "💼 Employment",
    fields: [
      { label: "Education Level", name: "education", type: "select", options: ["High School", "Bachelor's", "Master's", "PhD"] },
      { label: "Employment Type", name: "employment_type", type: "select", options: ["Salaried", "Self-Employed", "Unemployed"] },
      { label: "Months Employed", name: "months_employed", type: "number", placeholder: "e.g. 48" },
    ],
  },
  {
    title: "💰 Financial",
    fields: [
      { label: "Annual Income (₹ / $)", name: "annual_income", type: "number", placeholder: "e.g. 75000" },
      { label: "Existing Monthly Debt Payments", name: "existing_monthly_debt", type: "number", placeholder: "e.g. 500" },
    ],
  },
  {
    title: "🏦 Loan Request",
    fields: [
      { label: "Loan Amount", name: "loan_amount", type: "number", placeholder: "e.g. 25000" },
      { label: "Loan Purpose", name: "loan_purpose", type: "select", options: ["Home", "Auto", "Education", "Business", "Other"] },
      { label: "Loan Term (Months)", name: "loan_term", type: "select", options: [
          { label: "12 months", value: 12 }, { label: "24 months", value: 24 },
          { label: "36 months", value: 36 }, { label: "48 months", value: 48 },
          { label: "60 months", value: 60 },
        ]
      },
    ],
  },
  {
    title: "👨‍👩‍👧 Personal & Additional",
    fields: [
      { label: "Marital Status", name: "marital_status", type: "select", options: ["Single", "Married", "Divorced"] },
      { label: "Has Dependents", name: "has_dependents", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { label: "Has Mortgage", name: "has_mortgage", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { label: "Has Co-Signer", name: "has_cosigner", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    ],
  },
];

export default function UserRegister() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    full_name: "", age: "", password: "",
    education: "Bachelor's", employment_type: "Salaried", months_employed: "",
    annual_income: "", existing_monthly_debt: "",
    loan_amount: "", loan_purpose: "Home", loan_term: 36,
    marital_status: "Single", has_dependents: 0, has_mortgage: 0, has_cosigner: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        annual_income: Number(form.annual_income),
        existing_monthly_debt: Number(form.existing_monthly_debt),
        loan_amount: Number(form.loan_amount),
        loan_term: Number(form.loan_term),
        months_employed: Number(form.months_employed),
        has_dependents: Number(form.has_dependents),
        has_mortgage: Number(form.has_mortgage),
        has_cosigner: Number(form.has_cosigner),
      };
      const res = await userRegister(payload);
      if (res.error) { setError(res.error); return; }
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", "user");
      localStorage.setItem("loan_id", res.loan_id);
      localStorage.setItem("full_name", form.full_name);
      setSuccess(res);
    } catch (err) {
      setError("Server error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: "100vh", background: "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.08) 0%, transparent 60%), #080c14",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
      }}>
        <div style={{
          maxWidth: 480, width: "100%", textAlign: "center",
          background: "rgba(13,20,36,0.9)", border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 24, padding: "3rem 2rem", animation: "fadeIn 0.5s ease",
          boxShadow: "0 0 60px rgba(16,185,129,0.1)",
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎉</div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>Application Submitted!</h2>
          <p style={{ color: "#64748b", marginBottom: "2rem" }}>Your loan application is under review.</p>

          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: "1.5rem", marginBottom: "2rem" }}>
            <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Your Loan ID</p>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: "#34d399", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>
              {success.loan_id}
            </p>
            <p style={{ color: "#475569", fontSize: "0.78rem", marginTop: "0.5rem" }}>Save this ID — use it to check your status anytime</p>
          </div>

          <button className="btn btn-success btn-full btn-lg" onClick={() => nav("/user/status")} id="reg-success-view-status">
            View Application Status →
          </button>
          <button onClick={() => nav("/")} style={{ background: "none", border: "none", color: "#334155", marginTop: "1rem", cursor: "pointer", fontSize: "0.85rem" }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 30%, rgba(59,130,246,0.06) 0%, transparent 60%), #080c14",
      padding: "2rem 1rem",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <button onClick={() => nav("/")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.85rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 4, height: 36, background: "linear-gradient(to bottom, #3b82f6, #8b5cf6)", borderRadius: 99 }} />
            <h1 style={{ fontSize: "1.9rem", fontWeight: 900, color: "#f1f5f9" }}>New Loan Application</h1>
          </div>
          <p style={{ color: "#475569", fontSize: "0.875rem", marginLeft: "1.25rem" }}>
            Fill in your details. Everything else — credit score, derived metrics — is computed automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {SECTIONS.map((section, si) => (
            <div key={si} style={{
              background: "rgba(13,20,36,0.9)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 18, padding: "1.75rem", marginBottom: "1.25rem",
              backdropFilter: "blur(10px)", animation: `fadeIn 0.4s ${si * 0.08}s ease both`,
            }}>
              <p className="section-title">{section.title}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                {section.fields.map((f) =>
                  f.type === "select" ? (
                    <Select key={f.name} label={f.label} name={f.name} value={form[f.name]} onChange={handleChange} options={f.options} />
                  ) : (
                    <Field key={f.name} label={f.label} name={f.name} type={f.type} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} />
                  )
                )}
              </div>
            </div>
          ))}

          {/* Info box */}
          <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <span style={{ fontSize: "1rem" }}>ℹ️</span>
            <p style={{ color: "#64748b", fontSize: "0.82rem", lineHeight: 1.6 }}>
              Credit Score, Interest Rate, and other derived metrics are automatically calculated by our system — you don't need to provide them.
            </p>
          </div>

          {error && (
            <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: "0.875rem 1rem", color: "#fb7185", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="reg-submit">
            {loading ? <><span className="spinner" /> Processing Application...</> : "🚀 Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
