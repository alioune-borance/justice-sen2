import React from "react";
import { usePermissions } from "../hooks/usePermissions";
import { ActionName } from "../config/rbac";
import { Permission } from "../types/user.types";

interface CanProps {
  perm?: Permission;
  anyOf?: Permission[];
  // Action nommée de config/rbac.ts (ACTIONS), équivalente à perm
  action?: ActionName;
  // Condition supplémentaire (ex. statut de l'objet, prison de l'utilisateur)
  when?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// Affiche ses enfants si l'utilisateur a la permission. Masquage d'affichage uniquement :
// le backend refuse de toute façon l'action (403) si elle n'est pas autorisée.
export const Can: React.FC<CanProps> = ({ perm, anyOf, action, when = true, fallback = null, children }) => {
  const { can, canAny, canDo } = usePermissions();
  const allowed =
    when &&
    (perm ? can(perm) : true) &&
    (anyOf ? canAny(anyOf) : true) &&
    (action ? canDo(action) : true);
  return <>{allowed ? children : fallback}</>;
};
