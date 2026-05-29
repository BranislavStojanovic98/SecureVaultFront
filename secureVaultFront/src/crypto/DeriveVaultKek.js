import { base64ToBytes } from "./Encoding";
import { deriveMasterKey } from "./DeriveMasterKey";

export async function deriveVaultKek(username) {
  const masterPassword = prompt("Enter master password");

  if (!masterPassword) {
    throw new Error("Missing password");
  }

  const saltRes = await fetch("https://localhost:8080/auth/salt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
    credentials: "include",
  });

  const { salt: saltB64 } = await saltRes.json();

  const salt = base64ToBytes(saltB64);

  return deriveMasterKey(masterPassword, salt);
}