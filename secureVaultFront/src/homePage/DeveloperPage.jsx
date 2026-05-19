import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../crypto/axios";
import "./DeveloperPage.css"

export default function DeveloperPage() {
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

  const goToSecrets = () => {
    navigate("/shared-secrets");
  };

  return (
    <div className="developer-container">
      <div className="developer-card">
        <h1>Welcome Developer {user?.username} 👨‍💻</h1>

        <p>Your developer ID is: {user?.userId}</p>

        <p className="subtitle">
          Developer workspace active
        </p>

        <div className="status">
          ⚙️ Development environment connected
        </div>

        <button
          onClick={goToSecrets}
          className="developer-btn"
        >
          📂 My Secrets
        </button>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}