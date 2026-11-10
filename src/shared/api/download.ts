import { axiosInstance } from "./axiosInstance";

// Téléchargement authentifié d'un fichier privé (pièce, permis, décision) : jamais d'URL media publique.
// Chaque téléchargement est journalisé par le backend.
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  const response = await axiosInstance.get<Blob>(url, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

// Formats acceptés par le backend (type réel vérifié côté serveur par les premiers octets)
export const ACCEPTED_DOCUMENTS = ".pdf,.jpg,.jpeg,.png";
export const ACCEPTED_PDF = ".pdf";
