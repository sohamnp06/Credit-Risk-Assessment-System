import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import NewAssessment from "./pages/NewAssessment";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<NewAssessment />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;