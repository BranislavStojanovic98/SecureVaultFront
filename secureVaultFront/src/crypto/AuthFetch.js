export async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));

    if (data.error === "TOKEN_EXPIRED") {
      await fetch("http://localhost:8080/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      window.location.href = "/";
      return;
    }

    window.location.href = "/";
    return;
  }

  return res;
}