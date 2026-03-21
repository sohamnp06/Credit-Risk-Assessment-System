import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from "recharts";

export default function ApprovalTrendChart({ data }) {

  if (!data) return (
    <div className="bg-[#1e293b] p-6 rounded-2xl animate-pulse h-80 border border-white/5 mt-8"></div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl">
          <p className="text-slate-400 text-xs font-bold tracking-wider mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-400 text-sm font-semibold">Approved: {payload[0].value}</p>
            <p className="text-rose-400 text-sm font-semibold">Defaulted: {payload[1].value}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl transition-all hover:border-white/10 group mt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1.5 h-4 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
        <h3 className="font-bold text-white tracking-tight">Approval Trend</h3>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDefaulted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 500, color: '#94a3b8' }} 
            />
            <Area 
              type="monotone" 
              dataKey="approved" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorApproved)" 
            />
            <Area 
              type="monotone" 
              dataKey="defaulted" 
              stroke="#ef4444" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorDefaulted)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}