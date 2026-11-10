import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { ensureCsrfToken } from "../../features/auth/api/auth.api";
import { endLocalSession, refreshSession } from "../../features/auth/session";
import { ACCOUNT_ERROR_CODES } from "../../features/auth/constants/roles";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Nécessaire pour envoyer et recevoir le cookie de refresh (HttpOnly)
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; _csrfRetry?: boolean };

// Endpoints du flux d'authentification : jamais de refresh automatique sur leur 401
const AUTH_FLOW_ENDPOINTS = ["auth/csrf/", "auth/login/", "auth/refresh/", "auth/logout/"];
const UNSAFE_METHODS = ["post", "put", "patch", "delete"];

const isAuthFlowRequest = (config?: InternalAxiosRequestConfig) =>
  AUTH_FLOW_ENDPOINTS.some((endpoint) => config?.url?.startsWith(endpoint));

// 🔹 Request interceptor : Bearer (mémoire) + X-CSRFToken sur les méthodes d'écriture
axiosInstance.interceptors.request.use((config) => {
  const { accessToken, csrfToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (csrfToken && UNSAFE_METHODS.includes((config.method ?? "get").toLowerCase())) {
    config.headers["X-CSRFToken"] = csrfToken;
  }

  return config;
});

// 🔹 Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    if (!originalRequest) return Promise.reject(error);

    // Jeton CSRF périmé (cookie effacé, etc.) : on en redemande un et on rejoue une fois
    if (
      error.response?.status === 403 &&
      error.response.data?.code === "csrf_failed" &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      useAuthStore.getState().setCsrfToken(null);
      await ensureCsrfToken();
      return axiosInstance(originalRequest);
    }

    // Le compte lui-même est refusé (en attente, sans rôle…) : la page « Mon compte » prend le relais.
    // Les autres 403 (action non autorisée) sont simplement renvoyés à la page appelante.
    const code = error.response?.data?.code;
    if (error.response?.status === 403 && code && code in ACCOUNT_ERROR_CODES) {
      useAuthStore.getState().setAccess(ACCOUNT_ERROR_CODES[code as keyof typeof ACCOUNT_ERROR_CODES]);
      return Promise.reject(error);
    }

    // Access token expiré : refresh via le cookie puis on rejoue la requête une fois.
    // Un 403 (droits insuffisants) ne déclenche jamais de refresh ni de déconnexion.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthFlowRequest(originalRequest) &&
      useAuthStore.getState().accessToken
    ) {
      originalRequest._retry = true;
      try {
        await refreshSession();
      } catch (refreshError) {
        endLocalSession();
        return Promise.reject(refreshError);
      }
      // Le request interceptor reposera le nouvel access token
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);
