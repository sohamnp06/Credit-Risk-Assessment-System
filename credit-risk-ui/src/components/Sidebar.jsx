import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/",        label: "Dashboard",       icon: "📊" },
  { to: "/new",     label: "New Assessment",  icon: "🔍" },
  { to: "/model",   label: "About Model",     icon: "🤖" },
  { to: "/history", label: "History",         icon: "🕐" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="w-64 min-h-screen bg-[#0f172a] border-r border-white/5 flex flex-col justify-between sticky top-0 h-screen">

      {/* Logo */}
      <div>
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-lg">CR</div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">Credit Risk</div>
              <div className="text-slate-500 text-xs">Assessment System</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="px-3 pt-4">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-2 mb-3">Navigation</div>
          <ul className="space-y-1">
            {navItems.map(({ to, label, icon }) => {
              const isActive = location.pathname === to;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="text-base">{icon}</span>
                    {label}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-white/5 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition-all"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}