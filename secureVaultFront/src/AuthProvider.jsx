import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import api from "./crypto/axios";
import { AuthContext } from "./AuthContext";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  const PUBLIC_ROUTES = ["/", "/register", "/2fa"];

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.log(err);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const isPublic = PUBLIC_ROUTES.includes(location.pathname);

    // 🚫 SKIP auth check on public pages
    if (isPublic) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      await fetchUser();
      setLoading(false);
    })();

  }, [location.pathname, fetchUser]);

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      refreshUser: fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}