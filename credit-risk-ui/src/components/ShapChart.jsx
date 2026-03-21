import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  ReferenceLine
} from "recharts";

export default function ShapChart({ shapData }) {

  const data = Object.entries(shapData).map(([feature, value]) => {
    let numericValue = 0;

    // Use actual value if it's numeric, or inferred from string
    if (typeof value === "number") {
      numericValue = value;
    } else if (typeof value === "string") {
      if (value.includes("High")) numericValue = 0.8;
      else if (value.includes("Medium")) numericValue = 0.4;
      else numericValue = 0.2;
      if (value.includes("↓")) numericValue *= -1;
    }

    return {
      feature,
      value: numericValue
    };
  }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)); // Sort by impact

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div className="bg-[#1e293b] border border-white/10 p-2.5 rounded-lg shadow-2xl backdrop-blur-xl">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{label}</p>
          <p className={`text-sm font-bold mt-1 ${val > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
             {val > 0 ? 'Decreases Eligibility' : 'Increases Eligibility'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%", height: 300 }} className="p-2">
      <ResponsiveContainer>
        <BarChart 
          data={data} 
          layout="vertical" 
          margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff0a" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="feature" 
            type="category" 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
            axisLine={false}
            tickLine={false}
            width={80}
            interval={0}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 4 }} 
          />
          <ReferenceLine x={0} stroke="#ffffff20" strokeWidth={1} />
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]} 
            barSize={18}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.value > 0 ? "url(#roseGradient)" : "url(#emeraldGradient)"}
              />
            ))}
          </Bar>
          <defs>
            <linearGradient id="roseGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}