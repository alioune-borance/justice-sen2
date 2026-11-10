import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { AccessRule, ROUTE_ACCESS, RoutePath } from "../config/rbac";

export const FORBIDDEN_PATH = "/403";

interface ProtectedRouteProps {
  // Chemin déclaré dans config/rbac.ts (ROUTE_ACCESS) ; ou règle explicite via `rule`
  path?: RoutePath;
  rule?: AccessRule;
  children?: React.ReactNode;
}

// Garde de route par permission : redirige vers la page 403 si la règle n'est pas satisfaite.
// L'authentification et l'état du compte sont vérifiés en amont par RequireAuth.
// Le backend reste seul juge : cette garde évite seulement d'afficher un écran inutilisable.
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path, rule, children }) => {
  const { user, allows } = usePermissions();
  const location = useLocation();
  if (!user) return null;

  const effectiveRule = rule ?? (path ? ROUTE_ACCESS[path] : undefined);
  if (!allows(effectiveRule)) {
    return <Navigate to={FORBIDDEN_PATH} replace state={{ from: location.pathname }} />;
  }
  return <>{children ?? <Outlet />}</>;
};
