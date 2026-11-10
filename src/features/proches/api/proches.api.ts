import { axiosInstance } from "../../../shared/api/axiosInstance";
import { ensureCsrfToken } from "../../auth/api/auth.api";
import { LienAction, LienProche, PieceJustificative, RegisterForm } from "../types/proche";

// File de validation de la prison (famille directe en tête) ou demandes du proche lui-même
export const getLiens = async (params?: { statut?: string; a_rapprocher?: boolean }): Promise<LienProche[]> => {
  const { data } = await axiosInstance.get<LienProche[]>("relative-links/", {
    params: { statut: params?.statut || undefined, a_rapprocher: params?.a_rapprocher ? 1 : undefined },
  });
  return data;
};

export const decideLien = async (id: number, action: LienAction, motif?: string): Promise<LienProche> => {
  const { data } = await axiosInstance.post<LienProche>(`relative-links/${id}/${action}/`, motif ? { motif } : {});
  return data;
};

// Rattachement manuel d'une demande à un détenu de sa prison
export const matchLien = async (id: number, detenu: number): Promise<LienProche> => {
  const { data } = await axiosInstance.post<LienProche>(`relative-links/${id}/match/`, { detenu });
  return data;
};

export const reviewPiece = async (id: number, statut: "CONFORME" | "NON_CONFORME", commentaire = "") => {
  const { data } = await axiosInstance.post<PieceJustificative>(`relative-documents/${id}/review/`, {
    statut,
    commentaire,
  });
  return data;
};

// Dépôt d'une pièce par le proche (y compris compte en attente)
export const uploadPiece = async (payload: { type: string; fichier: File; lien?: number | null; date_expiration?: string }) => {
  const form = new FormData();
  form.append("type", payload.type);
  form.append("fichier", payload.fichier);
  if (payload.lien) form.append("lien", String(payload.lien));
  if (payload.date_expiration) form.append("date_expiration", payload.date_expiration);
  const { data } = await axiosInstance.post<PieceJustificative>("relative-documents/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// Téléchargement authentifié (jamais d'URL media publique) ; chaque téléchargement est journalisé
export const downloadPiece = async (piece: PieceJustificative): Promise<void> => {
  const response = await axiosInstance.get<Blob>(`relative-documents/${piece.id}/download/`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = piece.nom_original || `piece-${piece.id}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// Inscription publique d'un proche (multipart). Réponse volontairement neutre.
export const registerRelative = async (form: RegisterForm): Promise<{ message: string }> => {
  await ensureCsrfToken();
  const body = new FormData();
  (["username", "email", "first_name", "last_name", "phone_number", "national_id", "piece_expiration", "password"] as const)
    .forEach((key) => body.append(key, form[key]));
  if (form.piece_identite) body.append("piece_identite", form.piece_identite);
  if (form.photo_1) body.append("photo_1", form.photo_1);
  if (form.photo_2) body.append("photo_2", form.photo_2);
  body.append(
    "liens",
    JSON.stringify(
      form.liens.map(({ nom_complet_detenu, date_naissance_detenu, prison, lien_parente, motivation }) => ({
        nom_complet_detenu,
        date_naissance_detenu: date_naissance_detenu || null,
        prison,
        lien_parente,
        motivation,
      }))
    )
  );
  form.liens.forEach((lien, index) => {
    if (lien.justificatif) body.append(`justificatif_${index}`, lien.justificatif);
  });
  const { data } = await axiosInstance.post<{ message: string }>("auth/register/", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
