import { axiosInstance } from "../../../shared/api/axiosInstance";
import { Sortie } from "../types/sortie";

type Params = {
  page?: number;
  size?: number;
  search?: string;
};

export const getSorties = async (
  params?: Params
): Promise<Sortie[]> => {  // Changed to return array directly
  const { data } = await axiosInstance.get<Sortie[]>("exits/", { params });
  return data;
};

export const getSortieById = async (id: number): Promise<Sortie> => {   
    const { data } = await axiosInstance.get<Sortie>(`exits/${id}/`); 
    return data;
}

export const addNewSortie = async (SortieData: Omit<Sortie, 'id'>): Promise<Sortie> => {
  const { data } = await axiosInstance.post<Sortie>('exits/', SortieData);
  return data;
};

// Update Sortie - accept partial data
export const updateSortie = async (id: number, SortieData: Partial<Omit<Sortie, 'id'>>): Promise<Sortie> => {
  const { data } = await axiosInstance.put<Sortie>(`exits/${id}/`, SortieData);
  return data;
};  