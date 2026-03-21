import { useEffect, useState } from "react";
import { getModelMetrics } from "../services/api";
import ConfusionMatrix from "../components/ConfusionMatrix";

export default function AboutModel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await getModelMetrics();
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load model metrics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">

      {/* TITLE */}
      <h1 className="text-3xl font-bold mb-6">About The Model</h1>

      {/* MODEL INFO */}
      <div className="bg-white p-5 rounded-xl shadow mb-6">
        <h2 className="text-xl font-bold mb-2">Model Used</h2>
        <p className="mb-2"><strong>XGBoost Classifier</strong></p>

        <p className="text-gray-600">
          XGBoost is a gradient boosting algorithm that builds decision trees
          sequentially. Each new tree learns from the errors of previous trees,
          making it highly effective for structured data problems like credit
          risk prediction.
        </p>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="text-gray-600">Loading model metrics...</div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="text-red-500 font-semibold">{error}</div>
      )}

      {/* METRICS */}
      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* METRIC CARD */}
          <div className="bg-white p-5 rounded-xl shadow">
            <h2 className="font-bold text-lg mb-4">Model Performance</h2>

            <div className="space-y-2">
              <p>Accuracy: <strong>{data.accuracy?.toFixed(3)}</strong></p>
              <p>Precision: <strong>{data.precision?.toFixed(3)}</strong></p>
              <p>Recall: <strong>{data.recall?.toFixed(3)}</strong></p>
              <p>F1 Score: <strong>{data.f1_score?.toFixed(3)}</strong></p>
              <p>ROC-AUC: <strong>{data.roc_auc?.toFixed(3)}</strong></p>
            </div>
          </div>

          {/* CONFUSION MATRIX */}
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="font-bold text-lg mb-4">
              Visual representation of model predictions vs actual outcomes
            </p>
            <h2 className="font-bold text-lg mb-4">Confusion Matrix</h2>

            {data.confusion_matrix ? (
              <ConfusionMatrix data={data.confusion_matrix} />
            ) : (
              <p className="text-gray-500">No confusion matrix available</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}