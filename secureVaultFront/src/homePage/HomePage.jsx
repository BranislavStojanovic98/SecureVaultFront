import "./HomePage.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../crypto/AuthFetch";

export default function HomePage() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    authFetch("http://localhost:8080/auth/me")
      .then(res => {
        if(!res) return;
        if (!res.ok) {
          navigate("/");
          return;
        }
        return res.json();
      })
      .then(data => {
        setUserId(data.userId);
        localStorage.setItem("userId", data.userId);
        setUsername(data.username);
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