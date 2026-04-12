import { axiosInstance } from "../../../shared/api/axiosInstance";
import { Visite } from "../types/visite";
import { Visitor } from "../types/visitor";

type Params = {
  page?: number;
  size?: number;
  search?: string;
};

export const getVisites = async (
  params?: Params
): Promise<Visite[]> => {  // Changed to return array directly
  const { data } = await axiosInstance.get<Visite[]>("visits/", { params });
  console.log(data)
  return data;
};

export const getVisiteById = async (id: number): Promise<Visite> => {   
    const { data } = await axiosInstance.get<Visite>(`visits/${id}/`); 
    return data;
}

export const addNewVisite = async (visiteData: Omit<Visite, 'id'>): Promise<Visite> => {
  const { data } = await axiosInstance.post<Visite>('visits/', visiteData);
  return data;
};

// Update visite - accept partial data
export const updateVisite = async (id: number, visiteData: Partial<Omit<Visite, 'id'>>): Promise<Visite> => {
  const { data } = await axiosInstance.put<Visite>(`visits/${id}/`, visiteData);
  return data;
};  

export const getVisitors = async (
  params?: Params
): Promise<Visitor[]> => {  // Changed to return array directly
  const { data } = await axiosInstance.get<Visitor[]>("visitors/", { params });
  return data;
};

export const addNewVisitor = async (visitorData: Omit<Visitor, 'id'>): Promise<Visitor> => {
  const { data } = await axiosInstance.post<Visitor>('visitors/', visitorData);
  return data;
};