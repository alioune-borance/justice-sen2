// Cycle de vie de la session : access token en mémoire, refresh par cookie HttpOnly.
import { queryClient } from "../../app/queryClient";
import { getMe, logout, refreshAccessToken } from "./api/auth.api";
import { useAuthStore } from "./store/auth.store";
import { User } from "./types/user.types";
import { decodeToken } from "./utils/decodeToken";
import { broadcastSession, onSessionMessage, withRefreshLock } from "./utils/sessionSync";

// Rafraîchit un peu avant l'expiration de l'access token (Keycloak : 5 min par défaut)
const REFRESH_MARGIN_MS = 30_000;
const MIN_REFRESH_DELAY_MS = 5_000;

let inflightRefresh: Promise<string> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let syncInitialized = false;

const clearRefreshTimer = () => {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
};

const scheduleProactiveRefresh = (token: string) => {
  clearRefreshTimer();
  const exp = decodeToken(token)?.exp;
  if (!exp) return; // jeton opaque (LOCAL_AUTH en dev) : refresh seulement sur 401

  const delay = Math.max(exp * 1000 - Date.now() - REFRESH_MARGIN_MS, MIN_REFRESH_DELAY_MS);
  refreshTimer = setTimeout(() => {
    refreshSession().catch(() => endLocalSession());
  }, delay);
};

const applyAccessToken = (token: string) => {
  useAuthStore.getState().setAccessToken(token);
  scheduleProactiveRefresh(token);
};

// Un seul refresh à la fois, dans cet onglet (promesse partagée) et entre onglets (verrou).
export const refreshSession = (): Promise<string> => {
  if (inflightRefresh) return inflightRefresh;

  const tokenBefore = useAuthStore.getState().accessToken;
  inflightRefresh = withRefreshLock(async () => {
    // Un autre onglet a rafraîchi pendant l'attente du verrou : on réutilise son jeton
    const current = useAuthStore.getState().accessToken;
    if (current && current !== tokenBefore) return current;

    const { access_token } = await refreshAccessToken();
    applyAccessToken(access_token);
    broadcastSession({ type: "token", accessToken: access_token });
    return access_token;
  }).finally(() => {
    inflightRefresh = null;
  });

  return inflightRefresh;
};

// Rôle, prison et permissions viennent du backend (base Django), jamais du JWT
const loadCurrentUser = (): Promise<User> => getMe();

// Après login ou refresh au chargement : jeton en mémoire + profil de l'utilisateur.
export const establishSession = async (token: string): Promise<void> => {
  applyAccessToken(token);
  const user = await loadCurrentUser();
  useAuthStore.getState().setAuth(useAuthStore.getState().accessToken ?? token, user);
};

// Efface la session de cet onglet uniquement (jeton, utilisateur, cache des requêtes).
export const endLocalSession = (): void => {
  clearRefreshTimer();
  useAuthStore.getState().clearAuth();
  queryClient.clear();
};

// Déconnexion complète : révocation côté serveur, puis tous les onglets.
export const logoutSession = async (): Promise<void> => {
  try {
    await logout();
  } catch {
    // La session locale est effacée même si le serveur est injoignable
  }
  endLocalSession();
  broadcastSession({ type: "logout" });
};

export const initSessionSync = (): void => {
  if (syncInitialized) return;
  syncInitialized = true;

  onSessionMessage((message) => {
    if (message.type === "logout") {
      endLocalSession();
    } else if (message.type === "token" && useAuthStore.getState().user) {
      applyAccessToken(message.accessToken);
    }
  });
};
