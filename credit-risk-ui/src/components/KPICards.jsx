export default function KPICards({ data }) {
  if (!data) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-[#1e293b] rounded-2xl animate-pulse"></div>
      ))}
    </div>
  );

  const kpis = [
    {
      label: "Total Applications",
      value: data.total,
      icon: "📑",
      color: "from-blue-600 to-indigo-600",
      shadow: "shadow-blue-500/10"
    },
    {
      label: "Approval Rate",
      value: `${data.approval_rate.toFixed(1)}%`,
      icon: "✅",
      color: "from-emerald-600 to-teal-600",
      shadow: "shadow-emerald-500/10"
    },
    {
      label: "Default Rate",
      value: `${data.default_rate.toFixed(1)}%`,
      icon: "⚠️",
      color: "from-rose-600 to-red-600",
      shadow: "shadow-rose-500/10"
    },
    {
      label: "Avg Risk Score",
      value: data.avg_risk.toFixed(2),
      icon: "📊",
      color: "from-amber-600 to-orange-600",
      shadow: "shadow-amber-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, idx) => (
        <div 
          key={idx} 
          className={`relative bg-[#1e293b] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group overflow-hidden ${kpi.shadow}`}
        >
          {/* Decorative background circle */}
          <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${kpi.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">{kpi.icon}</span>
            <div className={`w-8 h-1 bg-gradient-to-r ${kpi.color} rounded-full`}></div>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{kpi.label}</h3>
            <p className="text-3xl font-bold text-white tracking-tight">{kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}