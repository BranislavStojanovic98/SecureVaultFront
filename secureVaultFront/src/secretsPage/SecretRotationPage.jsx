import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { decryptData, encryptData } from "../crypto/VaultCrypto";
import { importPublicKey } from "../crypto/CryptoService";
import { base64FromBuffer, pemToArrayBuffer } from "../crypto/Encoding";
import { unlockVaultKey } from "../crypto/UnlockVaultKey";
import { deriveVaultKek } from "../crypto/DeriveVaultKek";
import "./SecretRotationPage.css";


function toBytes(input) {
  if (input instanceof Uint8Array) return input;

  if (Array.isArray(input)) return new Uint8Array(input);

  if (!input) throw new Error("Missing byte field");

  if (typeof input === "string") {

    const trimmed = input.trim();

    if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {

      const binary = atob(trimmed);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return bytes;
    }
    throw new Error("Invalid string format (not base64)");
  }
  throw new Error("Unsupported format" + typeof request);
}


export default function SecretRotationPage() {
  const [secrets, setSecrets] = useState([]);
  const [vaultKey, setVaultKey] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSecrets() {
      try {
        const res = await fetch("https://localhost:8080/secret/byThisUser", {
          credentials: "include",
        });
        setSecrets(await res.json());
      } catch (err) {
        console.error(err);
        navigate("/");
      }
    }

    fetchSecrets();
  }, [navigate]);


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

  const handleRotateDek = async () => {
    if (!vaultKey) {
      alert("Unlock vault first");
      return;
    }

    try {
      setLoading(true);

      const username = localStorage.getItem("username");
      
      const kek = await deriveVaultKek(username);

      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        pemToArrayBuffer(vaultKey),
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
      );

      const rotated = await Promise.all(
        secrets.map(async (s) => {
          try {
            let dekRaw;

            if (s.wrappedDek && s.wrappedDekIv) {

              dekRaw = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: toBytes(s.wrappedDekIv) },
                kek,
                toBytes(s.wrappedDek)
              );

            } else if (s.encrypted_key || s.encryptedKey) {

              const rsa = s.encrypted_key ?? s.encryptedKey;

              dekRaw = await crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                privateKey,
                toBytes(rsa)
              );

            } else {
              console.log("BAD SECRET ROW:", s);
              throw new Error("No DEK format found");
            }

            const oldDekKey = await crypto.subtle.importKey(
              "raw",
              dekRaw,
              { name: "AES-GCM" },
              false,
              ["encrypt", "decrypt"]
            );

            const plaintext = await decryptData(
              { iv: toBytes(s.iv), data: toBytes(s.encryptedBlob) },
              oldDekKey
            );

            const newDek = crypto.getRandomValues(new Uint8Array(32));
            const newDekKey = await crypto.subtle.importKey(
              "raw",
              newDek,
              "AES-GCM",
              false,
              ["encrypt"]
            );

            const encSecret = await encryptData(plaintext, newDekKey);
            const dekIv = crypto.getRandomValues(new Uint8Array(12));
            const dekIvB64 = base64FromBuffer(dekIv);

            const wrapped = await crypto.subtle.encrypt(
              { name: "AES-GCM", iv: dekIv },
              kek,
              newDek
            );

            const recipientsRes = await fetch(
              `https://localhost:8080/secret/shared-public-keys/${s.id}`,
              { credentials: "include" }
            );
            const recipients = await recipientsRes.json();

            const shareRequests = await Promise.all(
              recipients.map(async (r) => {
                const pubKey = await importPublicKey(r.publicKey);
                const encryptedKey = await crypto.subtle.encrypt(
                  { name: "RSA-OAEP" },
                  pubKey,
                  newDek
                );

                return {
                  secretId: s.id,
                  userId: r.userId,
                  encryptedKey: Array.from(new Uint8Array(encryptedKey)),
                };
              })
            );

            await Promise.all(
              shareRequests.map((payload) =>
                fetch("https://localhost:8080/secret/share/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(payload),
                })
              )
            );

            return {
              id: s.id,
              createdById: s.createdById,
              teamId: s.teamId,
              encryptedBlob: encSecret.data,
              iv: encSecret.iv,
              wrappedDek: Array.from(new Uint8Array(wrapped)),
              wrappedDekIv: dekIvB64,
            };
          } catch (err) {
            console.error("Failed:", s.id, err);
            return null;
          }
        })
      );

      const cleaned = rotated.filter(Boolean);

      await fetch("https://localhost:8080/secret/rotate-secret", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(cleaned),
      });

      alert("DEK rotation completed");

      const res = await fetch("https://localhost:8080/secret/byThisUser", {
        credentials: "include",
      });

      setSecrets(await res.json());
    } catch (err) {
      console.error(err);
      alert("DEK rotation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="secret-rotation-page">
        <div className="page-header">
            <h2>🔐 DEK Rotation</h2>

            <button
            className="back-btn"
            onClick={() => window.history.back()}
            >
            ← Back
            </button>
        </div>

      <input
        type="file"
        accept=".vault,application/json"
        className="file-input"
        onChange={(e) => unlockVault(e.target.files[0])}
      />

      <p className="status-text">Total secrets: {secrets.length}</p>

      <h3>Secrets</h3>
      <div className="secret-list">
        {secrets.map((s) => (
          <div key={s.id} className="secret-item">
            <b>ID:</b> {s.id}
            <br />
            <b>Encrypted:</b> {s.encryptedBlob?.substring?.(0, 30) || "encrypted"}...
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          className="btn red"
          onClick={handleRotateDek}
          disabled={loading}
        >
          {loading ? "Rotating..." : "Rotate DEKs"}
        </button>
      </div>
    </div>
  );
}