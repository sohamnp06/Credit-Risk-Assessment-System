import { useEffect, useState } from "react";

export default function History() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      const res = await fetch("http://localhost:5000/prediction-history");
      const json = await res.json();
      setData(json);
      setFilteredData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    <div className="p-8 md:p-10 font-sans min-h-screen bg-[#0f172a]">

      {/* ── Header ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Prediction History</h1>
          </div>
          <p className="text-slate-400 text-sm ml-5">
            Audit log of all processed credit risk assessments and their outcomes.
          </p>
        </div>

        <button 
          onClick={fetchHistory}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-all text-sm font-medium"
        >
          <span className={`${loading ? 'animate-spin' : ''}`}>🔄</span>
          {loading ? 'Refreshing...' : 'Refresh History'}
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Search by ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full bg-[#1e293b] border border-white/10 text-white p-2.5 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#1e293b] border border-white/10 rounded-xl px-3 pr-4">
          <span className="text-slate-500 text-sm font-medium pr-1 border-r border-white/5 mr-1">Status:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-white p-2.5 focus:outline-none cursor-pointer text-sm font-medium"
          >
            <option value="all" className="bg-[#1e293b]">All Prediction Types</option>
            <option value="default" className="bg-[#1e293b]">Risk: Default</option>
            <option value="safe" className="bg-[#1e293b]">Risk: Safe</option>
          </select>
        </div>
      </div>

      {/* ── Results Table ── */}
      <div className="bg-[#1e293b] rounded-2xl border border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 font-semibold uppercase tracking-widest text-xs border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Assessment ID</th>
                <th className="px-6 py-4">Outcome</th>
                <th className="px-6 py-4">Probability Score</th>
                <th className="px-6 py-4">Processed Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan="4" className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded animate-pulse w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-slate-300 font-bold"># {row.id}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                          row.prediction === 1
                            ? "bg-rose-500/10 text-rose-400 ring-rose-500/30"
                            : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${row.prediction === 1 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                        {row.prediction === 1 ? "DEFAULT" : "SAFE"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${row.prediction === 1 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${row.probability * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-300 font-semibold">{(row.probability * 100).toFixed(1)}%</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-400 text-xs">
                        {new Date(row.created_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic">
                    <div className="text-4xl mb-3 opacity-30">📁</div>
                    No records match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}