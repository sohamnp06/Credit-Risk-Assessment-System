import { Link, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col justify-between">
      
      <div>
        <h2 className="text-2xl font-bold mb-6">Credit Risk</h2>

        <ul className="space-y-4">

          <li>
            <Link to="/" className="hover:text-blue-400">
              Dashboard
            </Link>
          </li>

          <li>
            <Link to="/new" className="hover:text-blue-400">
              New Assessment
            </Link>
          </li>

          <li>
            <Link to="/model" className="hover:text-blue-400">
              About Model
            </Link>
          </li>

          <li>
            <Link to="/history" className="hover:text-blue-400">
              History
            </Link>
          </li>

        </ul>
      </div>

      {/* ✅ LOGOUT BUTTON */}
      <div>
        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-red-500 hover:bg-red-600 p-2 rounded"
        >
          Logout
        </button>
      </div>

    </div>
  );
}