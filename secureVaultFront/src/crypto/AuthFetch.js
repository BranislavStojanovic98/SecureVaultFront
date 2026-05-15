export async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 401) {
    window.location.href = "/";
    return;
  }

  return res;
}