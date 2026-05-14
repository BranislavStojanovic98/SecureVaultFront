import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../crypto/AuthFetch";
import "./DeveloperPage.css"

export default function DeveloperPage() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    authFetch("http://localhost:8080/auth/me")
      .then((res) => {
        if(res) return;
        if (!res.ok) {
          navigate("/");
          return;
        }

        return res.json();
      })
      .then((data) => {
        setUserId(data.userId);
        setUsername(data.username);

        localStorage.setItem("userId", data.userId);

        // Optional role protection
        if (data.role !== "DEVELOPER") {
          navigate("/home");
        }
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

  const goToSecrets = () => {
    navigate("/my-secrets");
  };

  return (
    <div className="developer-container">
      <div className="developer-card">
        <h1>Welcome Developer {username} 👨‍💻</h1>

        <p>Your developer ID is: {userId}</p>

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