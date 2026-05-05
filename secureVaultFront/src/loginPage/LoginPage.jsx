import { useState } from "react";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin] = useState(true);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };


  const handleRegister = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const data = await res.json();
      setMessage(data.message || "Registered successfully");
    } catch (err) {
      setMessage("Registration failed", err);
    }

    setLoading(false);
  };


  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (data.tempToken) {
        localStorage.setItem("tempToken", data.tempToken);
        localStorage.setItem("username", form.username);

        navigate("/2fa");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", form.username);
        setMessage("Login successful");
        navigate("/home");
      } else {
        setMessage("Invalid credentials");
      }
    } catch (err) {
      setMessage("Login failed", err);
    }

    setLoading(false);
  };

  const handleSubmit = () => {
    if (isLogin) handleLogin();
    else handleRegister();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? "Login" : "Register"}</h2>

        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="auth-input"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="auth-input"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="auth-button"
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>

        <p className="auth-toggle">
          No Account? 
          <span
            onClick={() => navigate("/register")}
          >
             Register
          </span>
        </p>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  );
};