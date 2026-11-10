import { axiosInstance } from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../store/auth.store";
import { AuthResponse, CsrfResponse, LoginRequest, MeResponse } from "../types/auth_types";

// Jeton CSRF exigé par login / refresh / logout, demandé une fois puis gardé en mémoire.
export const ensureCsrfToken = async (): Promise<string> => {
  const existing = useAuthStore.getState().csrfToken;
  if (existing) return existing;

  const { data } = await axiosInstance.get<CsrfResponse>("auth/csrf/");
  useAuthStore.getState().setCsrfToken(data.csrf_token);
  return data.csrf_token;
};

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  await ensureCsrfToken();
  const { data } = await axiosInstance.post<AuthResponse>("auth/login/", payload);
  return data;
};

// Le refresh token est lu par le backend dans le cookie HttpOnly : le corps est vide.
export const refreshAccessToken = async (): Promise<AuthResponse> => {
  await ensureCsrfToken();
  const { data } = await axiosInstance.post<AuthResponse>("auth/refresh/", {});
  return data;
};

export const logout = async (): Promise<void> => {
  await ensureCsrfToken();
  await axiosInstance.post("auth/logout/", {});
};

export const getMe = async (): Promise<MeResponse> => {
  const { data } = await axiosInstance.get<MeResponse>("auth/me/");
  return data;
};
