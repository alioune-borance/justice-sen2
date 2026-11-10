import { axiosInstance } from "../../../shared/api/axiosInstance";
import { downloadFile, MULTIPART } from "../../../shared/api/download";
import {
  CreateDemandeDto,
  DemandeFilters,
  DemandeVisite,
  PieceDemande,
  StatutPieceDemande,
  TypePieceDemande,
} from "../types/demande";

// Périmètre appliqué par le backend : ses demandes (proche), son circuit (acteur judiciaire, prison)
export const getDemandes = async (filters?: DemandeFilters): Promise<DemandeVisite[]> => {
  const { data } = await axiosInstance.get<DemandeVisite[]>("visit-requests/", {
    params: {
      statut: filters?.statut || undefined,
      circuit: filters?.circuit || undefined,
      detenu: filters?.detenu || undefined,
      sans_gestionnaire: filters?.sans_gestionnaire ? 1 : undefined,
    },
  });
  return data;
};

export const getDemande = async (id: number): Promise<DemandeVisite> => {
  const { data } = await axiosInstance.get<DemandeVisite>(`visit-requests/${id}/`);
  return data;
};

// --- Proche ------------------------------------------------------------------------------------
export const createDemande = async (dto: CreateDemandeDto): Promise<DemandeVisite> => {
  const form = new FormData();
  form.append("lien", String(dto.lien));
  form.append("date_souhaitee_debut", dto.date_souhaitee_debut);
  if (dto.date_souhaitee_fin) form.append("date_souhaitee_fin", dto.date_souhaitee_fin);
  if (dto.message) form.append("message", dto.message);
  form.append("visiteurs_supplementaires", JSON.stringify(dto.visiteurs_supplementaires));
  Object.entries(dto.fichiers).forEach(([field, file]) => {
    if (file) form.append(field, file);
  });
  const { data } = await axiosInstance.post<DemandeVisite>("visit-requests/", form, MULTIPART);
  return data;
};

export const addPieceDemande = async (id: number, type: TypePieceDemande, fichier: File): Promise<PieceDemande> => {
  const form = new FormData();
  form.append("type", type);
  form.append("fichier", fichier);
  const { data } = await axiosInstance.post<PieceDemande>(`visit-requests/${id}/documents/`, form, MULTIPART);
  return data;
};

// --- Transitions (proche : resubmit ; gestionnaires : take, request-documents, validate, reject) ---
export type DemandeAction = "take" | "validate" | "reject" | "request-documents" | "resubmit";

export const postDemandeAction = async (
  id: number,
  action: DemandeAction,
  body: Record<string, string> = {}
): Promise<DemandeVisite> => {
  const { data } = await axiosInstance.post<DemandeVisite>(`visit-requests/${id}/${action}/`, body);
  return data;
};

export const reviewPieceDemande = async (
  pieceId: number,
  statut: Exclude<StatutPieceDemande, "A_VERIFIER">,
  commentaire = ""
): Promise<PieceDemande> => {
  const { data } = await axiosInstance.post<PieceDemande>(`visit-request-documents/${pieceId}/review/`, {
    statut,
    commentaire,
  });
  return data;
};

export const downloadPieceDemande = (piece: PieceDemande) =>
  downloadFile(`visit-request-documents/${piece.id}/download/`, piece.nom_original || `piece-${piece.id}`);
