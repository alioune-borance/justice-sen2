import { axiosInstance } from "../../../shared/api/axiosInstance";
import { CreatePrisonDto, Prison, UpdatePrisonDto } from "../types/prison";

type PrisonsParams = {
  page?: number;
  size?: number;
  search?: string;
};

export const getPrisons = async (
  params?: PrisonsParams
): Promise<Prison[]> => {  // Changed to return array directly
  const { data } = await axiosInstance.get<Prison[]>("prison/", { params });
  return data;
};


export const getPrisonById = async (id: number): Promise<Prison> => {
  const { data } = await axiosInstance.get<Prison>(`prison/${id}/`);
  return data;
}

// SUPER_ADMIN uniquement (403 sinon)
export const createPrison = async (payload: CreatePrisonDto): Promise<Prison> => {
  const { data } = await axiosInstance.post<Prison>("prison/", payload);
  return data;
};

// SUPER_ADMIN, ou ADMIN_PRISON pour son propre établissement
export const updatePrison = async (id: number, payload: UpdatePrisonDto): Promise<Prison> => {
  const { data } = await axiosInstance.patch<Prison>(`prison/${id}/`, payload);
  return data;
};
