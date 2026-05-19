import "./HomePage.css";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../crypto/axios";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const goToCreateSecret = () => {
    navigate("/create-secret");
  };

  const goToSecrets = () => {
    navigate("/my-secrets");
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Welcome {user?.username}👋</h1>
        <p>Your user ID is: {user?.userId}</p>

        <p className="subtitle">
          Logged in securely
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