import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8080/auth/me", {
      credentials: "include"
    })
      .then(res => setAuth(res.ok))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) return null;

  return auth ? children : <Navigate to="/" replace />;
}