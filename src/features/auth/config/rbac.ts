// Configuration unique des rôles côté front : constantes, libellés, accès aux routes et aux actions.
//
// Miroir d'AFFICHAGE de sgpauth/rbac/policy.py (backend). Le front masque, le backend interdit :
// les permissions effectives viennent toujours de GET auth/me/ ; ce fichier dit seulement
// quelle permission chaque écran et chaque bouton demande.
import { Permission, Role } from "../types/user.types";

// ── Rôles ──────────────────────────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN_PRISON: "ADMIN_PRISON",
  SUPERVISEUR_PRISON: "SUPERVISEUR_PRISON",
  AGENT_PENITENTIAIRE: "AGENT_PENITENTIAIRE",
  PERSONNEL_SANTE: "PERSONNEL_SANTE",
  PROCHE_REFERENT: "PROCHE_REFERENT",
  REP_MIN_JUSTICE: "REP_MIN_JUSTICE",
  REP_MIN_INTERIEUR: "REP_MIN_INTERIEUR",
  GREFFIER: "GREFFIER",
  JUGE_INSTRUCTION: "JUGE_INSTRUCTION",
  PROCUREUR: "PROCUREUR",
  AVOCAT: "AVOCAT",
} as const satisfies Record<Role, Role>;

// Mêmes libellés que sgpauth/rbac/roles.py (le backend renvoie aussi role_label dans /me)
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN_PRISON: "Administrateur de prison",
  SUPERVISEUR_PRISON: "Superviseur de prison",
  AGENT_PENITENTIAIRE: "Agent pénitentiaire",
  PERSONNEL_SANTE: "Personnel de santé",
  PROCHE_REFERENT: "Proche référent",
  REP_MIN_JUSTICE: "Représentant du ministère de la Justice",
  REP_MIN_INTERIEUR: "Représentant du ministère de l'Intérieur",
  GREFFIER: "Greffier",
  JUGE_INSTRUCTION: "Juge d'instruction",
  PROCUREUR: "Procureur",
  AVOCAT: "Avocat",
};

export const roleLabel = (role: Role | null | undefined): string =>
  role ? ROLE_LABELS[role] ?? role : "Aucun rôle";

// Rattachés à un établissement (obligatoire à la création du compte)
export const PRISON_ROLES: Role[] = ["ADMIN_PRISON", "SUPERVISEUR_PRISON", "AGENT_PENITENTIAIRE", "PERSONNEL_SANTE"];
// Vue nationale en lecture seule
export const NATIONAL_READ_ONLY_ROLES: Role[] = ["REP_MIN_JUSTICE", "REP_MIN_INTERIEUR"];
// Acteurs judiciaires : détenus de leurs affectations actives (créées par le SUPER_ADMIN)
//   greffier : instruit les demandes de visite (étape 1) et seul saisit les décisions de justice ;
//   juge d'instruction (prévenus) / procureur (accusés) : décident les demandes transmises (étape 2) ;
//   avocat : lecture seule.
export const JUDICIAL_ROLES: Role[] = ["GREFFIER", "JUGE_INSTRUCTION", "PROCUREUR", "AVOCAT"];
export const MAGISTRATE_ROLES: Role[] = ["JUGE_INSTRUCTION", "PROCUREUR"];
// Périmètre = détenus liés (proche) ou affectés (acteurs judiciaires)
export const PRISONER_LINKED_ROLES: Role[] = ["PROCHE_REFERENT", ...JUDICIAL_ROLES];

export const isJudicialRole = (role: Role | null | undefined) => !!role && JUDICIAL_ROLES.includes(role);

export const roleRequiresPrison = (role: Role | null | undefined) => !!role && PRISON_ROLES.includes(role);
export const roleHasPrisonerLinks = (role: Role | null | undefined) => !!role && PRISONER_LINKED_ROLES.includes(role);

// ── Règles d'accès ─────────────────────────────────────────────────────────────────────────────
// perm : permission requise ; anyOf : au moins une ; roles : écrans sans ressource backend (maquettes),
// appliqué seulement quand le backend applique le RBAC (rbac_enforced).
export interface AccessRule {
  perm?: Permission;
  anyOf?: Permission[];
  roles?: Role[];
  // Rôles exigés même en mode observation : ressources que le backend applique toujours
  // (circuit judiciaire), alors que /me renvoie toutes les permissions en mode observation
  alwaysRoles?: Role[];
}

const MOCKUP: AccessRule = { roles: ["SUPER_ADMIN"] };

// Accès par route (clé = chemin déclaré dans AppRouter.tsx). Absente = route ouverte à tout compte actif.
export const ROUTE_ACCESS = {
  "/prison": { perm: "prisoners:read" },
  "/detenus": { perm: "prisoners:read" },
  "/detenus/:id": { perm: "prisoners:read" },
  "/detenus/new": { perm: "prisoners:create" },
  "/detenus/update/:id": { perm: "prisoners:update" },
  "/visits": { perm: "visits:read" },
  "/visits/:id": { perm: "visits:read" },
  "/visits/new": { perm: "visits:create" },
  "/visits/update/:id": { perm: "visits:update" },
  "/transfers": { anyOf: ["transfers:read", "exits:read"] },
  "/transfers/:id": { perm: "transfers:read" },
  "/transfers/new": { perm: "transfers:create" },
  "/transfers/update/:id": { perm: "transfers:update" },
  "/transfers/sorties/new": { perm: "exits:create" },
  "/transfers/sorties/update/:id": { perm: "exits:update" },
  "/incidents": { perm: "disciplinary_records:read" },
  "/incidents/new": { perm: "disciplinary_records:create" },
  "/incidents/update/:id": { perm: "disciplinary_records:update" },
  "/infirmerie": { perm: "health_records:read" },
  "/infirmerie/new": { perm: "health_records:create" },
  "/infirmerie/update/:id": { perm: "health_records:update" },
  "/users": { perm: "users:read" },
  "/proches": { perm: "relative_links:validate" },
  "/affectations": { perm: "judicial_assignments:read" },
  // Création : SUPER_ADMIN ; modification : SUPER_ADMIN ou ADMIN_PRISON (le sien)
  "/etablissements": { anyOf: ["prisons:create", "prisons:update"] },
  // Proche référent : ses demandes de visite (création = droit propre au proche)
  "/mes-demandes": { perm: "visit_requests:create" },
  "/mes-demandes/new": { perm: "visit_requests:create" },
  "/mes-demandes/:id": { perm: "visit_requests:create" },
  // Gestionnaires des demandes : acteur judiciaire (circuit judiciaire), AP / SP (circuit pénitentiaire)
  "/demandes": { anyOf: ["visit_requests:update", "visit_requests:validate"] },
  "/demandes/:id": { anyOf: ["visit_requests:update", "visit_requests:validate"] },
  // Permis : gestionnaires (révocation) et proche (ses permis) ; l'agent vérifie seulement
  "/permis": { anyOf: ["visit_permits:validate", "visit_requests:create"] },
  // Contrôle à l'entrée : AG, SP, AP de la prison du permis (le proche lit aussi visit_permits, d'où les rôles)
  "/verification-permis": {
    perm: "visit_permits:read",
    roles: ["AGENT_PENITENTIAIRE", "SUPERVISEUR_PRISON", "ADMIN_PRISON"],
  },
  "/decisions": { perm: "court_decisions:read" },
  // Saisie et correction des décisions : greffier affecté uniquement
  "/decisions/new": { perm: "court_decisions:create", alwaysRoles: ["GREFFIER"] },
  "/decisions/:id/correct": { perm: "court_decisions:update", alwaysRoles: ["GREFFIER"] },
  "/generic-dashboard": MOCKUP,
  "/pardons": MOCKUP,
  "/reinsertion": MOCKUP,
  "/transfers-releases": MOCKUP,
  "/reports": MOCKUP,
  "/security": MOCKUP,
  "/settings": MOCKUP,
} as const satisfies Record<string, AccessRule>;

export type RoutePath = keyof typeof ROUTE_ACCESS;

// ── Actions (boutons) ──────────────────────────────────────────────────────────────────────────
// Permission demandée par chaque action d'interface. Les conditions sur l'objet (statut, prison)
// restent dans les pages via <Can when={…}>.
export const ACTIONS = {
  "prisoner.create": "prisoners:create",
  "prisoner.update": "prisoners:update",
  "prisoner.delete": "prisoners:delete",
  "prisoner.release": "prisoners:validate",
  "visit.create": "visits:create",
  "visit.update": "visits:update",
  "visit.delete": "visits:delete",
  "transfer.create": "transfers:create",
  "transfer.update": "transfers:update",
  "transfer.delete": "transfers:delete",
  "transfer.decide": "transfers:validate",
  "transfer.receive": "transfers:complete",
  "exit.create": "exits:create",
  "exit.update": "exits:update",
  "exit.decide": "exits:validate",
  "incident.create": "disciplinary_records:create",
  "incident.update": "disciplinary_records:update",
  "incident.delete": "disciplinary_records:delete",
  "sanction.decide": "disciplinary_records:validate",
  "health.create": "health_records:create",
  "health.update": "health_records:update",
  "user.create": "users:create",
  "user.update": "users:update",
  "relative.decide": "relative_links:validate",
  "assignment.manage": "judicial_assignments:create",
  "prison.create": "prisons:create",
  "prison.update": "prisons:update",
  "visitRequest.create": "visit_requests:create",
  "visitRequest.instruct": "visit_requests:update",
  "visitRequest.decide": "visit_requests:validate",
  "permit.revoke": "visit_permits:validate",
  "permit.verify": "visit_permits:read",
  "decision.create": "court_decisions:create",
  "decision.correct": "court_decisions:update",
  "decision.applyEffect": "court_decisions:validate",
} as const satisfies Record<string, Permission>;

export type ActionName = keyof typeof ACTIONS;

// ── Accueil par rôle ───────────────────────────────────────────────────────────────────────────
// Rôles redirigés vers un écran dédié dès la connexion (les autres : HomePage décide)
export const HOME_REDIRECT: Partial<Record<Role, string>> = {
  PERSONNEL_SANTE: "/infirmerie",
};

// ── Écrans réservés par rôle ───────────────────────────────────────────────────────────────────
// Rôles limités à certains écrans, même s'ils ont d'autres droits de lecture côté API (le personnel de
// santé lit les détenus pour choisir un patient, mais n'a que l'Infirmerie). Préfixes de chemins ;
// rôle absent = pas de restriction. Affichage seulement : le backend garde ses propres règles.
export const ROLE_SCREENS: Partial<Record<Role, string[]>> = {
  PERSONNEL_SANTE: ["/infirmerie"],
};

export const isScreenAllowed = (role: Role | null | undefined, path: string): boolean => {
  const screens = role ? ROLE_SCREENS[role] : undefined;
  return !screens || screens.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};

// ── Statut du compte ───────────────────────────────────────────────────────────────────────────
// Codes 403 du backend qui concernent le compte lui-même (et non une action)
export const ACCOUNT_ERROR_CODES = {
  account_pending: "pending",
  account_rejected: "rejected",
  account_disabled: "disabled",
  account_not_configured: "not_configured",
  account_not_provisioned: "not_configured",
} as const;

export const ACCESS_MESSAGES: Record<string, { title: string; text: string }> = {
  pending: {
    title: "Compte en attente de validation",
    text: "Votre compte doit être validé par l'établissement avant de pouvoir utiliser l'application.",
  },
  rejected: {
    title: "Demande de compte refusée",
    text: "Votre demande de compte a été refusée. Rapprochez-vous de l'établissement pour plus d'informations.",
  },
  disabled: {
    title: "Compte désactivé",
    text: "Ce compte a été désactivé. Contactez votre administrateur.",
  },
  not_configured: {
    title: "Compte non configuré",
    text: "Aucun rôle ne vous a encore été attribué dans l'application. Contactez votre administrateur.",
  },
};

// ── Messages ───────────────────────────────────────────────────────────────────────────────────
export const FORBIDDEN_MESSAGE = "Vous n'avez pas les droits pour cette action.";
export const SESSION_EXPIRED_MESSAGE = "Votre session a expiré. Veuillez vous reconnecter.";
