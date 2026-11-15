import { useMemo } from "react";
import { useAuthStore } from "../store/auth.store";
import {
  JUDICIAL_ROLES,
  MAGISTRATE_ROLES,
  NATIONAL_READ_ONLY_ROLES,
  PRISON_ROLES,
  roleLabel,
} from "../config/rbac";
import { Role } from "../types/user.types";

// Rôle de l'utilisateur connecté et familles de rôles (affichage : menus, accueil, libellés).
// Les droits d'une action se testent avec usePermissions().can(…), jamais avec le rôle.
export const useRole = () => {
  const user = useAuthStore((s) => s.user);
  const role: Role | null = user?.role ?? null;

  return useMemo(
    () => ({
      role,
      label: user?.role_label ?? roleLabel(role),
      prison: user?.prison ?? null,
      is: (...roles: Role[]) => role !== null && roles.includes(role),
      isPrisonStaff: role !== null && PRISON_ROLES.includes(role),
      isNationalReadOnly: role !== null && NATIONAL_READ_ONLY_ROLES.includes(role),
      isRelative: role === "PROCHE_REFERENT",
      // Greffier, juge d'instruction, procureur ou avocat
      isJudicialActor: role !== null && JUDICIAL_ROLES.includes(role),
      isGreffier: role === "GREFFIER",
      // Juge d'instruction (prévenus) ou procureur (accusés) : étape 2 des demandes de visite
      isMagistrate: role !== null && MAGISTRATE_ROLES.includes(role),
    }),
    [role, user?.role_label, user?.prison]
  );
};
