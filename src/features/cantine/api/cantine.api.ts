import { axiosInstance } from "../../../shared/api/axiosInstance";
import {
  CommandeAction,
  CommandeCantine,
  CompteArgent,
  CreateCommandeDto,
  CreateDepotDto,
  OperationCompte,
  PaiementDepot,
  PlafondsCantine,
  PlafondsInput,
  ProduitCantine,
  ProduitInput,
  StatutCommande,
  StatutPaiement,
  TypeOperation,
} from "../types/cantine";

// Périmètre appliqué par le backend (toujours, même en mode observation) :
// proche = ses détenus liés et ses propres dépôts / commandes ; AP, SP, AG = leur prison.

// --- Comptes et journal ----------------------------------------------------------------------
export const getComptes = async (filters?: { detenu?: number }): Promise<CompteArgent[]> => {
  const { data } = await axiosInstance.get<CompteArgent[]>("money-accounts/", {
    params: { detenu: filters?.detenu || undefined },
  });
  return data;
};

export const getOperations = async (filters: { compte?: number; detenu?: number; type?: TypeOperation }) => {
  const { data } = await axiosInstance.get<OperationCompte[]>("money-operations/", {
    params: { compte: filters.compte || undefined, detenu: filters.detenu || undefined, type: filters.type || undefined },
  });
  return data;
};

// --- Dépôts ----------------------------------------------------------------------------------
export const getDepots = async (filters?: { detenu?: number; statut?: StatutPaiement }) => {
  const { data } = await axiosInstance.get<PaiementDepot[]>("money-deposits/", {
    params: { detenu: filters?.detenu || undefined, statut: filters?.statut || undefined },
  });
  return data;
};

export const getDepot = async (id: number) => {
  const { data } = await axiosInstance.get<PaiementDepot>(`money-deposits/${id}/`);
  return data;
};

export const createDepot = async (dto: CreateDepotDto) => {
  const { data } = await axiosInstance.post<PaiementDepot>("money-deposits/", dto);
  return data;
};

// --- Catalogue -------------------------------------------------------------------------------
export const getProduits = async (filters?: { prison?: number; actif?: boolean }) => {
  const { data } = await axiosInstance.get<ProduitCantine[]>("canteen-products/", {
    params: {
      prison: filters?.prison || undefined,
      actif: filters?.actif === undefined ? undefined : filters.actif ? 1 : 0,
    },
  });
  return data;
};

export const createProduit = async (dto: ProduitInput) => {
  const { data } = await axiosInstance.post<ProduitCantine>("canteen-products/", dto);
  return data;
};

export const updateProduit = async (id: number, dto: Partial<ProduitInput>) => {
  const { data } = await axiosInstance.patch<ProduitCantine>(`canteen-products/${id}/`, dto);
  return data;
};

// --- Plafonds --------------------------------------------------------------------------------
export const getPlafonds = async () => {
  const { data } = await axiosInstance.get<PlafondsCantine[]>("canteen-limits/");
  return data;
};

export const createPlafonds = async (dto: PlafondsInput) => {
  const { data } = await axiosInstance.post<PlafondsCantine>("canteen-limits/", dto);
  return data;
};

export const updatePlafonds = async (id: number, dto: PlafondsInput) => {
  const { data } = await axiosInstance.patch<PlafondsCantine>(`canteen-limits/${id}/`, dto);
  return data;
};

// --- Commandes -------------------------------------------------------------------------------
export const getCommandes = async (filters?: { detenu?: number; statut?: StatutCommande }) => {
  const { data } = await axiosInstance.get<CommandeCantine[]>("canteen-orders/", {
    params: { detenu: filters?.detenu || undefined, statut: filters?.statut || undefined },
  });
  return data;
};

export const createCommande = async (dto: CreateCommandeDto) => {
  const { data } = await axiosInstance.post<CommandeCantine>("canteen-orders/", dto);
  return data;
};

// prepare / deliver : AP, SP, AG ; cancel {motif} : le proche tant que EN_ATTENTE, AP / SP / AG jusqu'à la livraison
export const postCommandeAction = async (id: number, action: CommandeAction, motif?: string) => {
  const { data } = await axiosInstance.post<CommandeCantine>(
    `canteen-orders/${id}/${action}/`,
    action === "cancel" ? { motif } : {}
  );
  return data;
};
