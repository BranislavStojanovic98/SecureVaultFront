export async function deriveMasterKey(masterPassword, salt) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 600000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}