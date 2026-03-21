import { useEffect, useState } from "react";
import { getModelMetrics } from "../services/api";
import localMetrics from "../../metrics.json";

// ─── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({ label, value, percentage, icon, color, description }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div className="relative bg-[#1e293b] rounded-2xl p-5 border border-white/5 overflow-hidden group hover:border-white/10 transition-all hover:-translate-y-0.5 shadow-lg">
      {/* Background glow */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity`} style={{ background: color }}></div>

      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full`} style={{ background: `${color}22`, color }}>
          {pct}%
        </span>
      </div>

      <div className="text-3xl font-bold text-white mb-1">
        {(value * 100).toFixed(2)}%
      </div>
      <div className="text-sm font-semibold text-slate-300 mb-1">{label}</div>
      <div className="text-xs text-slate-500 leading-relaxed">{description}</div>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color }}
        ></div>
      </div>
    </div>
  );
}

// ─── Confusion Matrix ────────────────────────────────────────────────────────
function ConfusionMatrix({ data }) {
  if (!data) return null;
  const [[tn, fp], [fn, tp]] = data;
  const total = tn + fp + fn + tp;

  const cells = [
    { label: "True Negative", sublabel: "Correct Non-Default", value: tn, type: "good", pos: "top-left" },
    { label: "False Positive", sublabel: "Incorrectly Flagged", value: fp, type: "bad", pos: "top-right" },
    { label: "False Negative", sublabel: "Missed Defaults", value: fn, type: "bad", pos: "bottom-left" },
    { label: "True Positive", sublabel: "Correct Default", value: tp, type: "good", pos: "bottom-right" },
  ];

  return (
    <div>
      {/* Axis labels */}
      <div className="flex items-center mb-3">
        <div className="w-1/2 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Predicted: No Default</div>
        <div className="w-1/2 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Predicted: Default</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cells.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl p-5 border transition-all hover:scale-[1.02] ${
              c.type === "good"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div className={`text-3xl font-bold mb-2 ${c.type === "good" ? "text-emerald-400" : "text-red-400"}`}>
              {c.value.toLocaleString()}
            </div>
            <div className="text-sm font-semibold text-white">{c.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{c.sublabel}</div>
            <div className={`text-xs mt-2 font-mono ${c.type === "good" ? "text-emerald-500" : "text-red-500"}`}>
              {((c.value / total) * 100).toFixed(1)}% of total
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-slate-500 text-center">
        Total samples: <span className="text-slate-300 font-mono font-semibold">{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─── Model Feature Card ───────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="flex gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-white mb-0.5">{title}</div>
        <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AboutModel() {
  // Pre-load local metrics.json immediately so the page is never blank
  const [data, setData] = useState(localMetrics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("local");

  useEffect(() => { fetchMetrics(); }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await getModelMetrics();
      if (res.error) throw new Error(res.error);
      setData(res);
      setSource("api");
      setError(null);
    } catch (err) {
      console.warn("Backend unavailable, using local metrics.json:", err.message);
      setData(localMetrics);
      setSource("local");
      setError(null); // Don't show error — we have fallback data
    } finally {
      setLoading(false);
    }
  };

  const metrics = data
    ? [
        {
          label: "Accuracy",
          value: data.accuracy,
          icon: "🎯",
          color: "#6366f1",
          description: "Overall fraction of correct predictions made by the model.",
        },
        {
          label: "Precision",
          value: data.precision,
          icon: "🔬",
          color: "#f59e0b",
          description: "Of all predicted defaults, how many were actually defaults.",
        },
        {
          label: "Recall",
          value: data.recall,
          icon: "📡",
          color: "#10b981",
          description: "Of all actual defaults, how many the model correctly caught.",
        },
        {
          label: "F1 Score",
          value: data.f1_score,
          icon: "⚖️",
          color: "#3b82f6",
          description: "Harmonic mean of precision and recall — the balanced score.",
        },
        {
          label: "ROC-AUC",
          value: data.roc_auc,
          icon: "📈",
          color: "#ec4899",
          description: "Area under the ROC curve. Higher means better discrimination.",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 md:p-10 font-sans">

      {/* ── Header ── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
          <h1 className="text-3xl font-bold text-white">About The Model</h1>
        </div>
        <p className="text-slate-400 ml-5">Evaluation metrics &amp; performance details for the deployed credit risk engine.</p>
      </div>

      {/* ── Model Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        {/* Main info */}
        <div className="lg:col-span-2 bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl">🤖</div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest">Active Model</div>
              <div className="text-xl font-bold text-white">XGBoost Classifier</div>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-5">
            XGBoost (Extreme Gradient Boosting) is an ensemble machine learning algorithm that builds an additive model using decision trees in a sequential fashion. Each tree corrects the errors of its predecessor, making the model exceptionally powerful for structured/tabular data like credit risk prediction. A custom probability threshold is used to optimize recall for catching defaulters.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <FeatureCard icon="🌲" title="Tree-based Ensemble" desc="Combines many weak decision trees into a strong predictor." />
            <FeatureCard icon="⚡" title="Gradient Boosting" desc="Iteratively reduces prediction error with each new tree." />
            <FeatureCard icon="🎛️" title="Custom Threshold" desc="Tuned cutoff probability to balance precision vs. recall." />
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col gap-4">
          <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Quick Stats</div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-center text-red-400 text-sm">{error}</div>
          ) : data && (
            <>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-slate-400 text-sm">ROC-AUC Score</span>
                <span className="text-lg font-bold text-pink-400">{(data.roc_auc * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-slate-400 text-sm">Recall Rate</span>
                <span className="text-lg font-bold text-emerald-400">{(data.recall * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-slate-400 text-sm">Precision</span>
                <span className="text-lg font-bold text-amber-400">{(data.precision * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-400 text-sm">F1 Score</span>
                <span className="text-lg font-bold text-blue-400">{(data.f1_score * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-auto pt-3 border-t border-white/5">
                <div className="text-xs text-center">
                  {source === "api" ? (
                    <span className="text-emerald-400">🟢 Live from backend API</span>
                  ) : (
                    <span className="text-amber-400">🟡 From local metrics.json</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div className="flex items-center justify-center gap-3 text-slate-400 py-16">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span>Loading evaluation metrics from backend…</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
          <button onClick={fetchMetrics} className="ml-auto text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-all">
            Retry
          </button>
        </div>
      )}

      {/* ── Metric Cards ── */}
      {!loading && data && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <div className="w-2 h-5 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-white">Performance Metrics</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>

          {/* ── Confusion Matrix Section ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

            <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-5 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
                <h2 className="text-lg font-bold text-white">Confusion Matrix</h2>
              </div>
              <ConfusionMatrix data={data.confusion_matrix} />
            </div>

            {/* Interpretation card */}
            <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
                <h2 className="text-lg font-bold text-white">How To Read This</h2>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="font-semibold text-emerald-400 mb-1">✅ True Negative (TN)</div>
                  <div className="text-slate-400">Model correctly predicted "No Default". These are safe loans the system approved accurately.</div>
                </div>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="font-semibold text-emerald-400 mb-1">✅ True Positive (TP)</div>
                  <div className="text-slate-400">Model correctly predicted "Default". Successfully caught risky borrowers early.</div>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="font-semibold text-red-400 mb-1">❌ False Positive (FP)</div>
                  <div className="text-slate-400">Model flagged a loan as default, but it was actually safe. Could lead to unnecessary rejections.</div>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="font-semibold text-red-400 mb-1">❌ False Negative (FN)</div>
                  <div className="text-slate-400">Model missed a real default. The most costly error — overlooked bad loans.</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Evaluation Source note ── */}
          <div className="bg-[#1e293b] rounded-2xl p-5 border border-white/5 flex items-start gap-4 shadow-xl">
            <div className="text-2xl flex-shrink-0">📋</div>
            <div>
              <div className="text-sm font-semibold text-white mb-1">Evaluation Pipeline</div>
              <div className="text-xs text-slate-400 leading-relaxed">
                All metrics were computed by{" "}
                <code className="text-blue-400 bg-white/5 px-1.5 py-0.5 rounded">evaluate_model.py</code>{" "}
                using scikit-learn on the full dataset. The pipeline loads the trained{" "}
                <code className="text-blue-400 bg-white/5 px-1.5 py-0.5 rounded">completeXgboost.pkl</code>{" "}
                artifact, applies the custom threshold, and computes accuracy, precision, recall, F1, ROC-AUC, and the confusion matrix.
                Results are persisted to{" "}
                <code className="text-blue-400 bg-white/5 px-1.5 py-0.5 rounded">metrics.json</code>{" "}
                and served via the <code className="text-blue-400 bg-white/5 px-1.5 py-0.5 rounded">/model-metrics</code> API endpoint.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}