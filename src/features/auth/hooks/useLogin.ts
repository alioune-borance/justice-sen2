// src/features/auth/hooks/useLogin.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { login } from "../api/auth.api";
import { endLocalSession, establishSession, initSessionSync } from "../session";

const loginErrorMessage = (error: unknown): string => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 401) return "Identifiants invalides";
  if (status === 429) return "Trop de tentatives. Réessayez dans une minute.";
  if (status === 403) return "Accès refusé. Rechargez la page puis réessayez.";
  if (status === 503) return "Service d'authentification indisponible.";
  return "Connexion impossible. Réessayez plus tard.";
};

export const useLogin = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginUser = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      initSessionSync();

      const response = await login({ username, password });
      await establishSession(response.access_token);

      navigate("/", { replace: true });
    } catch (err) {
      endLocalSession();
      setError(loginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return { loginUser, loading, error };
};
