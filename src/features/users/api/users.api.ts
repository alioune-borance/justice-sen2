import { axiosInstance } from "../../../shared/api/axiosInstance";
import { AppUser, CreateUserDto, UpdateUserDto } from "../types/user";

export type UsersFilters = { role?: string; prison?: number; account_status?: string; search?: string };

// Périmètre appliqué par le backend : tout (SUPER_ADMIN) ou sa prison (ADMIN_PRISON)
export const getUsers = async (filters?: UsersFilters): Promise<AppUser[]> => {
  const { data } = await axiosInstance.get<AppUser[]>("users/", { params: filters });
  return data;
};

export const createUser = async (payload: CreateUserDto): Promise<AppUser & { activation_email_sent?: boolean }> => {
  const { data } = await axiosInstance.post("users/", payload);
  return data;
};

export const updateUser = async (id: number, payload: UpdateUserDto): Promise<AppUser> => {
  const { data } = await axiosInstance.patch<AppUser>(`users/${id}/`, payload);
  return data;
};

// Pas de suppression : désactivation (le compte Keycloak suit)
export const setUserActive = async (id: number, active: boolean): Promise<AppUser> => {
  const { data } = await axiosInstance.post<AppUser>(`users/${id}/${active ? "reactivate" : "deactivate"}/`, {});
  return data;
};
