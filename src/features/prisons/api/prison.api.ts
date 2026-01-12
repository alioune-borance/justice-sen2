import { axiosInstance } from "../../../shared/api/axiosInstance";
import { Prison } from "../types/prison";

type PrisonsParams = {
  page?: number;
  size?: number;
  search?: string;
};

export const getPrisons = async (
  params?: PrisonsParams
): Promise<Prison[]> => {  // Changed to return array directly
  const { data } = await axiosInstance.get<Prison[]>("api/prison/", { params });
  return data;
};


export const getPrisonById = async (id: number): Promise<Prison> => {
  const { data } = await axiosInstance.get<Prison>(`api/prison/${id}/`);
  return data;
}
