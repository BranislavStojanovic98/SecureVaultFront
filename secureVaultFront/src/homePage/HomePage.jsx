import "./HomePage.css";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const username = localStorage.getItem("username") || "User";

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("salt");
    window.location.href = "/";
  };

  const goToCreateSecret = () => {
    navigate("/create-secret");
  };

   const goToSecrets = () => {
    window.location.href = "/my-secrets";
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Welcome 👋</h1>

        <p className="subtitle">
          Logged in as <span>{username}</span>
        </p>

        <div className="status">
          🔐 Secure session active
        </div>

        <button className="create-btn" onClick={goToCreateSecret}>
          ➕ Create Secret
        </button>

        <button
            onClick={goToSecrets}
            style={{
              padding: "10px 16px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: "#4a90e2",
              color: "white"
            }}
          >
            My Secrets
          </button>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}