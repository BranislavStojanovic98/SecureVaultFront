import "./HomePage.css";

export default function HomePage() {
  const username = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("salt");
    window.location.href = "/";
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

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}