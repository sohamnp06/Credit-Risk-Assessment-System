import { useEffect, useState } from "react";
import { getDashboardData, getApprovalTrend } from "../services/api";
import KPICards from "../components/KPICards";
import RiskDistributionChart from "../components/RiskDistributionChart";
import ApprovalTrendChart from "../components/ApprovalTrendChart";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboardData();
      setData(res);

      const trendRes = await getApprovalTrend();
      setTrend(trendRes);

    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* KPI */}
      <KPICards data={data} />

      {/* Distribution */}
      <RiskDistributionChart data={data?.risk_distribution} />

      {/* Trend */}
      <ApprovalTrendChart data={trend} />

    </div>
  );
}