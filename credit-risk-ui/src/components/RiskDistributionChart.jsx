import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function RiskDistributionChart({ data }) {

  if (!data) return (
    <div className="bg-[#1e293b] p-6 rounded-2xl animate-pulse h-80 border border-white/5"></div>
  );

  const colors = {
    Low: "#10b981",    // emerald-500
    Medium: "#f59e0b", // amber-500
    High: "#ef4444"    // red-500
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">{label} Risk</p>
          <p className="text-white text-lg font-bold">Applications: <span className="text-blue-400 ml-1">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl transition-all hover:border-white/10 group">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1.5 h-4 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
        <h3 className="font-bold text-white tracking-tight">Risk Distribution</h3>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="risk" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }} />
            <Bar 
              dataKey="count" 
              radius={[6, 6, 0, 0]} 
              barSize={40}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[entry.risk] || "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}