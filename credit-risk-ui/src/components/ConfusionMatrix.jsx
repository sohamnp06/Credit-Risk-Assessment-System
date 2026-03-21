export default function ConfusionMatrix({ data }) {
  if (!data) return null;

  const [[tn, fp], [fn, tp]] = data;

  const maxValue = Math.max(tn, fp, fn, tp);

  const getColor = (value, type) => {
    const intensity = value / maxValue;

    if (type === "good") {
      return `rgba(34,197,94, ${0.3 + intensity})`; // green
    } else {
      return `rgba(239,68,68, ${0.3 + intensity})`; // red
    }
  };

  return (
    <div>
      <h2 className="font-bold text-lg mb-4 text-center">
        Confusion Matrix
      </h2>

      <div className="grid grid-cols-2 gap-3">

        {/* TN */}
        <div
          className="p-6 rounded-xl text-center shadow"
          style={{ backgroundColor: getColor(tn, "good") }}
        >
          <p className="text-sm text-gray-700">True Negative</p>
          <p className="text-2xl font-bold">{tn}</p>
        </div>

        {/* FP */}
        <div
          className="p-6 rounded-xl text-center shadow"
          style={{ backgroundColor: getColor(fp, "bad") }}
        >
          <p className="text-sm text-gray-700">False Positive</p>
          <p className="text-2xl font-bold">{fp}</p>
        </div>

        {/* FN */}
        <div
          className="p-6 rounded-xl text-center shadow"
          style={{ backgroundColor: getColor(fn, "bad") }}
        >
          <p className="text-sm text-gray-700">False Negative</p>
          <p className="text-2xl font-bold">{fn}</p>
        </div>

        {/* TP */}
        <div
          className="p-6 rounded-xl text-center shadow"
          style={{ backgroundColor: getColor(tp, "good") }}
        >
          <p className="text-sm text-gray-700">True Positive</p>
          <p className="text-2xl font-bold">{tp}</p>
        </div>

      </div>

      {/* Axis Labels */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        <p>Rows: Actual (0 = Non-default, 1 = Default)</p>
        <p>Columns: Predicted (0 = Non-default, 1 = Default)</p>
      </div>
    </div>
  );
}