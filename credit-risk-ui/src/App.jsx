import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NewAssessment from "./pages/NewAssessment";
import AboutModel from "./pages/AboutModel";   // ✅ NEW IMPORT
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <Router>
      <div className="flex">

        <Sidebar />

        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<NewAssessment />} />
            <Route path="/model" element={<AboutModel />} /> {/* ✅ NEW ROUTE */}
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;