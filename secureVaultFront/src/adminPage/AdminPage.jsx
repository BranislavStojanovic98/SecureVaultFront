import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../crypto/AuthFetch";
import "./AdminPage.css"

export default function AdminPage() {
  const [adminName, setAdminName] = useState("");
  const [adminId, setAdminId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    authFetch("http://localhost:8080/auth/me")
      .then((res) => {
        if(!res) return;
        if (!res.ok) {
          navigate("/");
          return;
        }
        return res.json();
      })
      .then((data) => {
        // Optional role check
        if (data.role !== "ADMIN") {
          navigate("/home");
          return;
        }

        setAdminId(data.userId);
        setAdminName(data.username);
      })
      .catch(() => navigate("/"));
  }, [navigate]);

  const handleLogout = async () => {
    await fetch("http://localhost:8080/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    navigate("/");
  };

  const goToUserControl = () => {
    navigate("/admin/users");
  };

  const goToSafetyPolicy = () => {
    navigate("/admin/safety-policy");
  };

  const goToTeams = () => {
    navigate("/admin/teams")
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1>Admin Dashboard 👑</h1>

        <p className="welcome-text">
          Welcome back, <strong>{adminName}</strong>
        </p>

        <p>Admin ID: {adminId}</p>

        <div className="admin-status">
          🛡️ Administrative privileges active
        </div>

        <div className="admin-actions">
          <button className="admin-btn users-btn" onClick={goToUserControl}>
            👥 User Control
          </button>

          <button
            className="admin-btn policy-btn"
            onClick={goToSafetyPolicy}
          >
            🔒 Safety Policy
          </button>

          <button className="admin-btn teams-btn" onClick={goToTeams}>
            🧩 Teams Overview
          </button>

          <button className="admin-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}