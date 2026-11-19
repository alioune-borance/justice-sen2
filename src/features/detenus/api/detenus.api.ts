import { axiosInstance } from "../../../shared/api/axiosInstance";
import { Detenu } from "../../../features/detenus/types/detenu";

type DetenusParams = {
  page?: number;
  size?: number;
  search?: string;
};

export const getDetenus = async (
  params?: DetenusParams
): Promise<Detenu[]> => {  // Changed to return array directly
  const { data } = await axiosInstance.get<Detenu[]>("prisoners/", { params });
  return data;
};


export const getDetenuById = async (id: number): Promise<Detenu> => {
  const { data } = await axiosInstance.get<Detenu>(`prisoners/${id}/`);
  return data;
}

// Libération validée par un SUPERVISEUR ou un ADMIN de la prison (backend : POST prisoners/{id}/release/)
export const releaseDetenu = async (id: number, release_date?: string): Promise<Detenu> => {
  const { data } = await axiosInstance.post<Detenu>(`prisoners/${id}/release/`, release_date ? { release_date } : {});
  return data;
};


export const addNewDetenu = async (detenuData: Omit<Detenu, 'id'>): Promise<Detenu> => {
  const { data } = await axiosInstance.post<Detenu>('prisoners/', detenuData);
  return data;
};

// Update detenu - accept partial data
export const updateDetenu = async (id: number, detenuData: Partial<Omit<Detenu, 'id'>>): Promise<Detenu> => {
  const { data } = await axiosInstance.put<Detenu>(`prisoners/${id}/`, detenuData);
  return data;
};
