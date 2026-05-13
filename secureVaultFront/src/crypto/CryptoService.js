export async function importPrivateKey(pem) {
  const binary = atob(pem.replace(/-----[^-]+-----/g, "").replace(/\n/g, ""));
  const buffer = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "pkcs8",
    buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

export async function importPublicKey(base64Key) {
  const bytes = Uint8Array.from(atob(base64Key), c =>
    c.charCodeAt(0)
  );

  return crypto.subtle.importKey(
    "spki",
    bytes.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
}