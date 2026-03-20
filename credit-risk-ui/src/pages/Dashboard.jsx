import KPICards from "../components/KPICards";
import RiskDistributionChart from "../components/RiskDistributionChart";
import ApprovalTrendChart from "../components/ApprovalTrendChart";

export default function Dashboard() {
  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* KPI */}
      <KPICards />

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">

        <RiskDistributionChart />
        <ApprovalTrendChart />

      </div>

    </div>
  );
}