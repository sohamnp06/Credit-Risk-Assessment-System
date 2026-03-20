import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function ApprovalTrendChart() {

  const data = [
    { month: "Jan", rate: 60 },
    { month: "Feb", rate: 65 },
    { month: "Mar", rate: 70 },
    { month: "Apr", rate: 75 },
    { month: "May", rate: 72 }
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow w-full">
      <h3 className="font-bold mb-3">Approval Rate Trend</h3>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="rate" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}