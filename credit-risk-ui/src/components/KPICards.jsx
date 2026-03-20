export default function KPICards() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500">Total Applications</p>
        <h2 className="text-2xl font-bold">120</h2>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500">Approval Rate</p>
        <h2 className="text-2xl font-bold text-green-600">72%</h2>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500">Default Rate</p>
        <h2 className="text-2xl font-bold text-red-600">28%</h2>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500">Avg Risk Score</p>
        <h2 className="text-2xl font-bold text-yellow-500">0.45</h2>
      </div>

    </div>
  );
}