import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApplicationDetail, submitDecision, downloadReport } from "../services/api";

const RISK_COLOR = (p) => p > 0.6 ? "#f43f5e" : p > 0.3 ? "#f59e0b" : "#10b981";
const RISK_LABEL = (p) => p > 0.6 ? "High Risk" : p > 0.3 ? "Medium Risk" : "Low Risk";

const InfoRow = ({ label, value, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
    <span style={{ color: "#475569", fontSize: "0.82rem" }}>{label}</span>
    <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.85rem", fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit" }}>{value ?? "—"}</span>
  </div>
);

const SectionCard = ({ title, children }) => (
  <div style={{ background: "rgba(13,20,36,0.9)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "1.5rem", marginBottom: "1rem" }}>
    <p className="section-title">{title}</p>
    {children}
  </div>
);

export default function ApplicationReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const username = localStorage.getItem("username");

  const [app, setApp]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [decision, setDecision] = useState("");
  const [note, setNote]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getApplicationDetail(id);
        if (res.error) { setError(res.error); }
        else {
          setApp(res);
          setDecision(res.decision !== "pending" ? res.decision : "");
        }
      } catch { setError("Failed to load application."); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleDecide = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      const res = await submitDecision(id, decision, note);
      if (res.error) { setError(res.error); return; }
      setSubmitted(true);
      setApp(prev => ({ ...prev, decision, decided_by: username }));
    } catch { setError("Failed to submit decision."); }
    finally { setSubmitting(false); }
  };

  const handleDownload = async () => {
    if (!app) return;
    const res = await downloadReport({
      loan_id: app.loan_id,
      decision: app.decision,
      probability: app.ml_probability,
      shap_values: app.shap_values,
      features: {
        Age: app.age, "Annual Income": app.annual_income,
        "Loan Amount": app.loan_amount, "Credit Score": app.credit_score,
        Education: app.education, "Employment Type": app.employment_type,
        "Months Employed": app.months_employed, "DTI Ratio": app.dti_ratio,
        "Loan Purpose": app.loan_purpose, "Loan Term": `${app.loan_term} months`,
      },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report_${app.loan_id}.pdf`; a.click();
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: "0 auto 1rem", borderWidth: 3 }} />
        <p style={{ color: "#475569" }}>Loading application...</p>
      </div>
    </div>
  );

  const riskColor = app ? RISK_COLOR(app.ml_probability) : "#94a3b8";

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 50% 0%, ${riskColor}08 0%, transparent 40%), #080c14`, padding: "1.5rem" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Back + Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
          <div>
            <button onClick={() => nav("/employee/dashboard")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.85rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              ← Back to Dashboard
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9" }}>Application Review</h1>
              {app && <span className="mono" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", padding: "0.3rem 0.75rem", borderRadius: 8, fontSize: "0.9rem", fontWeight: 700, border: "1px solid rgba(59,130,246,0.15)" }}>
                {app.loan_id}
              </span>}
            </div>
            {app?.full_name && <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>Applicant: <strong style={{ color: "#94a3b8" }}>{app.full_name}</strong></p>}
          </div>
          {app && (
            <button className="btn btn-ghost btn-sm" onClick={handleDownload} id="review-download-pdf">📄 PDF Report</button>
          )}
        </div>

        {error && (
          <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 12, padding: "1rem", color: "#fb7185", marginBottom: "1.25rem" }}>
            ⚠️ {error}
          </div>
        )}

        {app && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.25rem" }}>
            {/* LEFT COLUMN */}
            <div>
              {/* AI Risk Score */}
              <div style={{
                background: `linear-gradient(135deg, ${riskColor}12, rgba(13,20,36,0.95))`,
                border: `1px solid ${riskColor}25`, borderRadius: 18, padding: "1.75rem", marginBottom: "1rem",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle, ${riskColor}15, transparent)`, borderRadius: "50%", transform: "translate(30%, -30%)" }} />
                <p className="section-title">🤖 AI Risk Assessment</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <p style={{ fontSize: "3.5rem", fontWeight: 900, color: riskColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                      {(app.ml_probability * 100).toFixed(1)}%
                    </p>
                    <p style={{ color: "#64748b", fontSize: "0.82rem", marginTop: "0.25rem" }}>Default Probability</p>
                  </div>
                  <div style={{ paddingBottom: "0.5rem" }}>
                    <span style={{ background: `${riskColor}18`, color: riskColor, padding: "0.4rem 0.875rem", borderRadius: 99, fontSize: "0.82rem", fontWeight: 700, border: `1px solid ${riskColor}25` }}>
                      {RISK_LABEL(app.ml_probability)}
                    </span>
                    <p style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.35rem" }}>
                      ML: {app.ml_prediction === 1 ? "⚠️ Likely Default" : "✅ Likely Safe"}
                    </p>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(app.ml_probability * 100).toFixed(1)}%`, background: `linear-gradient(to right, #10b981, ${riskColor})` }} />
                </div>
              </div>

              {/* SHAP */}
              {app.shap_values && Object.keys(app.shap_values).length > 0 && (
                <SectionCard title="📊 SHAP Risk Explanation (Top Factors)">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {Object.entries(app.shap_values).map(([feat, info]) => {
                      const isRisk = info.direction?.includes("↑");
                      const barColor = isRisk ? "#f43f5e" : "#10b981";
                      const pct = Math.min(100, Math.abs(info.value || 0) * 100);
                      return (
                        <div key={feat} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "0.75rem 1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                            <span style={{ color: "#94a3b8", fontSize: "0.82rem", fontWeight: 600 }}>{feat}</span>
                            <span style={{ color: barColor, fontSize: "0.78rem", fontWeight: 700 }}>{info.label}</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.max(5, pct)}%`, background: barColor, borderRadius: 99, transition: "width 1s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              )}

              {/* Application Details */}
              <SectionCard title="📋 Loan Details">
                <InfoRow label="Loan Amount"   value={`$${app.loan_amount?.toLocaleString()}`} mono />
                <InfoRow label="Loan Purpose"  value={app.loan_purpose} />
                <InfoRow label="Loan Term"     value={`${app.loan_term} months`} />
                <InfoRow label="Interest Rate" value={`${app.interest_rate?.toFixed(2)}%`} mono />
                <InfoRow label="Estimated EMI" value={`$${app.estimated_emi?.toFixed(2)}`} mono />
                <InfoRow label="EMI to Income" value={`${(app.emi_to_income * 100)?.toFixed(1)}%`} mono />
                <InfoRow label="DTI Ratio"     value={`${(app.dti_ratio * 100)?.toFixed(1)}%`} mono />
              </SectionCard>

              <SectionCard title="👤 Applicant Profile">
                <InfoRow label="Age"              value={app.age} />
                <InfoRow label="Annual Income"    value={`$${app.annual_income?.toLocaleString()}`} mono />
                <InfoRow label="Education"        value={app.education} />
                <InfoRow label="Employment Type"  value={app.employment_type} />
                <InfoRow label="Months Employed"  value={app.months_employed} />
                <InfoRow label="Marital Status"   value={app.marital_status} />
                <InfoRow label="Has Dependents"   value={app.has_dependents ? "Yes" : "No"} />
                <InfoRow label="Has Mortgage"     value={app.has_mortgage ? "Yes" : "No"} />
                <InfoRow label="Has Co-Signer"    value={app.has_cosigner ? "Yes" : "No"} />
              </SectionCard>

              <SectionCard title="📈 Credit Profile (System-Computed)">
                <InfoRow label="Credit Score"        value={app.credit_score} mono />
                <InfoRow label="Credit Score Bucket" value={app.creditscore_bucket} />
                <InfoRow label="Num Credit Lines"    value={app.num_credit_lines} />
                <InfoRow label="Income Group"        value={app.income_group} />
                <InfoRow label="Loan to Income"      value={app.loan_to_income?.toFixed(3)} mono />
                <InfoRow label="Disposable Income"   value={`$${app.disposable_income?.toLocaleString(undefined, {maximumFractionDigits: 0})}`} mono />
                <InfoRow label="Income After EMI"    value={`$${app.income_after_emi?.toLocaleString(undefined, {maximumFractionDigits: 0})}`} mono />
              </SectionCard>
            </div>

            {/* RIGHT COLUMN — Decision Panel */}
            <div>
              <div style={{
                position: "sticky", top: "1.5rem",
                background: "rgba(13,20,36,0.95)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18, padding: "1.75rem", backdropFilter: "blur(20px)",
              }}>
                <p className="section-title">⚖️ Lending Decision</p>

                {submitted && (
                  <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "0.875rem", marginBottom: "1.25rem", color: "#34d399", fontSize: "0.85rem", textAlign: "center" }}>
                    ✅ Decision saved successfully!
                  </div>
                )}

                {app.decision !== "pending" && !submitted && (
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.875rem", marginBottom: "1.25rem", textAlign: "center" }}>
                    <p style={{ color: "#64748b", fontSize: "0.78rem", marginBottom: "0.25rem" }}>Current Decision</p>
                    <span className={`badge badge-${app.decision}`} style={{ fontSize: "0.85rem" }}>
                      {app.decision?.toUpperCase()}
                    </span>
                    {app.decided_by && <p style={{ color: "#334155", fontSize: "0.75rem", marginTop: "0.5rem" }}>by {app.decided_by}</p>}
                  </div>
                )}

                {/* Decision buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
                  {[
                    { val: "approved", label: "✅ Approve", cls: "btn-success" },
                    { val: "rejected", label: "❌ Reject",  cls: "btn-danger"  },
                    { val: "hold",     label: "🔄 Hold",    cls: "btn-warning"  },
                  ].map(({ val, label, cls }) => (
                    <button
                      key={val}
                      className={`btn ${cls} btn-full`}
                      id={`review-decide-${val}`}
                      onClick={() => setDecision(val)}
                      style={{
                        opacity: decision === val ? 1 : 0.4,
                        outline: decision === val ? `2px solid currentColor` : "none",
                        outlineOffset: 2,
                      }}
                    >{label}</button>
                  ))}
                </div>

                {/* Note */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label className="form-label">Decision Note (Optional)</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                    placeholder="Add a note for the applicant..."
                    id="review-note"
                    style={{ resize: "none" }}
                  />
                </div>

                <button
                  className="btn btn-primary btn-full"
                  onClick={handleDecide}
                  disabled={!decision || submitting}
                  id="review-submit-decision"
                >
                  {submitting ? <><span className="spinner" /> Saving...</> : "Confirm Decision →"}
                </button>

                {/* Applied on */}
                <p style={{ color: "#1e293b", fontSize: "0.75rem", textAlign: "center", marginTop: "1rem" }}>
                  Applied {app.created_at?.split("T")[0]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
