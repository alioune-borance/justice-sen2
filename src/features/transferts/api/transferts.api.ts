import { axiosInstance } from "../../../shared/api/axiosInstance";
import { Transfert } from "../types/transfert";

type Params = {
  page?: number;
  size?: number;
  search?: string;
};

export const getTransferts = async (
  params?: Params
): Promise<Transfert[]> => {  // Changed to return array directly
  const { data } = await axiosInstance.get<Transfert[]>("api/transfers/", { params });
  return data;
};

export const getTransfertById = async (id: number): Promise<Transfert> => {   
  console.log(id);
    const { data } = await axiosInstance.get<Transfert>(`api/transfers/${id}/`); 
    console.log("Fetched transfert data:", data);
    return data;
}

export const addNewTransfert = async (TransfertData: Omit<Transfert, 'id'>): Promise<Transfert> => {
  const { data } = await axiosInstance.post<Transfert>('api/transfers/', TransfertData);
  return data;
};

// Update Transfert - accept partial data
export const updateTransfert = async (id: number, TransfertData: Partial<Omit<Transfert, 'id'>>): Promise<Transfert> => {
  const { data } = await axiosInstance.put<Transfert>(`api/transfers/${id}/`, TransfertData);
  return data;
};  