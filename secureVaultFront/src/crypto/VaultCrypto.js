export async function encryptData(vault, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(vault)
  );

  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  };
}

export async function decryptData(vault, key) {
  function normalizeBytes(input, name = "field") {
    if (!input) {
      throw new Error(`Missing byte field: ${name}`);
    }

    // already bytes
    if (input instanceof Uint8Array) return input;

    // Java byte[] → JSON array
    if (Array.isArray(input)) {
      return new Uint8Array(input);
    }

    if (typeof input === "string") {
      const trimmed = input.trim();

      // base64 check (strict)
      const isBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed);

      if (!isBase64) {
        throw new Error(`Invalid base64 in ${name}: ${trimmed.slice(0, 30)}`);
      }

      const binary = atob(trimmed);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return bytes;
    }

    throw new Error(`Unsupported type for ${name}: ${typeof input}`);
  }

  const iv = normalizeBytes(vault.iv, "iv");
  const data = normalizeBytes(vault.data, "data");

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}