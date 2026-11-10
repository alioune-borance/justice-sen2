import { axiosInstance } from "../../../shared/api/axiosInstance";
import { downloadFile } from "../../../shared/api/download";
import { PermisVisite, PermisResume, VerificationResponse } from "../types/permis";

export type PermisFilters = { detenu?: number; etat?: string };

// Périmètre appliqué par le backend : titulaire, gestionnaires du circuit, prison du permis
export const getPermis = async (filters?: PermisFilters): Promise<PermisVisite[]> => {
  const { data } = await axiosInstance.get<PermisVisite[]>("visit-permits/", { params: filters });
  return data;
};

export const downloadPermis = (permis: Pick<PermisResume, "id" | "numero">) =>
  downloadFile(`visit-permits/${permis.id}/download/`, `permis-${permis.numero}.pdf`);

export const revokePermis = async (id: number, motif: string): Promise<PermisVisite> => {
  const { data } = await axiosInstance.post<PermisVisite>(`visit-permits/${id}/revoke/`, { motif });
  return data;
};

// Contrôle à l'entrée : numéro (PV-AAAA-NNNNNN) ou code de vérification ; chaque contrôle est tracé
export const verifyPermis = async (saisie: string): Promise<VerificationResponse> => {
  const { data } = await axiosInstance.post<VerificationResponse>("visit-permits/verify/", { saisie });
  return data;
};
