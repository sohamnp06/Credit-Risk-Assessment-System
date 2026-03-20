import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function RiskDistributionChart({ data }) {

  return (
    <div className="bg-white p-4 rounded-xl shadow w-full">
      <h3 className="font-bold mb-3">Risk Distribution</h3>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data || []}>
            <XAxis dataKey="risk" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}