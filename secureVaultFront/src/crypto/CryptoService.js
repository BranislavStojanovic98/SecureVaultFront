export async function importPrivateKey(pem) {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

export async function signNonce(privateKey, nonce) {
  const enc = new TextEncoder();

  const signature = await crypto.subtle.sign(
    {
      name: "RSASSA-PKCS1-v1_5",
      saltLength: 32,
    },
    privateKey,
    enc.encode(nonce)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}