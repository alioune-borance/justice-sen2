// Rôles de l'application (source de vérité : backend, GET auth/me/)
export type Role =
  | "SUPER_ADMIN"
  | "ADMIN_PRISON"
  | "SUPERVISEUR_PRISON"
  | "AGENT_PENITENTIAIRE"
  | "PERSONNEL_SANTE"
  | "PROCHE_REFERENT"
  | "REP_MIN_JUSTICE"
  | "REP_MIN_INTERIEUR"
  | "ACTEUR_JUDICIAIRE";

// granted : accès normal ; les autres valeurs bloquent l'application (page « Mon compte »)
export type AccessStatus = "granted" | "pending" | "rejected" | "disabled" | "not_configured";

export type Capability = "read" | "create" | "update" | "delete" | "validate" | "complete";

// Ex. "transfers:validate" (ressources de sgpauth/rbac/policy.py côté backend)
export type Permission = `${string}:${Capability}`;

export interface UserScope {
  type: "national" | "prison" | "prisoners" | "none";
  prison_ids: number[] | null;
  prisoner_ids: number[] | null;
}

// Réponse de GET auth/me/
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role | null;
  role_label: string | null;
  account_status: string | null;
  access: AccessStatus;
  prison: { id: number; name: string } | null;
  scope: UserScope;
  permissions: Permission[];
  links: unknown[];
  rbac_enforced: boolean;
}
