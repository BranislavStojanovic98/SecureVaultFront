import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TwoFactorPage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleVerify = async () => {
    const tempToken = localStorage.getItem("tempToken");

    try {
      const res = await fetch("http://localhost:8080/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tempToken,
          code,
        }),
      });

      const token = localStorage.getItem("tempToken");
      const payload = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payload));
      const role = decodedPayload.role;
      if (res.ok) {
        if(role === "ADMIN") {
          localStorage.removeItem("tempToken");
          navigate("/adminhome");
        } else if(role === "DEVELOPER") {
          localStorage.removeItem("tempToken");
          navigate("/developerhome");
        } else {
          localStorage.removeItem("tempToken");
          navigate("/home");
        }
        
      } else {
        setMessage("Invalid code");
      }
    } catch (err) {
      setMessage("Verification failed", err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>2FA Verification</h2>

        <input
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="auth-input"
        />

        <button onClick={handleVerify} className="auth-button">
          Verify
        </button>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  );
}