import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deriveMasterKey } from "../crypto/DeriveMasterKey";
import { importPrivateKey, signNonce } from "../crypto/CryptoService";
import { decryptPrivateKey } from "../crypto/VaultCrypto";

async function safeFetch(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || "Unknown error" };
  }
}

export default function UnlockVaultPage() {
  const [file, setFile] = useState(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleUnlock = async () => {
    if (!file || !masterPassword) {
      setMessage("Upload key and enter master password");
      return;
    }

    try {
      const username = localStorage.getItem("username");
      if (!username) {
        setMessage("Missing username. Please login again.");
        return;
      }

      const vaultText = await file.text();
      let vault;

      try {
        vault = JSON.parse(vaultText);
      } catch (err) {
        setMessage(err.message || "Invalid vault file format");
        return;
      }

      const saltBase64 = localStorage.getItem("salt");
      if (!saltBase64) {
        setMessage("Missing salt. Cannot derive master key.");
        return;
      }

      const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

      const derivedKey = await deriveMasterKey(masterPassword, salt);

      let privateKeyPem;

      try {
        privateKeyPem = await decryptPrivateKey(vault, derivedKey);
      } catch (err) {
        setMessage(err.message || "Wrong master password or corrupted vault file");
        return;
      }

      const privateKey = await importPrivateKey(privateKeyPem);

      const challengeRes = await safeFetch("http://localhost:8080/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (challengeRes.error) {
        setMessage("Failed to get challenge: " + challengeRes.error);
        return;
      }

      const { nonce } = challengeRes;
      if (!nonce) {
        setMessage("Challenge missing from server response.");
        return;
      }

      let signature;
      try {
        signature = await signNonce(privateKey, nonce);
      } catch (err) {
        setMessage(err.message || "Failed to sign challenge.");
        return;
      }

      const verifyRes = await safeFetch("http://localhost:8080/auth/verifySiginture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, nonce, signature }),
      });

      if (verifyRes.error) {
        setMessage("Unlock failed: " + verifyRes.error);
        return;
      }

      if (verifyRes.token) {
        localStorage.setItem("token", verifyRes.token);
        navigate("/home");
      } else {
        setMessage("Vault unlock failed: Unknown error");
      }
    } catch (err) {
      console.error(err);
      setMessage("Unexpected error during vault unlock");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Unlock Vault</h2>

        <input
          type="file"
          accept=".vault"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <input
          type="password"
          placeholder="Master password"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
          className="auth-input"
        />

        <button onClick={handleUnlock} className="auth-button">
          Unlock
        </button>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  );
}