// src/features/auth/hooks/useLogin.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { decodeToken } from "../utils/decodeToken";

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginUser = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await login({ username, password });

      const decoded = decodeToken(response.access_token);

      const user = {
        username: decoded.preferred_username,
        email: decoded.email,
        roles: decoded.realm_access?.roles ?? [],
      };

      setAuth(response.access_token, user);

      navigate("/", { replace: true });
    } catch {
      setError("Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  return { loginUser, loading, error };
};
