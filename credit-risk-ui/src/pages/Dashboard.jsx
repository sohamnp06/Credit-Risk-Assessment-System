import { useEffect, useState } from "react";
import KPICards from "../components/KPICards";
import RiskDistributionChart from "../components/RiskDistributionChart";
import ApprovalTrendChart from "../components/ApprovalTrendChart";
import { getDashboardData } from "../services/api";

export default function Dashboard() {

  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getDashboardData();
      setData(res);
    } catch (err) {
      console.error("Dashboard API error:", err);
    }
  };

  if (!data) {
    return <p className="p-6">Loading dashboard...</p>;
  }

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* KPI */}
      <KPICards data={data} />

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">

        <RiskDistributionChart data={data.risk_distribution} />

        <ApprovalTrendChart />

      </div>

    </div>
  );
}