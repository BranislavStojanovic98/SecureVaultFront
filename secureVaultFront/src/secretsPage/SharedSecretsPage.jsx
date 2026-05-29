import { useEffect, useState } from "react";

import { unlockVaultKey } from "../crypto/UnlockVaultKey";
import { logDecrypt } from "../crypto/Audit";


import "./MySecretsPage.css"
import { decryptSecretCrypto } from "../crypto/DecryptSecretService";


export default function MySecretsPage() {
  
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vaultKey, setVaultKey] = useState(null);
  const [decryptedMap, setDecryptedMap] = useState({});

  const [currentPage, setCurrentPage] = useState(1);

  const secretsPerPage = 10;

  const indexOfLastSecret = currentPage * secretsPerPage;
  const indexOfFirstSecret = indexOfLastSecret - secretsPerPage;

  const currentSecrets = secrets.slice(indexOfFirstSecret, indexOfLastSecret);

  const totalPages = Math.ceil(secrets.length / secretsPerPage);

  useEffect(() => {
    async function fetchSecrets() {
      try {
        const res = await fetch("https://localhost:8080/secret/byUser", {
          credentials: "include",
        });

        const data = await res.json();
        setSecrets(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSecrets();
  }, []);

  async function unlockVault(file) {
    try {
      const username = localStorage.getItem("username");
      const privateKeyPem = await unlockVaultKey(file, username);

      setVaultKey(privateKeyPem);

      alert("Vault unlocked");
    } catch (err) {
      console.error(err);
      alert("Failed to unlock vault");
    }
  }

  async function decryptSecret(secret) {
  try {
    if (!vaultKey) {
      alert("Upload vault first");
      return;
    }

    const plaintext = await decryptSecretCrypto(secret, vaultKey);

    setDecryptedMap(prev => ({
      ...prev,
      [secret.id]: plaintext,
    }));

    await logDecrypt(secret.id);

  } catch (err) {
    console.error("Decrypt failed:", err);
    alert("Failed to decrypt secret");
  }
}


  return (
    <div className="secrets-page">
      <div className="page-header">
        <h2>🔐 My Secrets</h2>

        <button
          className="back-btn"
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
      </div>

      <input
        className="file-input"
        type="file"
        accept=".vault,application/json"
        onChange={(e) => unlockVault(e.target.files[0])}
      />

      {loading && <p className="status-text">Loading...</p>}

      {!loading && secrets.length === 0 && (
        <p className="status-text">No secrets shared with you.</p>
      )}

      <div className="secrets-grid">
        {currentSecrets.map((s) => (
          <div key={s.id} className="secret-card">
            <h4>Secret #{s.id}</h4>

            <p>
              <b>Team:</b> {s.teamId}
            </p>

            {decryptedMap[s.id] ? (
              <pre className="decrypted-box">
                {decryptedMap[s.id]}
              </pre>
            ) : (
              <p className="encrypted-text">
                <b>Encrypted:</b>{" "}
                {s.encryptedBlob?.substring(0, 30)}...
              </p>
            )}

            <button
              onClick={() => decryptSecret(s)}
              className="btn"
              disabled={!!decryptedMap[s.id]}
            >
              🔓 Decrypt
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn secondary"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) => prev - 1)
            }
          >
            ← Previous
          </button>

          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="btn secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => prev + 1)
            }
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}