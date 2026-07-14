// All requests go through the Vite dev proxy → Flask backend at 127.0.0.1:5000
const BASE = "";

// ─── Auth Header ──────────────────────────────────────────────────────────────
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const json = { "Content-Type": "application/json" };

// ─── User Portal API ──────────────────────────────────────────────────────────

export const userRegister = async (payload) => {
  const res = await fetch(`${BASE}/user/register`, {
    method: "POST",
    headers: json,
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const userLogin = async (payload) => {
  const res = await fetch(`${BASE}/user/login`, {
    method: "POST",
    headers: json,
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const getUserStatus = async () => {
  const res = await fetch(`${BASE}/user/status`, {
    headers: { ...authHeader() },
  });
  return res.json();
};

// ─── Employee Portal API ──────────────────────────────────────────────────────

export const employeeLogin = async (payload) => {
  const res = await fetch(`${BASE}/employee/login`, {
    method: "POST",
    headers: json,
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const getEmployeeDashboard = async () => {
  const res = await fetch(`${BASE}/employee/dashboard`, {
    headers: { ...authHeader() },
  });
  return res.json();
};

export const getApplications = async (decision = null) => {
  const url = decision
    ? `${BASE}/employee/applications?decision=${decision}`
    : `${BASE}/employee/applications`;
  const res = await fetch(url, { headers: { ...authHeader() } });
  return res.json();
};

export const getApplicationDetail = async (id) => {
  const res = await fetch(`${BASE}/employee/application/${id}`, {
    headers: { ...authHeader() },
  });
  return res.json();
};

export const submitDecision = async (id, decision, note = "") => {
  const res = await fetch(`${BASE}/employee/decide/${id}`, {
    method: "POST",
    headers: { ...json, ...authHeader() },
    body: JSON.stringify({ decision, note }),
  });
  return res.json();
};

export const downloadReport = async (payload) => {
  const res = await fetch(`${BASE}/download-report`, {
    method: "POST",
    headers: json,
    body: JSON.stringify(payload),
  });
  return res;
};