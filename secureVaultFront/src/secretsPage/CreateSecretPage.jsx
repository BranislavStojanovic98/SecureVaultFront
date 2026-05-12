import { useEffect, useState } from "react";
import { deriveMasterKey } from "../crypto/DeriveMasterKey";
import { derivePasswordVerifier } from "../crypto/AuthService";

function base64FromBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

export default function CreateSecretPage() {
  const [content, setContent] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [masterPassword, setMasterPassword] = useState("");

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("http://localhost:8080/teamMember/my", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("Failed to load teams", err);
      }
    }

    fetchTeams();
  }, []);

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

      const saltRes = await fetch("http://localhost:8080/auth/salt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: localStorage.getItem("username"),
        }),
      });

      const saltData = await saltRes.json();

      const salt = Uint8Array.from(atob(saltData.salt), c => c.charCodeAt(0));

      const verifier = await derivePasswordVerifier(masterPassword, salt);

      const verifyRes = await fetch("http://localhost:8080/auth/verify-master", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          username: localStorage.getItem("username"),
          password: verifier,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error("Invalid master password");
      }

      const aesKey = await deriveMasterKey(masterPassword, salt);

      const { encryptedBlob, iv } = await encryptSecret(aesKey, content);

      const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

      const token = localStorage.getItem("token");
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const userIdForPk = tokenPayload.id;

      const userRes = await fetch(
        `http://localhost:8080/user/${userIdForPk}/public-key`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
        rawAesKey
      );

      const res = await fetch(
        "http://localhost:8080/secret/create-with-share",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            teamId: Number(selectedTeam),
            createdById: Number(userId),

            encryptedBlob,
            iv,

            encryptedKey: base64FromBuffer(encryptedKey),
            userId: Number(userIdForPk),
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
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Create Secret</h2>

      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
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
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <textarea
        rows={8}
        style={{ width: "100%", padding: 10 }}
        placeholder="Enter your secret..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !content}
        style={{ marginTop: 10, padding: 10 }}
      >
        {loading ? "Encrypting..." : "Create Secret"}
      </button>

      {status && <p>{status}</p>}
    </div>
  );
}