import "./HomePage.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../crypto/axios";

export default function HomePage() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me")
      .then(res => {
        localStorage.setItem("userId", res.data.userId);
        setUserId(res.data.userId);
        setUsername(res.data.username);
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

  const goToCreateSecret = () => {
    navigate("/create-secret");
  };

  const goToSecrets = () => {
    navigate("/my-secrets");
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Welcome {username}👋</h1>
        <p>Your user ID is: {userId}</p>

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