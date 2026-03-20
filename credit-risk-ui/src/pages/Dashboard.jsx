export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-gray-500">Total Applications</h2>
          <p className="text-2xl font-bold">120</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-gray-500">Approval Rate</h2>
          <p className="text-2xl font-bold">72%</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-gray-500">Default Risk</h2>
          <p className="text-2xl font-bold text-red-500">28%</p>
        </div>

      </div>
    </div>
  );
}