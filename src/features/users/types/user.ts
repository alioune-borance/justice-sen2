import { Role } from "../../auth/types/user.types";

// Compte renvoyé par GET users/ (gestion des utilisateurs)
export interface AppUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  role: Role | null;
  role_label: string | null;
  prison: number | null;
  prison_name: string | null;
  account_status: "PENDING" | "ACTIVE" | "REJECTED" | "DISABLED" | null;
  keycloak_sync_status: string | null;
  phone_number: string;
  national_id: string;
}

export interface RelativeLinkInput {
  detenu: number;
  lien_parente: string;
  motivation?: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  prison?: number | null;
  phone_number?: string;
  national_id?: string;
  // Proche référent créé par un administrateur : ses détenus
  links?: RelativeLinkInput[];
  // Uniquement en développement (LOCAL_AUTH) ; sinon email d'activation Keycloak
  password?: string;
}

export interface UpdateUserDto {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: Role;
  prison?: number | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN_PRISON: "Administrateur de prison",
  SUPERVISEUR_PRISON: "Superviseur de prison",
  AGENT_PENITENTIAIRE: "Agent pénitentiaire",
  PERSONNEL_SANTE: "Personnel de santé",
  PROCHE_REFERENT: "Proche référent",
  REP_MIN_JUSTICE: "Représentant du ministère de la Justice",
  REP_MIN_INTERIEUR: "Représentant du ministère de l'Intérieur",
  ACTEUR_JUDICIAIRE: "Acteur judiciaire",
};

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  REJECTED: "Refusé",
  DISABLED: "Désactivé",
};

export const PRISON_ROLES_LIST: Role[] = ["ADMIN_PRISON", "SUPERVISEUR_PRISON", "AGENT_PENITENTIAIRE", "PERSONNEL_SANTE"];

// Rôles attribuables : fournis par le backend (GET auth/me/ → assignable_roles), plus de liste en dur ici.
