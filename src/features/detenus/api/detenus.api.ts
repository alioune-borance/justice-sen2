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
  const { data } = await axiosInstance.get<Detenu[]>("api/prisoners/", { params });
  return data;
};


export const getDetenuById = async (id: number): Promise<Detenu> => {
  const { data } = await axiosInstance.get<Detenu>(`api/prisoners/${id}/`);
  console.log("Fetched detenu data:", data);
  return data;
}


export const addNewDetenu = async (detenuData: Omit<Detenu, 'id'>): Promise<Detenu> => {
  const { data } = await axiosInstance.post<Detenu>('api/prisoners/', detenuData);
  return data;
};

// Update detenu - accept partial data
export const updateDetenu = async (id: number, detenuData: Partial<Omit<Detenu, 'id'>>): Promise<Detenu> => {
  const { data } = await axiosInstance.put<Detenu>(`api/prisoners/${id}/`, detenuData);
  return data;
};
