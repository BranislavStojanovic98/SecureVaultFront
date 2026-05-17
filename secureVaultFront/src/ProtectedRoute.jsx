import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "./crypto/axios";

export default function ProtectedRoute({ role }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        setUser(res.data);
        setStatus("authed");
      })
      .catch(() => {
        api.post("/auth/logout")
        setStatus("unauth");
      });
  }, []);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauth") {
    return <Navigate to="/" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}