import { base64ToBytes, pemToArrayBuffer } from "./Encoding";
import { decryptData } from "./VaultCrypto";

export async function decryptSecretCrypto(secret, vaultKeyPem) {
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(vaultKeyPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );

  const encryptedKeyBytes = base64ToBytes(secret.encryptedKey);

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

  return decryptData(
    {
      iv: secret.iv,
      data: secret.encryptedBlob,
    },
    aesKey
  );
}