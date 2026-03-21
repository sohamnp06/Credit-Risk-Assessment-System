import { useEffect, useState } from "react";
import { getDashboardData, getApprovalTrend } from "../services/api";
import KPICards from "../components/KPICards";
import RiskDistributionChart from "../components/RiskDistributionChart";
import ApprovalTrendChart from "../components/ApprovalTrendChart";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getDashboardData();
      setData(res);

      const trendRes = await getApprovalTrend();
      setTrend(trendRes);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-10 font-sans min-h-screen bg-[#0f172a]">
      
      {/* ── Header ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          </div>
          <p className="text-slate-400 text-sm ml-5">
            Real-time analytics &amp; credit risk assessment performance overview.
          </p>
        </div>

        <button 
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-all text-sm font-medium"
        >
          <span className={`${loading ? 'animate-spin' : ''}`}>🔄</span>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* ── Dashboard Content ── */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
        
        {/* KPI Cards */}
        <KPICards data={data} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          {/* Distribution Chart */}
          <RiskDistributionChart data={data?.risk_distribution} />

          {/* Trend Chart */}
          <ApprovalTrendChart data={trend} />
        </div>
        
        {/* Quick Insights Placeholder */}
        <div className="bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/10 p-6 rounded-2xl flex items-center gap-4">
          <div className="text-2xl">💡</div>
          <div>
            <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Quick Insight</div>
            <div className="text-slate-400 text-sm leading-relaxed">
              Based on the latest data, the <span className="text-emerald-400 font-semibold">Approval Rate</span> is currently stable at {data?.approval_rate.toFixed(1)}%. Maintain an eye on the High-Risk distribution for volatility indicators.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}