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
  ADMIN_JUDICIAIRE: "ADMIN_JUDICIAIRE",
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
  ADMIN_JUDICIAIRE: "Administrateur judiciaire",
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
// Affectent les détenus aux acteurs judiciaires (création, fin d'affectation ; jamais de suppression).
// L'ADMIN_JUDICIAIRE est national, sans établissement ; il ne lit que les détenus (identité), l'annuaire
// des prisons et les comptes judiciaires.
export const JUDICIAL_ASSIGNMENT_MANAGERS: Role[] = ["SUPER_ADMIN", "ADMIN_JUDICIAIRE"];
// Acteurs judiciaires : détenus de leurs affectations actives (créées par le SUPER_ADMIN ou l'ADMIN_JUDICIAIRE)
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
  // Rôles exclus de l'écran, même en mode observation (affichage seulement : le backend garde ses règles)
  exceptRoles?: Role[];
}

const MOCKUP: AccessRule = { roles: ["SUPER_ADMIN"] };

// Acteurs directs de la prison : seuls à voir les écrans Visites, Transferts et Sorties
// (affichage, même en mode observation ; le backend garde ses propres règles d'accès)
export const PRISON_OPERATIONS_ROLES: Role[] = ["AGENT_PENITENTIAIRE", "ADMIN_PRISON", "SUPERVISEUR_PRISON"];
const ops = (rule: AccessRule): AccessRule => ({ ...rule, alwaysRoles: PRISON_OPERATIONS_ROLES });

// Gestion des affectations judiciaires (création, fin) : permission ET rôle, car /me accorde tout en
// mode observation ; les acteurs judiciaires ne font que lire les leurs
export const ASSIGNMENT_MANAGEMENT: AccessRule = {
  perm: "judicial_assignments:create",
  alwaysRoles: JUDICIAL_ASSIGNMENT_MANAGERS,
};

// Cantine : AP et SP voient catalogue, plafonds et comptes de leur prison (l'AP seul les modifie) ;
// AP, SP et AG préparent et livrent les commandes de leur prison (depuis le 2026-11-18)
export const CANTEEN_STAFF_ROLES: Role[] = ["ADMIN_PRISON", "SUPERVISEUR_PRISON"];
export const CANTEEN_ORDER_HANDLERS: Role[] = ["ADMIN_PRISON", "SUPERVISEUR_PRISON", "AGENT_PENITENTIAIRE"];

// Direction de la prison (AP, SP) : ni « Mes demandes de visite » (écran du proche) ni « Décisions de justice »
// (l'effet proposé d'une décision s'applique depuis la fiche du détenu)
export const PRISON_MANAGEMENT_ROLES: Role[] = ["ADMIN_PRISON", "SUPERVISEUR_PRISON"];

// Écrans retirés à l'agent pénitentiaire (affichage, même en mode observation) : demandes de visite, permis,
// décisions, proches, comptes, affectations, établissements. Il garde la vérification des permis.
const AG: Role[] = ["AGENT_PENITENTIAIRE"];
const notForAgent = (rule: AccessRule, others: Role[] = []): AccessRule => ({ ...rule, exceptRoles: [...AG, ...others] });

// Établissements : permission ET rôle, car /me accorde tout en mode observation. Seul le SUPER_ADMIN en
// ajoute ; l'AP et le SP modifient le leur (avec isMyPrison), le SUPER_ADMIN tous
export const PRISON_ACTIONS = {
  create: { perm: "prisons:create", alwaysRoles: ["SUPER_ADMIN"] },
  update: { perm: "prisons:update", alwaysRoles: ["SUPER_ADMIN", ...PRISON_MANAGEMENT_ROLES] },
} as const satisfies Record<string, AccessRule>;

// Actions cantine : permission ET rôle, car /me accorde tout en mode observation alors que le backend
// applique toujours ces droits (boutons via allows(CANTEEN_ACTIONS.x), avec isMyPrison si besoin)
export const CANTEEN_ACTIONS = {
  manageCatalogue: { perm: "canteen_products:update", alwaysRoles: ["ADMIN_PRISON"] },
  manageLimits: { perm: "canteen_limits:update", alwaysRoles: ["ADMIN_PRISON"] },
  handleOrders: { perm: "canteen_orders:complete", alwaysRoles: CANTEEN_ORDER_HANDLERS },
  order: { perm: "canteen_orders:create", alwaysRoles: ["PROCHE_REFERENT"] },
  deposit: { perm: "money_deposits:create", alwaysRoles: ["PROCHE_REFERENT"] },
} as const satisfies Record<string, AccessRule>;

// Accès par route (clé = chemin déclaré dans AppRouter.tsx). Absente = route ouverte à tout compte actif.
export const ROUTE_ACCESS = {
  "/prison": { perm: "prisoners:read" },
  "/detenus": { perm: "prisoners:read" },
  "/detenus/:id": { perm: "prisoners:read" },
  "/detenus/new": { perm: "prisoners:create" },
  "/detenus/update/:id": { perm: "prisoners:update" },
  "/visits": ops({ perm: "visits:read" }),
  "/visits/:id": ops({ perm: "visits:read" }),
  "/visits/new": ops({ perm: "visits:create" }),
  "/visits/update/:id": ops({ perm: "visits:update" }),
  "/transfers": ops({ anyOf: ["transfers:read", "exits:read"] }),
  "/transfers/:id": ops({ perm: "transfers:read" }),
  "/transfers/new": ops({ perm: "transfers:create" }),
  "/transfers/update/:id": ops({ perm: "transfers:update" }),
  "/transfers/sorties/new": ops({ perm: "exits:create" }),
  "/transfers/sorties/update/:id": ops({ perm: "exits:update" }),
  "/incidents": { perm: "disciplinary_records:read" },
  "/incidents/new": { perm: "disciplinary_records:create" },
  "/incidents/update/:id": { perm: "disciplinary_records:update" },
  // Personnel de santé : dossiers médicaux ; AP / SP : activité de l'infirmerie sans donnée médicale
  // (health_activity, appliqué par le backend même en mode observation, d'où alwaysRoles)
  "/infirmerie": {
    anyOf: ["health_records:read", "health_activity:read"],
    alwaysRoles: ["PERSONNEL_SANTE", ...PRISON_MANAGEMENT_ROLES],
  },
  "/infirmerie/new": { perm: "health_records:create" },
  "/infirmerie/update/:id": { perm: "health_records:update" },
  "/users": notForAgent({ perm: "users:read" }),
  "/proches": notForAgent({ perm: "relative_links:validate" }),
  "/affectations": notForAgent({ perm: "judicial_assignments:read" }),
  // Création : SUPER_ADMIN ; modification : SUPER_ADMIN, ADMIN_PRISON ou SUPERVISEUR_PRISON (le sien)
  "/etablissements": notForAgent({ anyOf: ["prisons:create", "prisons:update"] }),
  // Proche référent : ses demandes de visite (création = droit propre au proche)
  "/mes-demandes": notForAgent({ perm: "visit_requests:create" }, PRISON_MANAGEMENT_ROLES),
  "/mes-demandes/new": notForAgent({ perm: "visit_requests:create" }, PRISON_MANAGEMENT_ROLES),
  "/mes-demandes/:id": notForAgent({ perm: "visit_requests:create" }, PRISON_MANAGEMENT_ROLES),
  // Gestionnaires des demandes : acteur judiciaire (circuit judiciaire), AP / SP (circuit pénitentiaire)
  "/demandes": notForAgent({ anyOf: ["visit_requests:update", "visit_requests:validate"] }),
  "/demandes/:id": notForAgent({ anyOf: ["visit_requests:update", "visit_requests:validate"] }),
  // Permis : gestionnaires (révocation) et proche (ses permis) ; l'agent vérifie seulement
  "/permis": notForAgent({ anyOf: ["visit_permits:validate", "visit_requests:create"] }),
  // Contrôle à l'entrée : AG, SP, AP de la prison du permis (le proche lit aussi visit_permits, d'où les rôles)
  "/verification-permis": {
    perm: "visit_permits:read",
    roles: ["AGENT_PENITENTIAIRE", "SUPERVISEUR_PRISON", "ADMIN_PRISON"],
  },
  "/decisions": notForAgent({ perm: "court_decisions:read" }, PRISON_MANAGEMENT_ROLES),
  // Saisie et correction des décisions : greffier affecté uniquement
  "/decisions/new": { perm: "court_decisions:create", alwaysRoles: ["GREFFIER"] },
  "/decisions/:id/correct": { perm: "court_decisions:update", alwaysRoles: ["GREFFIER"] },
  // Compte argent et cantine (backend toujours appliqué, jamais SA ni ministères) : alwaysRoles
  "/compte-detenu": { perm: "money_accounts:read", alwaysRoles: ["PROCHE_REFERENT"] },
  "/cantine": { perm: "canteen_orders:create", alwaysRoles: ["PROCHE_REFERENT"] },
  "/cantine/commandes": { perm: "canteen_orders:create", alwaysRoles: ["PROCHE_REFERENT"] },
  "/cantine/preparation": { perm: "canteen_orders:complete", alwaysRoles: CANTEEN_ORDER_HANDLERS },
  "/cantine/catalogue": { perm: "canteen_products:read", alwaysRoles: CANTEEN_STAFF_ROLES },
  "/cantine/plafonds": { perm: "canteen_limits:read", alwaysRoles: CANTEEN_STAFF_ROLES },
  "/comptes": { perm: "money_accounts:read", alwaysRoles: CANTEEN_STAFF_ROLES },
  // Tableaux de bord nationaux : chaque ministère le sien, plus le SUPER_ADMIN ; appliqué par le backend
  // même en mode observation, d'où alwaysRoles
  "/statistiques/justice": { perm: "stats_justice:read", alwaysRoles: ["REP_MIN_JUSTICE", "SUPER_ADMIN"] },
  "/statistiques/interieur": { perm: "stats_interieur:read", alwaysRoles: ["REP_MIN_INTERIEUR", "SUPER_ADMIN"] },
  // Ses propres notifications : tous les rôles (backend toujours appliqué)
  "/notifications": { perm: "notifications:read" },
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
  ADMIN_JUDICIAIRE: "/affectations",
};

// ── Écrans réservés par rôle ───────────────────────────────────────────────────────────────────
// Rôles limités à certains écrans, même s'ils ont d'autres droits de lecture côté API (le personnel de
// santé lit les détenus pour choisir un patient, mais n'a que l'Infirmerie). Préfixes de chemins ;
// rôle absent = pas de restriction. Affichage seulement : le backend garde ses propres règles.
export const ROLE_SCREENS: Partial<Record<Role, string[]>> = {
  // "/notifications" : ouvert à tous les rôles (chacun ses notifications)
  PERSONNEL_SANTE: ["/infirmerie", "/notifications"],
  // Proche référent : accueil « Mes détenus », ses demandes de visite et permis, compte et cantine de ses
  // détenus, décisions de justice de ses détenus (depuis le 2026-11-16), notifications. "/cantine" couvre aussi
  // les écrans du personnel, fermés au proche par leurs alwaysRoles.
  PROCHE_REFERENT: ["/", "/mes-demandes", "/permis", "/compte-detenu", "/cantine", "/decisions", "/notifications"],
  // Seul écran de l'administrateur judiciaire : les affectations (il y choisit détenus et acteurs)
  ADMIN_JUDICIAIRE: ["/affectations", "/notifications"],
  // Ministères : leur seul tableau de bord national, affiché à l'accueil (HomePage) ; aucun autre écran
  REP_MIN_JUSTICE: ["/", "/statistiques/justice", "/notifications"],
  REP_MIN_INTERIEUR: ["/", "/statistiques/interieur", "/notifications"],
  // Acteurs judiciaires (2026-11-17) : accueil « Mes détenus », demandes de visite à traiter, décisions de justice
  // (saisie : greffier seul, par l'alwaysRoles de /decisions/new), affectations judiciaires, notifications
  ...Object.fromEntries(
    JUDICIAL_ROLES.map((role) => [role, ["/", "/demandes", "/decisions", "/affectations", "/notifications"]])
  ),
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
