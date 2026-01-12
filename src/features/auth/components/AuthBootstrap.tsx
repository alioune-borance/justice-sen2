import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { refreshToken } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { decodeToken } from "../utils/decodeToken";

export const AuthBootstrap = () => {
  const [loading, setLoading] = useState(true);

  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const bootstrapAuth = async () => {
      // déjà hydraté
      if (accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await refreshToken();
        const decoded = decodeToken(response.accessToken);

        const user = {
          username: decoded.preferred_username,
          email: decoded.email,
          roles: decoded.realm_access?.roles ?? [],
        };

        setAuth(response.accessToken, user);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span>Initialisation de la session...</span>
      </div>
    );
  }

  return <Outlet />;
};
