import { axiosInstance } from "../../../shared/api/axiosInstance";
import { CreateTransfertDto, Transfert, UpdateTransfertDto } from "../types/transfert";

type Params = {
  page?: number;
  size?: number;
  search?: string;
};

export const getTransferts = async (
  params?: Params
): Promise<Transfert[]> => {  // Changed to return array directly
  const { data } = await axiosInstance.get<Transfert[]>("transfers/", { params });
  return data;
};

export const getTransfertById = async (id: number): Promise<Transfert> => {
    const { data } = await axiosInstance.get<Transfert>(`transfers/${id}/`);
    return data;
}

export const addNewTransfert = async (TransfertData: CreateTransfertDto): Promise<Transfert> => {
  const { data } = await axiosInstance.post<Transfert>('transfers/', TransfertData);
  return data;
};

// Update Transfert - accept partial data
export const updateTransfert = async (id: number, TransfertData: UpdateTransfertDto): Promise<Transfert> => {
  const { data } = await axiosInstance.put<Transfert>(`transfers/${id}/`, TransfertData);
  return data;
};  
// Actions du circuit de validation (backend : droits et périmètre vérifiés côté serveur)
// approve / reject : prison source (SUPERVISEUR, ADMIN) ; complete : arrivée, prison de destination
export type TransfertAction = "approve" | "reject" | "complete";

export const decideTransfert = async (id: number, action: TransfertAction, reason?: string): Promise<Transfert> => {
  const { data } = await axiosInstance.post<Transfert>(`transfers/${id}/${action}/`, reason ? { reason } : {});
  return data;
};
