import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deriveMasterKey } from "../crypto/DeriveMasterKey";
import { useAuth } from "../AuthContext";
import { generatePasswordVerifier } from "../crypto/AuthService";
import { base64FromBuffer } from "../crypto/Encoding";
import "./CreateSecretPage.css";


export default function CreateSecretPage() {
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const { user } = useAuth();

  const username = user?.username;
  const userId = user?.userId;

  useEffect(() => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      const href = link.getAttribute("href");
      if (href) {
        link.setAttribute("href", href.split("?")[0] + "?v=" + Date.now());
      }
    });
  }, []);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("https://localhost:8080/teamMember/my", {
          credentials: "include",
        });

        if (!res.ok) {
          navigate("/");
          return;
        }

        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("Failed to load teams", err);
      }
    }

    fetchTeams();
  }, [navigate]);

  async function encryptSecret(aesKey, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      new TextEncoder().encode(plaintext)
    );

    return {
      encryptedBlob: base64FromBuffer(encrypted),
      iv: base64FromBuffer(iv),
    };
  }

  const handleSubmit = async () => {
    setLoading(true);
    setStatus("");

    try {
      if (!selectedTeam) throw new Error("Please select a team");
      if (!masterPassword) throw new Error("Master password is required");

      const saltRes = await fetch("https://localhost:8080/auth/salt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username }),
        credentials: "include",
      });

      const saltData = await saltRes.json();

      const salt = Uint8Array.from(atob(saltData.salt), c => c.charCodeAt(0));

      const verifier = await generatePasswordVerifier(masterPassword, salt);

      const verifyRes = await fetch("https://localhost:8080/auth/verify-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: verifier,
        }),
        credentials: "include",
      });

      if (!verifyRes.ok) {
        throw new Error("Invalid master password");
      }

      const aesKey = await crypto.subtle.generateKey( {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );

      const kek = await deriveMasterKey(masterPassword, salt);

      const { encryptedBlob, iv } = await encryptSecret(aesKey, content);

      const rawDek = await crypto.subtle.exportKey("raw", aesKey);

      const dekIv = crypto.getRandomValues(new Uint8Array(12));

      const wrappedDek = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: dekIv,
        },
        kek,
        rawDek
      );

      const wrappedDekB64 = base64FromBuffer(wrappedDek);
      const dekIvB64 = base64FromBuffer(dekIv);

      const userRes = await fetch(
        `https://localhost:8080/user/${userId}/public-key`, {
          credentials: "include",
        });

      const userData = await userRes.json();

      const publicKeyBytes = Uint8Array.from(
        atob(userData.publicKey),
        c => c.charCodeAt(0)
      );

      const publicKey = await crypto.subtle.importKey(
        "spki",
        publicKeyBytes,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["encrypt"]
      );

      const encryptedKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        rawDek
      );

      const res = await fetch(
        "https://localhost:8080/secret/create-with-share",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", },
          credentials: "include",
          body: JSON.stringify({
            teamId: Number(selectedTeam),
            createdById: Number(userId),

            encryptedBlob,
            iv,

            wrappedDek: wrappedDekB64,
            wrappedDekIv: dekIvB64,

            encryptedKey: base64FromBuffer(encryptedKey),
            userId: Number(userId),
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create secret");

      setStatus("Secret created successfully!");
      setContent("");
    } catch (err) {
      console.error(err);
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-container">
      <div className="create-card">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h2>Create Secret</h2>

        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="input"
        >
          <option value="">Select team</option>
          {teams.map((t) => (
            <option key={t.teamId} value={t.teamId}>
              {t.teamId}
            </option>
          ))}
        </select>

        <input
          type="password"
          placeholder="Master Password"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
          className="input"
        />

        <textarea
          rows={8}
          placeholder="Enter your secret..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="textarea"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !content}
          className="create-btn"
        >
          {loading ? "Encrypting..." : "Create Secret"}
        </button>

        {status && <div className="status">{status}</div>}
      </div>
    </div>
  );
}