import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../crypto/axios";
import "./AdminPage.css"

export default function AdminPage() {
  const [adminName, setAdminName] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [checkingAudit, setCheckingAudit] = useState(false);

  const navigate = useNavigate();

  const checkAuditIntegrity = async () => {
    try {
      setCheckingAudit(true);

      const res = await api.get("/audit/verify");


      if (res.data === false) {
        alert("WARNING: Audit log tampering detected!");
      } else {
        alert("Audit logs are clean.");
      }

    } catch (err) {
      console.error(err);
      alert("Failed to verify audit logs.");
    } finally {
      setCheckingAudit(false);
    }
  };

  useEffect(() => {
    api.get("/auth/me")
      .then(async res => {
        const data = res.data;

        if (data.role !== "ADMIN") {
          navigate("/home");
          return;
        }

        setAdminId(data.userId);
        setAdminName(data.username);

        try {
          const auditRes = await api.get("/audit/verify");

          if (auditRes.data === false) {
            alert("WARNING: Audit log tampering detected!");
          }

        } catch (err) {
          console.log("Audit check failed", err);
      }

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

  const goToAuditLogs = () => {
  navigate("/admin/audit-logs");
};

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
          <button
            className="admin-btn audit-btn"
            onClick={checkAuditIntegrity}
            disabled={checkingAudit}
          >
            🧾 Verify Audit Integrity
          </button>
          <button
            className="admin-btn logs-btn"
            onClick={goToAuditLogs}
          >
            📜 View Audit Logs
          </button>

          <button className="admin-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}