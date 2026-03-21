const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

// Prediction API
export const predictRisk = async (data) => {
  const response = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

// Dashboard API
export const getDashboardData = async () => {
  const response = await fetch(`${BASE_URL}/dashboard`);
  return response.json();
};

export const getApprovalTrend = async () => {
  const response = await fetch(`${BASE_URL}/approval-trend`);
  return response.json();
};

export const getModelMetrics = async () => {
  const response = await fetch(`${BASE_URL}/model-metrics`);
  return response.json();
};