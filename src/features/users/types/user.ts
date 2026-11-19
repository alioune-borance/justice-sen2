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

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  REJECTED: "Refusé",
  DISABLED: "Désactivé",
};

// Rôles attribuables : fournis par le backend (GET auth/me/ → assignable_roles).
// Libellés et rôles rattachés à un établissement : features/auth/config/rbac.ts.
