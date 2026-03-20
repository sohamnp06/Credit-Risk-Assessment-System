const BASE_URL = "http://127.0.0.1:5000";

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

export const getDashboardData = async () => {
  const response = await fetch(`${BASE_URL}/dashboard`);
  return response.json();
};