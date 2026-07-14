import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeLogin } from "../services/api";

export default function EmployeeLogin() {
  const nav = useNavigate();
  const [form, setForm]   = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await employeeLogin(form);
      if (res.error) { setError(res.error); return; }
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", "employee");
      localStorage.setItem("username", res.username);
      nav("/employee/dashboard");
    } catch {
      setError("Server error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 70% 40%, rgba(139,92,246,0.08) 0%, transparent 60%), #080c14",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
    }}>
      <div style={{ width: "100%", maxWidth: 400, animation: "fadeIn 0.5s ease" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: "0 auto 1rem",
            background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.15))",
            border: "1px solid rgba(139,92,246,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem",
          }}>🏦</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.4rem" }}>Employee Portal</h1>
          <p style={{ color: "#475569", fontSize: "0.875rem" }}>Authorized bank staff only</p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            marginTop: "0.75rem", background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.15)", borderRadius: 99,
            padding: "0.3rem 0.875rem",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 8px #a78bfa" }} />
            <span style={{ fontSize: "0.7rem", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>No public registration</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(13,20,36,0.95)",
          border: "1px solid rgba(139,92,246,0.15)",
          borderRadius: 20, padding: "2rem",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.05)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="form-label">Username</label>
              <input name="username" value={form.username} onChange={handleChange} placeholder="Enter username" id="emp-login-username" autoComplete="username" />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter password" id="emp-login-password" autoComplete="current-password" />
            </div>

            {error && (
              <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 10, padding: "0.75rem 1rem", color: "#fb7185", fontSize: "0.85rem" }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-full btn-lg"
              disabled={loading}
              id="emp-login-submit"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(99,102,241,0.9))",
                color: "#fff", border: "none", borderRadius: 12, padding: "1rem",
                fontFamily: "inherit", fontWeight: 700, fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
                transition: "all 0.2s",
              }}
            >
              {loading ? <><span className="spinner" /> Authenticating...</> : "🔐 Access Dashboard"}
            </button>
          </form>


        </div>

        <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
          <button onClick={() => nav("/")} style={{ background: "none", border: "none", color: "#334155", fontSize: "0.8rem", cursor: "pointer" }}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
