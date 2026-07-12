import { useNavigate } from "react-router-dom";

export default function Portal() {
  const nav = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.06) 0%, transparent 60%), #080c14",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: "99px",
          padding: "0.4rem 1rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ width: 8, height: 8, background: "#22d3ee", borderRadius: "50%", boxShadow: "0 0 12px #22d3ee" }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#7dd3fc", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            AI-Powered Credit Risk Engine
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 900,
          color: "#f1f5f9",
          lineHeight: 1.1,
          marginBottom: "1rem",
          letterSpacing: "-0.03em",
        }}>
          Credit Risk{" "}
          <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Assessment
          </span>
          {" "}System
        </h1>

        <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
          Intelligent loan decisions powered by machine learning and SHAP explainability.
        </p>
      </div>

      {/* Portal Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", width: "100%", maxWidth: 760 }}>

        {/* User Portal */}
        <div style={{
          background: "linear-gradient(145deg, rgba(17,24,39,0.9), rgba(13,20,36,0.95))",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 24,
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
          animation: "fadeIn 0.6s ease both",
          transition: "transform 0.2s, box-shadow 0.2s",
          cursor: "default",
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 16px 60px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.05)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 0 60px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)";
          }}
        >
          <div>
            <div style={{
              width: 56, height: 56,
              background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))",
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem",
              marginBottom: "1.25rem",
              border: "1px solid rgba(59,130,246,0.2)",
            }}>👤</div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>Loan Applicant</h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Apply for a loan, receive instant AI risk assessment, and track your application status in real time.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => nav("/user/register")}
              style={{ padding: "0.875rem" }}
              id="portal-user-register-btn"
            >
              ✨ New Application
            </button>
            <button
              className="btn btn-ghost btn-full"
              onClick={() => nav("/user/login")}
              style={{ padding: "0.875rem" }}
              id="portal-user-login-btn"
            >
              🔐 Sign In
            </button>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
            {["AI Risk Assessment", "SHAP Explanation", "Real-time Status"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Portal */}
        <div style={{
          background: "linear-gradient(145deg, rgba(17,24,39,0.9), rgba(13,20,36,0.95))",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 24,
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
          animation: "fadeIn 0.6s 0.1s ease both",
          transition: "transform 0.2s, box-shadow 0.2s",
          cursor: "default",
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 16px 60px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,0.05)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 0 60px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)";
          }}
        >
          <div>
            <div style={{
              width: 56, height: 56,
              background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))",
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem",
              marginBottom: "1.25rem",
              border: "1px solid rgba(139,92,246,0.2)",
            }}>🏦</div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>Bank Employee</h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Review applications with AI insights, SHAP explanations, and make final lending decisions.
            </p>
          </div>

          <button
            className="btn btn-full"
            style={{
              padding: "0.875rem",
              background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(99,102,241,0.9))",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              borderRadius: 12,
            }}
            onClick={() => nav("/employee/login")}
            id="portal-employee-login-btn"
          >
            🔐 Employee Login
          </button>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
            {["Review All Applications", "SHAP AI Explanations", "Approve / Reject / Hold"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p style={{ color: "#1e293b", fontSize: "0.75rem", marginTop: "2.5rem", textAlign: "center" }}>
        Powered by XGBoost + SHAP · PostgreSQL · React · Flask
      </p>
    </div>
  );
}
