import { useCallback, useMemo } from "react";
import { useAuthStore } from "../store/auth.store";
import { Permission } from "../types/user.types";

// Lecture des permissions effectives renvoyées par GET auth/me/.
// Sert uniquement à adapter l'affichage : le backend reste seul juge (filtrage et 403).
export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);
  const granted = useMemo(() => new Set<string>(user?.permissions ?? []), [user]);

  const can = useCallback((permission: Permission) => granted.has(permission), [granted]);
  const canAny = useCallback((permissions: Permission[]) => permissions.some((p) => granted.has(p)), [granted]);

  // L'objet appartient-il au périmètre d'écriture de l'utilisateur ? (national : toujours)
  const isMyPrison = useCallback(
    (prisonId: number | null | undefined) => {
      if (!user) return false;
      if (!user.rbac_enforced || user.scope.type === "national") return true;
      return prisonId != null && (user.scope.prison_ids ?? []).includes(Number(prisonId));
    },
    [user]
  );

  return { user, role: user?.role ?? null, can, canAny, isMyPrison };
};
