import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Portal        from "./pages/Portal";
import UserLogin     from "./pages/UserLogin";
import UserRegister  from "./pages/UserRegister";
import UserStatus    from "./pages/UserStatus";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard   from "./pages/EmployeeDashboard";
import ApplicationReview   from "./pages/ApplicationReview";

const isAuth   = (role) => localStorage.getItem("role") === role && !!localStorage.getItem("token");

const UserRoute     = ({ children }) => isAuth("user")     ? children : <Navigate to="/user/login" />;
const EmployeeRoute = ({ children }) => isAuth("employee") ? children : <Navigate to="/employee/login" />;

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/"                  element={<Portal />} />

        {/* User Portal */}
        <Route path="/user/login"        element={<UserLogin />} />
        <Route path="/user/register"     element={<UserRegister />} />
        <Route path="/user/status"       element={<UserRoute><UserStatus /></UserRoute>} />

        {/* Employee Portal */}
        <Route path="/employee/login"    element={<EmployeeLogin />} />
        <Route path="/employee/dashboard" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />
        <Route path="/employee/review/:id" element={<EmployeeRoute><ApplicationReview /></EmployeeRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}