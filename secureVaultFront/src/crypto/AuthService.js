export async function generatePasswordVerifier(
  masterPassword,
  salt
) {
  const enc = new TextEncoder();

  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      enc.encode(masterPassword),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

  const bits =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 600000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

  return btoa(
    String.fromCharCode(
      ...new Uint8Array(bits)
    )
  );
}

export async function derivePasswordVerifier(password, salt) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 600000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return btoa(
    String.fromCharCode(...new Uint8Array(bits))
  );
}