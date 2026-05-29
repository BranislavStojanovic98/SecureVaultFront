import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { encryptData } from "../crypto/VaultCrypto";
import { deriveMasterKey } from "../crypto/DeriveMasterKey";
import { generatePasswordVerifier } from "../crypto/AuthService";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    masterPassword: "",
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

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  function arrayBufferToPem(buffer) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const formatted = base64.match(/.{1,64}/g).join("\n");

    return `-----BEGIN PRIVATE KEY-----\n${formatted}\n-----END PRIVATE KEY-----`;
  }

  function downloadFile(data, filename) {
    const blob = new Blob([data], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  async function generateKeyPairs() {
    return await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");

    if (
      isBlank(form.username) ||
      isBlank(form.email) ||
      isBlank(form.masterPassword) ||
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
      const keyPair = await generateKeyPairs();

      const publicKey = await crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );

      const privateKey = await crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      const salt = generateSalt();
      const saltBase64 = arrayBufferToBase64(salt);

      await deriveMasterKey(form.masterPassword, salt);

      const passwordVerifier = await generatePasswordVerifier(form.masterPassword, salt);

      const publicKeyBase64 = arrayBufferToBase64(publicKey);

      const res = await fetch("https://localhost:8080/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          passwordHash: passwordVerifier,
          role: form.role,
          publicKey: publicKeyBase64,
          salt: saltBase64,
          active: true,
          frozen: false,
        }),
      });

      const data = await res.json();

      if (data.totpQrCode) {
        localStorage.setItem("qrCode", data.totpQrCode);
        localStorage.setItem("username", data.username);

        const derivedKey = await deriveMasterKey(
          form.masterPassword,
          salt
        );

        const privateKeyPem = arrayBufferToPem(privateKey);

        const vault = await encryptData(
          privateKeyPem,
          derivedKey
        );

        downloadFile(
          JSON.stringify(vault),
          `${data.username}-private-key.vault`
        );

        navigate("/setup-2fa");
        return;
      }

      setMessage(data.message || "Registered successfully");
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Registration failed");
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
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="auth-input"
        />

        <input
          name="masterPassword"
          type="password"
          placeholder="Master Password"
          value={form.masterPassword}
          onChange={handleChange}
          className="auth-input"
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
      </div>
    </div>
  );
}