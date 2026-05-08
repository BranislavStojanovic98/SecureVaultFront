import { useEffect, useState } from "react";

export default function MySecretsPage() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSecrets() {
      try {
        const res = await fetch("http://localhost:8080/secret/byUser", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load secrets");

        const data = await res.json();
        setSecrets(data);
      } catch (err) {
        console.error("Error loading secrets:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSecrets();
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h2>🔐 My Secrets</h2>

      {loading && <p>Loading...</p>}

      {!loading && secrets.length === 0 && (
        <p>No secrets shared with you.</p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {secrets.map((s) => (
          <div
            key={s.id}
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            <h4>Secret #{s.id}</h4>

            <p><b>Team:</b> {s.teamId}</p>

            <p>
              <b>Encrypted:</b>{" "}
              {s.encryptedBlob?.substring(0, 30)}...
            </p>

            <button
              onClick={() => console.log("decrypt later", s.id)}
            >
              🔓 Decrypt (next step)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}