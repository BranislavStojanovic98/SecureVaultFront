import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { decryptData } from "../crypto/VaultCrypto";
import { importPrivateKey, importPublicKey } from "../crypto/CryptoService";
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
  const navigate = useNavigate();
  
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vaultKey, setVaultKey] = useState(null);
  const [decryptedMap, setDecryptedMap] = useState({});

  const [shareOpen, setShareOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

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

async function openShareModal(secret) {
  try {
    setSelectedSecret(secret);
    setShareOpen(true);

    const res = await fetch(`http://localhost:8080/teamMember/getTeammatesFor/${secret.teamId}`, {
      credentials: "include",
    });

    const data = await res.json();

    const meRes = await fetch("http://localhost:8080/auth/me", { credentials: "include" });
    const meData = await meRes.json();
    const currentUserId = meData.userId;

    const filtered = data.filter((u) => u.userId !== currentUserId);
    setTeamMembers(filtered);
  } catch(err) {
    console.error(err);
    alert("Failed to load Teammembers");
  }
}

function toggleUser(userId) {
  setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
}

async function shareSecret() {
  try {

    if(!vaultKey || !selectedSecret) {
      alert("Vault not ready");
      return;
    }

    const privateKey = await importPrivateKey(vaultKey);

    const encryptedKeyBytes = base64ToUint8(selectedSecret.encryptedKey);

    const aesKeyRaw = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedKeyBytes
    );

    const recipients = await Promise.all(
        selectedUsers.map(async (id) => {
          const res = await fetch(`http://localhost:8080/user/${id}/public-key`,{
            credentials: "include",
          });

          const data = await res.json();

          return {
            userId: id,
            publicKey: data.publicKey,
          };
        })
    );

    for(const r of recipients) {
      const pubKey = await importPublicKey(r.publicKey);

      const encryptedKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        pubKey,
        aesKeyRaw,
      );

      await fetch(`http://localhost:8080/secret/share/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials:"include",
          body: JSON.stringify({
            secretId: selectedSecret.id,
            userId: r.userId,
            encryptedKey: Array.from(new Uint8Array(encryptedKey)),
          }),
        });
    }
    
    alert("Shared secret successfully");

    setShareOpen(false);
    setSelectedUsers([]);

  } catch (err) {
    console.error(err);
    alert("Failed to create secret share");
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

         <button
          className="rotate-btn"
          onClick={() => navigate("/my-secrets/rotate")}
        >
          🔄 Rotate Secrets
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

            <button
              onClick={() => openShareModal(s)}
              className="btn secondary"
            >
              Share
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

      {shareOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Share Secret</h3>

            <div className="modal-list">
              {teamMembers.map((member) => (
                <label
                  key={member.userId}
                  className="modal-item"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(
                      member.userId
                    )}
                    onChange={() =>
                      toggleUser(member.userId)
                    }
                  />
                  User #{member.userId}
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShareOpen(false)}
                className="btn gray"
              >
                Cancel
              </button>

              <button
                onClick={shareSecret}
                className="btn"
              >
                Share Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}