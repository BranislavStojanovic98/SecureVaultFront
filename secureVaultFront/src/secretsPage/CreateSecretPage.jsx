import { useEffect, useState } from "react";

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
}

function encode(text) {
  return new TextEncoder().encode(text);
}

export default function CreateSecretPage() {
  const [content, setContent] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const userId = localStorage.getItem("userId");

  // 🔽 Load teams user belongs to
  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("http://localhost:8080/team/my", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();
        console.log(localStorage.getItem("token"));
        setTeams(data);
      } catch (err) {
        console.error("Failed to load teams", err);
      }
    }

    fetchTeams();
  }, []);

  async function generateAESKey() {
    return await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptSecret(aesKey, plaintext) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encode(plaintext)
    );

    return {
      encryptedBlob: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
    };
  }

  const handleSubmit = async () => {
    setLoading(true);
    setStatus("");

    try {
      if (!selectedTeam) {
        throw new Error("Please select a team");
      }

      const aesKey = await generateAESKey();
      const { encryptedBlob, iv } = await encryptSecret(aesKey, content);
      
      const res = await fetch("http://localhost:8080/secret/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          teamId: Number(selectedTeam),
          createdById: Number(userId),
          encryptedBlob,
          iv,
        }),
      });

      if (!res.ok) throw new Error("Failed to create secret");

      setStatus("Secret created successfully!");
      setContent("");
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Create Secret</h2>

      {/* TEAM SELECT */}
      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      >
        <option value="">Select team</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

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