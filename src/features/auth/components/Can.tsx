import React from "react";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/user.types";

interface CanProps {
  perm?: Permission;
  anyOf?: Permission[];
  // Condition supplémentaire (ex. statut de l'objet, prison de l'utilisateur)
  when?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// Affiche ses enfants si l'utilisateur a la permission. Masquage d'affichage uniquement.
export const Can: React.FC<CanProps> = ({ perm, anyOf, when = true, fallback = null, children }) => {
  const { can, canAny } = usePermissions();
  const allowed = when && (perm ? can(perm) : true) && (anyOf ? canAny(anyOf) : true);
  return <>{allowed ? children : fallback}</>;
};
