import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../crypto/axios";
import "./DeveloperPage.css"

export default function DeveloperPage() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me")
      .then(res => {
        const data = res.data;

        localStorage.setItem("userId", data.userId);
        setUserId(data.userId);
        setUsername(data.username);

        if (data.role !== "DEVELOPER") {
          navigate("/home");
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