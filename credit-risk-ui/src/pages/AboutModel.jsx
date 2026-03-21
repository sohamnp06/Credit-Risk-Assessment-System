import { useEffect, useState } from "react";
import { getModelMetrics } from "../services/api";

// Fallback data structure in case metrics.json is missing or backend is unreachable
const DEFAULT_METRICS = {
  accuracy: 0.6393,
  precision: 0.2095,
  recall: 0.7597,
  f1_score: 0.3285,
  roc_auc: 0.7649,
  confusion_matrix: [[140709, 84985], [7127, 22526]]
};

// ─── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({ label, value, percentage, icon, color, description }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div className="relative bg-[#1e293b] rounded-2xl p-5 border border-white/5 overflow-hidden group hover:border-white/10 transition-all hover:-translate-y-0.5 shadow-lg">
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
      <div className="flex items-center mb-3">
        <div className="w-1/2 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Predicted: No Default</div>
        <div className="w-1/2 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Predicted: Default</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cells.map((c) => (
          <div key={c.label} className={`rounded-xl p-5 border transition-all hover:scale-[1.02] ${c.type === "good" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
            <div className={`text-3xl font-bold mb-2 ${c.type === "good" ? "text-emerald-400" : "text-red-400"}`}>{c.value.toLocaleString()}</div>
            <div className="text-sm font-semibold text-white">{c.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{c.sublabel}</div>
            <div className={`text-xs mt-2 font-mono ${c.type === "good" ? "text-emerald-500" : "text-red-500"}`}>{((c.value / total) * 100).toFixed(1)}% of total</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-slate-500 text-center">Total samples: <span className="text-slate-300 font-mono font-semibold">{total.toLocaleString()}</span></div>
    </div>
  );
}

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

export default function AboutModel() {
  const [data, setData] = useState(DEFAULT_METRICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("default");

  useEffect(() => {
    const loadData = async () => {
      fetchMetrics();
    };
    loadData();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await getModelMetrics();
      if (!res || res.error) throw new Error(res?.error || "API Error");
      setData(res);
      setSource("api");
    } catch (err) {
      console.warn("Using default evaluation metrics:", err.message);
      try {
          const directRes = await fetch("/metrics.json");
          const directData = await directRes.json();
          setData(directData);
          setSource("local");
      } catch (e) {
          setData(DEFAULT_METRICS);
          setSource("static");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-10 font-sans min-h-screen bg-[#0f172a]">
      {/* ── Header ── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
          <h1 className="text-3xl font-bold text-white tracking-tight">About The Model</h1>
        </div>
        <p className="text-slate-400 text-sm ml-5">Evaluation metrics &amp; performance details for the deployed credit risk engine.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* ... rest of the component (cards, info, etc.) ... */}
          {/* (Note: I'll keep the rest as it was but ensure it uses the 'data' state) */}
          <div className="bg-[#1e293b] rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl shadow-inner">🤖</div>
                <div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">Active Model</div>
                  <div className="text-2xl font-bold text-white tracking-tight">XGBoost Classifier</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-2xl">
                XGBoost (Extreme Gradient Boosting) is an ensemble machine learning algorithm that builds an additive model using decision trees in a sequential fashion. Each tree corrects the errors of its predecessor, making the model exceptionally powerful for structured/tabular data like credit risk prediction. A custom probability threshold is used to optimize recall for catching defaulters.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FeatureCard icon="🌲" title="Tree-based Ensemble" desc="Combines many weak decision trees into a strong predictor." />
                <FeatureCard icon="⚡" title="Gradient Boosting" desc="Iteratively reduces prediction error with each new tree." />
                <FeatureCard icon="🎛️" title="Custom Threshold" desc="Tuned cutoff probability to balance precision vs. recall." />
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col gap-4">
          <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Quick Stats</div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
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
                  ) : source === "local" ? (
                    <span className="text-amber-400">🟡 Local metrics.json</span>
                  ) : (
                    <span className="text-slate-500">⚪ Static Built-in Data</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {!loading && (
        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Accuracy" value={data.accuracy} icon="🎯" color="#3b82f6" description="The overall correctness of the model across all predictions." />
            <MetricCard label="Precision" value={data.precision} icon="🛡️" color="#f59e0b" description="The ability of the model not to label a safe user as a defaulter." />
            <MetricCard label="Recall" value={data.recall} icon="🔍" color="#10b981" description="The ability of the model to find all the actual defaulters." />
            <MetricCard label="F1 Score" value={data.f1_score} icon="⚖️" color="#8b5cf6" description="The harmonic mean of precision and recall scores." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#1e293b] rounded-2xl p-8 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-2 mb-6 uppercase tracking-widest text-xs font-bold text-slate-500">
                <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                Confusion Matrix
              </div>
              <ConfusionMatrix data={data.confusion_matrix} />
            </div>
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/5 shadow-2xl flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-4">How To Read This</h3>
              <p className="text-slate-400 text-sm leading-relaxed space-y-4">
                The matrix shows how many users were correctly classified.
                <br /><br />
                <span className="text-emerald-400 font-bold">Good quadrants</span> (True Negative/Positive) represent correct model decisions.
                <br /><br />
                <span className="text-red-400 font-bold">Bad quadrants</span> represent errors. <span className="underline">False Positives</span> deny loans to safe users, while <span className="underline">False Negatives</span> approve loans to high-risk users. Our model is optimized to minimize False Negatives to protect capital.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}