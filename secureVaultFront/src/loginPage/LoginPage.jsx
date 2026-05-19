import { useEffect, useState } from "react";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import { generatePasswordVerifier } from "../crypto/AuthService";

export default function AuthPage() {
  const [isLogin] = useState(true);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [lockUntil, setLockUntil] = useState(() => {
    const savedLock = localStorage.getItem("login_lock_until");

    if (!savedLock) return null;

    const time = parseInt(savedLock, 10);

    if (time > Date.now()) {
      return time;
    } else {
      localStorage.removeItem("login_lock_until");
      return null;
    }
  });
  
  const [remaining, setRemaining] = useState(0);

  const isLocked = Boolean(lockUntil && remaining > 0);

  useEffect(() => {
    if (!lockUntil) return;

    const interval = setInterval(() => {
      const diff = lockUntil - Date.now();

      if (diff <= 0) {
        setLockUntil(null);
        setRemaining(0);
        localStorage.removeItem("login_lock_until");
        clearInterval(interval);
      } else {
        setRemaining(Math.ceil(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);


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

      const saltRes = await fetch("http://localhost:8080/auth/salt", {
        method: "POST",
        headers: { "Content-Type" : "application/json"},
        body: JSON.stringify({
            username: form.username,
        }),
      });

      const saltData = await saltRes.json();

      const salt = Uint8Array.from(atob(saltData.salt), 
          (c) => c.charCodeAt(0)
        );

      const passwordVerifier = await generatePasswordVerifier(form.password, salt);


      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: form.username,
          password: passwordVerifier,
        }),
      });

      if(res.status === 429) {
        const lockTime = Date.now() + 5 * 60 * 1000;

        setLockUntil(lockTime);
        localStorage.setItem("login_lock_until", lockTime.toString());

        setMessage("Too many attempts. Try again in 5 minutes.");
        setLoading(false);
        return;
      }

      if(!res.ok) {
        const err = await res.json();
        setMessage(err.message || "Login Failed");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.tempToken) {
        localStorage.setItem("tempToken", data.tempToken);
        localStorage.setItem("username", form.username);

        navigate("/2fa");
        return;
      }

      
    } catch (err) {
      setMessage("Login failed", err);
    }

    setLoading(false);
  };

  const handleSubmit = () => {
    if(loading || isLocked) return;
    
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
          disabled={loading || isLocked}
          className="auth-button"
        >
          {loading
            ? "Please wait..."
            : isLocked
            ? `Try again in ${Math.floor(remaining / 60)}:${(remaining % 60)
                .toString()
                .padStart(2, "0")}`
            : isLogin
            ? "Login"
            : "Register"}
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