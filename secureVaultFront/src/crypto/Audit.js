import api from "../crypto/axios";

export async function logDecrypt(secretId) {
  return api.post("/audit/decrypt", { secretId });
}