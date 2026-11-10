import { useCallback, useMemo } from "react";
import { useAuthStore } from "../store/auth.store";
import { ACTIONS, AccessRule, ActionName } from "../config/rbac";
import { Permission, User } from "../types/user.types";

// Une règle d'accès (config/rbac.ts) est-elle satisfaite par cet utilisateur ?
export const isAccessAllowed = (user: User | null, rule: AccessRule | undefined): boolean => {
  if (!user) return false;
  if (!rule) return true;
  const granted = new Set<string>(user.permissions);
  // Les rôles ne filtrent que les maquettes, et seulement quand le backend applique le RBAC
  const roleOk = !rule.roles || !user.rbac_enforced || (user.role !== null && rule.roles.includes(user.role));
  const permOk = !rule.perm || granted.has(rule.perm);
  const anyOk = !rule.anyOf || rule.anyOf.some((p) => granted.has(p));
  return roleOk && permOk && anyOk;
};

// Lecture des permissions effectives renvoyées par GET auth/me/.
// Sert uniquement à adapter l'affichage : le backend reste seul juge (filtrage et 403).
export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);
  const granted = useMemo(() => new Set<string>(user?.permissions ?? []), [user]);

  const can = useCallback((permission: Permission) => granted.has(permission), [granted]);
  const canAny = useCallback((permissions: Permission[]) => permissions.some((p) => granted.has(p)), [granted]);
  const canDo = useCallback((action: ActionName) => granted.has(ACTIONS[action]), [granted]);
  const allows = useCallback((rule: AccessRule | undefined) => isAccessAllowed(user, rule), [user]);

  // L'objet appartient-il au périmètre d'écriture de l'utilisateur ? (national : toujours)
  const isMyPrison = useCallback(
    (prisonId: number | null | undefined) => {
      if (!user) return false;
      if (!user.rbac_enforced || user.scope.type === "national") return true;
      return prisonId != null && (user.scope.prison_ids ?? []).includes(Number(prisonId));
    },
    [user]
  );

  return { user, role: user?.role ?? null, can, canAny, canDo, allows, isMyPrison };
};
