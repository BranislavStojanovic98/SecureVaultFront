import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    passwordHash: "",
    role: "DEVELOPER",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isBlank = (v) => !v || v.trim() === "";

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");

    if (
        isBlank(form.username) ||
        isBlank(form.email) ||
        isBlank(form.passwordHash) ||
        isBlank(form.role)
    ) {
        setLoading(false);
        setMessage("All fields are required");
        return;
    }

    if (!form.email.includes("@")) {
        setLoading(false);
        setMessage("Invalid email format");
        return;
    }

    try {
      const res = await fetch("http://localhost:8080/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          passwordHash: form.passwordHash,
          role: form.role,
          active: true,
          frozen: false,
        }),
      });

      const data = await res.json();

      if (data.totpQrCode) {
        localStorage.setItem("qrCode", data.totpQrCode);
        localStorage.setItem("username", data.username);

        navigate("/setup-2fa");
        return;
      }

      setMessage(data.message || "Registered successfully");

    } catch (err) {
      setMessage("Registration failed", err);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>

        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="auth-input"
          required
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="auth-input"
          required
        />

        <input
          name="passwordHash"
          type="password"
          placeholder="Password"
          value={form.passwordHash}
          onChange={handleChange}
          className="auth-input"
          required
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="auth-input"
        >
          <option value="ADMIN">ADMIN</option>
          <option value="TEAM_LEAD">TEAM_LEAD</option>
          <option value="DEVELOPER">DEVELOPER</option>
        </select>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="auth-button"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-toggle">
          Already have an account?{" "}
          <span onClick={() => navigate("/")}>Login</span>
        </p>
      </div>
    </div>
  );
}