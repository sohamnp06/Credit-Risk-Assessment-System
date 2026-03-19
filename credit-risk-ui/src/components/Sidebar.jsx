import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div style={{ width: "200px", background: "#111", color: "white", padding: "20px" }}>
      <h2>Credit Risk</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li><Link to="/" style={{ color: "white" }}>Dashboard</Link></li>
        <li><Link to="/new" style={{ color: "white" }}>New Assessment</Link></li>
      </ul>
    </div>
  );
}