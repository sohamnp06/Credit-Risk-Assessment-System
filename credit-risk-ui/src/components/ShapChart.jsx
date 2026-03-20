import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function ShapChart({ shapData }) {

  const data = Object.entries(shapData).map(([feature, value]) => {
    let numericValue = 0;

    if (value.includes("High")) numericValue = 0.8;
    else if (value.includes("Medium")) numericValue = 0.4;
    else numericValue = 0.2;

    if (value.includes("↓")) numericValue *= -1;

    return {
      feature,
      value: numericValue
    };
  });

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="feature" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value">
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.value > 0 ? "#ef4444" : "#22c55e"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}