import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./crypto/axios";

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    api.post("auth/logout");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}