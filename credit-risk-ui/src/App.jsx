import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import NewAssessment from "./pages/NewAssessment";
import AboutModel from "./pages/AboutModel";
import History from "./pages/History";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Sidebar from "./components/Sidebar";

// 🔐 Check auth
const isAuthenticated = () => {
  return localStorage.getItem("token") !== null;
};

// 🔐 Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>

      <Routes>

        {/* 🔐 Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 🔐 Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex">
                <Sidebar />

                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/new" element={<NewAssessment />} />
                    <Route path="/model" element={<AboutModel />} />
                    <Route path="/history" element={<History />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

      </Routes>

    </Router>
  );
}

export default App;