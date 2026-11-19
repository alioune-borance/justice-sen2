import { create } from "zustand";
import { AccessStatus, User } from "../types/user.types";

// Tout reste en mémoire (aucun persist / localStorage) : le refresh token vit dans un cookie HttpOnly.
export interface AuthState {
  accessToken: string | null;
  user: User | null;
  csrfToken: string | null;
  setAuth: (token: string, user: User) => void;
  setAccessToken: (token: string) => void;
  setCsrfToken: (token: string | null) => void;
  // Le backend a refusé le compte (403 account_*) : la page « Mon compte » prend le relais
  setAccess: (access: AccessStatus) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  csrfToken: null,

  setAuth: (token, user) =>
    set({ accessToken: token, user }),

  setAccessToken: (token) =>
    set({ accessToken: token }),

  setCsrfToken: (token) =>
    set({ csrfToken: token }),

  setAccess: (access) =>
    set((state) => (state.user ? { user: { ...state.user, access } } : {})),

  // Le jeton CSRF reste valable après une déconnexion (il n'est pas lié à l'utilisateur)
  clearAuth: () =>
    set({ accessToken: null, user: null }),
}));
