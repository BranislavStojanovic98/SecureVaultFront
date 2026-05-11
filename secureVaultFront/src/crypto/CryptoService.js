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