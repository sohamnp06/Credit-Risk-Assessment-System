import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function ApprovalTrendChart({ data }) {

  if (!data) return <p>Loading trend...</p>;

  return (
    <div className="bg-white p-4 rounded-xl shadow w-full mt-6">
      <h3 className="font-bold mb-3">Approval Trend</h3>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Line type="monotone" dataKey="approved" />
            <Line type="monotone" dataKey="defaulted" />

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}