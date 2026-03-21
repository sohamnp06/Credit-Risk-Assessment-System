import { useEffect, useState } from "react";

export default function History() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [searchId, setSearchId] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchId, filterType, data]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:5000/prediction-history");
      const json = await res.json();
      setData(json);
      setFilteredData(json);
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilters = () => {
    let temp = [...data];

    // 🔍 Search by ID
    if (searchId) {
      temp = temp.filter((row) =>
        row.id.toString().includes(searchId)
      );
    }

    // 🎯 Filter by prediction
    if (filterType !== "all") {
      temp = temp.filter((row) =>
        filterType === "default"
          ? row.prediction === 1
          : row.prediction === 0
      );
    }

    setFilteredData(temp);
  };

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">Prediction History</h1>

      {/* 🔥 FILTER SECTION */}
      <div className="flex gap-4 mb-6">

        {/* Search */}
        <input
          type="text"
          placeholder="Search by ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="border p-2 rounded w-40"
        />

        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All</option>
          <option value="default">Default</option>
          <option value="safe">Safe</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">

        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Prediction</th>
              <th className="p-3">Probability</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.id}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded ${
                      row.prediction === 1
                        ? "bg-red-200 text-red-800"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    {row.prediction === 1 ? "Default" : "Safe"}
                  </span>
                </td>

                <td className="p-3">
                  {(row.probability * 100).toFixed(2)}%
                </td>

                <td className="p-3">
                  {new Date(row.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short"
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
}