import React from "react";
import { Outlet } from "react-router-dom";
import { ForbiddenPage } from "../../../pages/errors/ForbiddenPage";
import { usePermissions } from "../hooks/usePermissions";
import { Permission, Role } from "../types/user.types";

interface RequirePermissionProps {
  perm?: Permission;
  anyOf?: Permission[];
  // Écrans sans ressource backend (maquettes) : rôles autorisés
  roles?: Role[];
  children?: React.ReactNode;
}

// Garde de route : page 403 si la permission manque (l'accès au compte est vérifié par RequireAuth).
export const RequirePermission: React.FC<RequirePermissionProps> = ({ perm, anyOf, roles, children }) => {
  const { user, can, canAny } = usePermissions();
  if (!user) return null;

  const roleAllowed = !roles || !user.rbac_enforced || (user.role !== null && roles.includes(user.role));
  const allowed = roleAllowed && (perm ? can(perm) : true) && (anyOf ? canAny(anyOf) : true);

  if (!allowed) return <ForbiddenPage />;
  return <>{children ?? <Outlet />}</>;
};
