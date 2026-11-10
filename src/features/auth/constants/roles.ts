import { Role } from "../types/user.types";

export const PRISON_ROLES: Role[] = [
  "ADMIN_PRISON",
  "SUPERVISEUR_PRISON",
  "AGENT_PENITENTIAIRE",
  "PERSONNEL_SANTE",
];

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
