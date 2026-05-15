import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../crypto/axios";
import "./AdminPage.css"

export default function AdminPage() {
  const [adminName, setAdminName] = useState("");
  const [adminId, setAdminId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me")
      .then(res => {
        const data = res.data;

        if (data.role !== "ADMIN") {
          navigate("/home");
          return;
        }

        setAdminId(data.userId);
        setAdminName(data.username);
      })
      .catch(() => {
        localStorage.clear();
        navigate("/");
      });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      navigate("/");
    } catch (err) {
      console.log(err);
    } finally {
    localStorage.clear();
    navigate("/");
  }
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