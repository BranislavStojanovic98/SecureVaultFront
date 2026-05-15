import { decryptData, encryptData } from "./VaultCrypto";
import { deriveMasterKey } from "./DeriveMasterKey";

export async function rotateSecrets({
  secrets,
  masterPassword,
  salt
}) {
  const key = await deriveMasterKey(masterPassword, salt);

  const decrypted = await Promise.all(
    secrets.map(async (s) => ({
      id: s.id,
      value: await decryptData(s, key),
    }))
  );

  const reEncrypted = await Promise.all(
    decrypted.map(async (s) => {
      const enc = await encryptData(s.value, key);
      return {
        id: s.id,
        ...enc,
      };
    })
  );

  return reEncrypted;
}

