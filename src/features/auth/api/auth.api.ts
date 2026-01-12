import { axiosInstance } from "../../../shared/api/axiosInstance";
import { LoginRequest, AuthResponse } from "../types/auth_types";

export const login = async (
  payload: LoginRequest
): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>(
    "api/auth/login/",
    payload,
    { withCredentials: true } // 🔴 IMPORTANT pour cookie refresh
  );
  return response.data;
};

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const response = await axiosInstance.post(
    "api/auth/refresh/",
    {},
    { withCredentials: true }
  );
  return response.data;
};
