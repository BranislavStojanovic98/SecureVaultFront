export async function requestChallenge(username) {
  const res = await fetch("http://localhost:8080/auth/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  return res.json();
}

export async function verifySignature(username, signature) {
  const res = await fetch("http://localhost:8080/auth/verifySiginture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, signature }),
  });

  // If response is 2xx, try JSON
  if (res.ok) {
    try {
      return await res.json();
    } catch (err) {
      throw new Error("Unexpected JSON format from server", err);
    }
  }

  // If not OK, read as text
  const text = await res.text();
  throw new Error(text || "Unknown server error");
}