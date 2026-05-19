import { useEffect, useState } from "react";
import { decryptData } from "../crypto/VaultCrypto";
import api from "../crypto/axios";
import "./MySecretsPage.css"

function base64ToUint8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}


function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

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
        const res = await fetch("http://localhost:8080/secret/byUser", {
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

  async function readVault(file) {
    const text = await file.text();
    return JSON.parse(text);
  }

  async function unlockVault(file) {
    try {
      const masterPassword = prompt("Enter master password");

      const saltRes = await fetch("http://localhost:8080/auth/salt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: localStorage.getItem("username"),
        }),
        credentials: "include",
      });

      const saltData = await saltRes.json();

      const salt = base64ToUint8(saltData.salt);

      const enc = new TextEncoder();

      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(masterPassword),
        "PBKDF2",
        false,
        ["deriveKey"]
      );

      const aesVaultKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 600000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      const vault = await readVault(file);

      const privateKeyRaw = await decryptData(vault, aesVaultKey);

      setVaultKey(privateKeyRaw);

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

    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(vaultKey),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["decrypt"]
    );

    const encryptedKeyBytes = base64ToUint8(secret.encryptedKey);

    const aesKeyRaw = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedKeyBytes
    );

    const aesKey = await crypto.subtle.importKey(
      "raw",
      aesKeyRaw,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const plaintext = await decryptData(
      {
        iv: secret.iv,
        data: secret.encryptedBlob,
      },
      aesKey
    );

    setDecryptedMap(prev => ({
      ...prev,
      [secret.id]: plaintext,
    }));

    await api.post("/audit/decrypt", {
      secretId: secret.id
    });

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