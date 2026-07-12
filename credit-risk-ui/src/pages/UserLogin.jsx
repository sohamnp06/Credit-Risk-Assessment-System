import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userLogin } from "../services/api";

const AuthLayout = ({ title, subtitle, icon, children, footer }) => (
  <div style={{
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.07) 0%, transparent 60%), #080c14",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
  }}>
    <div style={{ width: "100%", maxWidth: 420, animation: "fadeIn 0.5s ease" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: "0 auto 1rem",
          background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))",
          border: "1px solid rgba(59,130,246,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem",
        }}>{icon}</div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.4rem" }}>{title}</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>{subtitle}</p>
      </div>

      <div style={{
        background: "rgba(13,20,36,0.9)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        padding: "2rem",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {children}
      </div>
      {footer && <div style={{ marginTop: "1.25rem", textAlign: "center" }}>{footer}</div>}
    </div>
  </div>
);

export default function UserLogin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", loan_id: "", password: "" });
  const [loginBy, setLoginBy] = useState("name"); // "name" or "loan_id"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = loginBy === "name"
        ? { full_name: form.full_name, password: form.password }
        : { loan_id: form.loan_id, password: form.password };

      const res = await userLogin(payload);
      if (res.error) { setError(res.error); return; }

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", "user");
      localStorage.setItem("loan_id", res.loan_id);
      localStorage.setItem("full_name", res.full_name);
      nav("/user/status");
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon="👤"
      title="Applicant Login"
      subtitle="Sign in to check your loan status"
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ color: "#475569", fontSize: "0.85rem" }}>New applicant?{" "}
            <button onClick={() => nav("/user/register")} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 600, cursor: "pointer" }}>
              Apply Now
            </button>
          </span>
          <button onClick={() => nav("/")} style={{ background: "none", border: "none", color: "#334155", fontSize: "0.8rem", cursor: "pointer" }}>
            ← Back to Home
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, gap: 4 }}>
          {[["name", "By Name"], ["loan_id", "By Loan ID"]].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setLoginBy(val)}
              style={{
                flex: 1, padding: "0.5rem", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: "0.8rem", fontFamily: "inherit",
                background: loginBy === val ? "#1e3a5f" : "transparent",
                color: loginBy === val ? "#93c5fd" : "#64748b",
                transition: "all 0.2s",
              }}
            >{label}</button>
          ))}
        </div>

        {loginBy === "name" ? (
          <div>
            <label className="form-label">Full Name</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Enter your full name" id="user-login-name" />
          </div>
        ) : (
          <div>
            <label className="form-label">Loan ID</label>
            <input name="loan_id" value={form.loan_id} onChange={handleChange} placeholder="e.g. LN000001" className="mono" id="user-login-loanid" />
          </div>
        )}

        <div>
          <label className="form-label">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter password" id="user-login-password" />
        </div>

        {error && (
          <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: "0.75rem 1rem", color: "#fb7185", fontSize: "0.85rem" }}>
            ⚠️ {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="user-login-submit">
          {loading ? <><span className="spinner" /> Signing in...</> : "Sign In →"}
        </button>
      </form>
    </AuthLayout>
  );
}
