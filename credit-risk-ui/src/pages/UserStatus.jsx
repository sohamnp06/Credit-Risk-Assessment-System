import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserStatus } from "../services/api";

const DECISION_CONFIG = {
  pending:  { icon: "⏳", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Under Review", msg: "Your application is being reviewed by our team." },
  approved: { icon: "✅", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", label: "Approved!", msg: "Congratulations! Your loan has been approved." },
  rejected: { icon: "❌", color: "#f43f5e", bg: "rgba(244,63,94,0.08)",  border: "rgba(244,63,94,0.2)",  label: "Not Approved", msg: "Unfortunately your application was not approved at this time." },
  hold:     { icon: "🔄", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", label: "On Hold", msg: "Your application requires additional review." },
};

const fmt = (n) => typeof n === "number" ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : n;

export default function UserStatus() {
  const nav = useNavigate();
  const loanId   = localStorage.getItem("loan_id");
  const fullName = localStorage.getItem("full_name");

  const [data, setData]     = useState(null);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserStatus();
        if (res.error) { setError(res.error); }
        else { setData(res); }
      } catch {
        setError("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: "0 auto 1rem", borderWidth: 3 }} />
        <p style={{ color: "#475569" }}>Loading your application...</p>
      </div>
    </div>
  );

  const cfg = data ? (DECISION_CONFIG[data.decision] || DECISION_CONFIG.pending) : null;
  const risk = data ? (data.ml_probability > 0.6 ? "High" : data.ml_probability > 0.3 ? "Medium" : "Low") : null;
  const riskColor = risk === "High" ? "#f43f5e" : risk === "Medium" ? "#f59e0b" : "#10b981";

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at 50% 10%, ${cfg ? cfg.bg.replace("0.08", "0.04") : "transparent"} 0%, transparent 50%), #080c14`,
      padding: "2rem 1rem",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <p style={{ color: "#475569", fontSize: "0.8rem" }}>Signed in as</p>
            <p style={{ color: "#94a3b8", fontWeight: 600 }}>{fullName}</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#3b82f6", fontSize: "0.9rem", fontWeight: 700, background: "rgba(59,130,246,0.1)", padding: "0.4rem 0.875rem", borderRadius: 8, border: "1px solid rgba(59,130,246,0.15)" }}>
              {loanId}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={logout} id="status-logout-btn">Logout</button>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 12, padding: "1rem", color: "#fb7185", marginBottom: "1.5rem" }}>
            ⚠️ {error}
          </div>
        )}

        {data && cfg && (
          <>
            {/* Decision Banner */}
            <div style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: 20,
              padding: "2rem",
              marginBottom: "1.5rem",
              textAlign: "center",
              animation: "fadeIn 0.5s ease",
              boxShadow: `0 0 60px ${cfg.bg}`,
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>{cfg.icon}</div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: cfg.color, marginBottom: "0.5rem" }}>{cfg.label}</h2>
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>{cfg.msg}</p>

              {data.decided_by && (
                <div style={{ marginTop: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "0.75rem", display: "inline-block" }}>
                  <p style={{ color: "#64748b", fontSize: "0.78rem" }}>Decision by <strong style={{ color: "#94a3b8" }}>{data.decided_by}</strong> · {data.decided_at?.split("T")[0]}</p>
                </div>
              )}

              {data.decision_note && (
                <div style={{ marginTop: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "1rem" }}>
                  <p style={{ color: "#64748b", fontSize: "0.78rem", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Note from reviewer</p>
                  <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{data.decision_note}</p>
                </div>
              )}
            </div>

            {/* Application Details */}
            <div style={{ background: "rgba(13,20,36,0.9)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: "1.75rem", marginBottom: "1.25rem" }}>
              <p className="section-title">📋 Application Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                {[
                  ["Loan Amount", fmt(data.loan_amount)],
                  ["Loan Purpose", data.loan_purpose],
                  ["Loan Term", `${data.loan_term} months`],
                  ["Applied On", data.created_at?.split("T")[0]],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "1rem" }}>
                    <p style={{ color: "#475569", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>{k}</p>
                    <p style={{ color: "#f1f5f9", fontWeight: 700 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Indicator */}
            <div style={{ background: "rgba(13,20,36,0.9)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: "1.75rem" }}>
              <p className="section-title">🤖 AI Risk Assessment</p>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "2.5rem", fontWeight: 900, color: riskColor, fontFamily: "'JetBrains Mono', monospace" }}>
                    {(data.ml_probability * 100).toFixed(1)}%
                  </p>
                  <p style={{ color: "#475569", fontSize: "0.78rem" }}>Default Probability</p>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Risk Level</span>
                    <span style={{ color: riskColor, fontWeight: 700, fontSize: "0.8rem" }}>{risk}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(data.ml_probability * 100).toFixed(1)}%`, background: riskColor }} />
                  </div>
                  <p style={{ color: "#334155", fontSize: "0.72rem", marginTop: "0.5rem" }}>
                    Based on your income, credit profile, and loan parameters
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!data && !error && (
          <div style={{ textAlign: "center", padding: "4rem", color: "#334155" }}>
            <p>No application found for your account.</p>
            <button className="btn btn-primary" style={{ marginTop: "1.5rem" }} onClick={() => nav("/user/register")}>
              Apply Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
