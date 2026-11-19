// src/features/auth/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export const ACCOUNT_STATUS_PATH = "/compte";

export const RequireAuth = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const access = useAuthStore((s) => s.user?.access);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Compte en attente, refusé, désactivé ou sans rôle : seule la page « Mon compte » est accessible
  if (access && access !== "granted" && location.pathname !== ACCOUNT_STATUS_PATH) {
    return <Navigate to={ACCOUNT_STATUS_PATH} replace />;
  }

  return <Outlet />;
};
