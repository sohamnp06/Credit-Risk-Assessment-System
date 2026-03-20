export default function KPICards({ data }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500">Total Applications</p>
        <h2 className="text-2xl font-bold">
          {data?.total || 0}
        </h2>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500">Approval Rate</p>
        <h2 className="text-2xl font-bold text-green-600">
          {data?.approval_rate || 0}%
        </h2>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500">Default Rate</p>
        <h2 className="text-2xl font-bold text-red-600">
          {data?.default_rate || 0}%
        </h2>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500">Avg Risk Score</p>
        <h2 className="text-2xl font-bold text-yellow-500">
          {data?.avg_risk || 0}
        </h2>
      </div>

    </div>
  );
}