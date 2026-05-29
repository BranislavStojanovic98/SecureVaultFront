import { base64ToBytes } from "./Encoding";
import { decryptData } from "./VaultCrypto";

export async function unlockVaultKey(file, username) {

  const masterPassword = prompt("Enter master password");

  if (!masterPassword) throw new Error("Missing password");

  const saltRes = await fetch("https://localhost:8080/auth/salt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
    credentials: "include",
  });

  const { salt: saltB64 } = await saltRes.json();
  
  const salt = base64ToBytes(saltB64);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterPassword),
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

  const vault = JSON.parse(await file.text());

  return decryptData(vault, aesVaultKey);
}