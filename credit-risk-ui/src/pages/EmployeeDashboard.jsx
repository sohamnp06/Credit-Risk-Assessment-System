import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeeDashboard, getApplications } from "../services/api";

const TABS = ["All", "Pending", "Approved", "Rejected", "Hold"];

const BADGE = {
  pending:  <span className="badge badge-pending">⏳ Pending</span>,
  approved: <span className="badge badge-approved">✅ Approved</span>,
  rejected: <span className="badge badge-rejected">❌ Rejected</span>,
  hold:     <span className="badge badge-hold">🔄 Hold</span>,
};

const RISK_COLOR = (prob) =>
  prob > 0.6 ? "#f43f5e" : prob > 0.3 ? "#f59e0b" : "#10b981";

const StatCard = ({ icon, label, value, color = "#3b82f6" }) => (
  <div style={{
    background: "rgba(13,20,36,0.9)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 16, padding: "1.25rem 1.5rem",
    display: "flex", alignItems: "center", gap: "1rem",
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 14,
      background: `${color}18`, border: `1px solid ${color}25`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1.3rem",
    }}>{icon}</div>
    <div>
      <p style={{ color: "#475569", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ color: "#f1f5f9", fontSize: "1.6rem", fontWeight: 800, lineHeight: 1.2 }}>{value ?? "—"}</p>
    </div>
  </div>
);

export default function EmployeeDashboard() {
  const nav = useNavigate();
  const username = localStorage.getItem("username");
  const [stats, setStats]   = useState(null);
  const [apps, setApps]     = useState([]);
  const [tab, setTab]       = useState("All");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([getEmployeeDashboard(), getApplications()]);
        setStats(s);
        setApps(Array.isArray(a) ? a : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = apps.filter(a => {
    const matchTab = tab === "All" || a.decision === tab.toLowerCase();
    const matchSearch = !search ||
      a.loan_id?.toLowerCase().includes(search.toLowerCase()) ||
      a.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const logout = () => { localStorage.clear(); nav("/"); };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 80% 10%, rgba(139,92,246,0.06) 0%, transparent 50%), #080c14",
      padding: "1.5rem",
    }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9" }}>
            🏦 Employee Dashboard
          </h1>
          <p style={{ color: "#475569", fontSize: "0.85rem" }}>Welcome, <span style={{ color: "#a78bfa", fontWeight: 600 }}>{username}</span></p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout} id="emp-dashboard-logout">Logout</button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <StatCard icon="📋" label="Total"    value={stats.total}    color="#3b82f6" />
          <StatCard icon="⏳" label="Pending"  value={stats.pending}  color="#f59e0b" />
          <StatCard icon="✅" label="Approved" value={stats.approved} color="#10b981" />
          <StatCard icon="❌" label="Rejected" value={stats.rejected} color="#f43f5e" />
          <StatCard icon="🔄" label="On Hold"  value={stats.hold}     color="#8b5cf6" />
          <StatCard icon="⚠️" label="High Risk" value={stats.high_risk_count} color="#f43f5e" />
        </div>
      )}

      {/* Applications Table */}
      <div style={{ background: "rgba(13,20,36,0.9)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, overflow: "hidden" }}>
        {/* Table header controls */}
        <div style={{ padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: "0.4rem 0.875rem", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.78rem", fontFamily: "inherit",
                  background: tab === t ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                  color: tab === t ? "#a78bfa" : "#475569",
                  transition: "all 0.2s",
                }}
              >{t}</button>
            ))}
          </div>
          <input
            placeholder="Search by name or Loan ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 240, padding: "0.5rem 0.875rem", fontSize: "0.82rem" }}
            id="emp-dashboard-search"
          />
        </div>

        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center" }}>
            <div className="spinner" style={{ width: 36, height: 36, margin: "0 auto 1rem", borderWidth: 3 }} />
            <p style={{ color: "#334155" }}>Loading applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#334155" }}>No applications found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Applicant</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>ML Risk</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => (
                  <tr key={app.id} onClick={() => nav(`/employee/review/${app.id}`)} id={`emp-app-row-${app.id}`}>
                    <td><span className="mono" style={{ color: "#3b82f6", fontWeight: 600 }}>{app.loan_id}</span></td>
                    <td style={{ color: "#f1f5f9", fontWeight: 500 }}>{app.full_name || "—"}</td>
                    <td style={{ color: "#f1f5f9", fontWeight: 700 }}>${app.loan_amount?.toLocaleString()}</td>
                    <td>{app.loan_purpose}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: RISK_COLOR(app.ml_probability) }} />
                        <span style={{ color: RISK_COLOR(app.ml_probability), fontWeight: 700, fontSize: "0.82rem", fontFamily: "monospace" }}>
                          {app.ml_probability != null ? `${(app.ml_probability * 100).toFixed(1)}%` : "—"}
                        </span>
                      </div>
                    </td>
                    <td>{BADGE[app.decision] || app.decision}</td>
                    <td style={{ fontSize: "0.78rem" }}>{app.date || app.created_at?.split("T")[0]}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); nav(`/employee/review/${app.id}`); }}>
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
