import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommande,
  createDepot,
  createPlafonds,
  createProduit,
  getCommandes,
  getComptes,
  getDepot,
  getDepots,
  getOperations,
  getPlafonds,
  getProduits,
  postCommandeAction,
  updatePlafonds,
  updateProduit,
} from "./cantine.api";
import {
  CommandeAction,
  PlafondsInput,
  ProduitInput,
  StatutCommande,
  StatutPaiement,
  TypeOperation,
} from "../types/cantine";

// Toutes les clés commencent par "cantine" : une écriture (dépôt, commande, annulation…) change
// solde, journal, plafonds et stock à la fois, on invalide donc tout le domaine.
const ROOT = "cantine";
const STALE = 30 * 1000;
type Opts = { enabled?: boolean };

const useInvalidateCantine = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [ROOT] });
};

// --- Lectures --------------------------------------------------------------------------------
export const useComptes = (filters?: { detenu?: number }, options?: Opts) =>
  useQuery({
    queryKey: [ROOT, "comptes", filters ?? {}],
    queryFn: () => getComptes(filters),
    staleTime: STALE,
    enabled: options?.enabled ?? true,
  });

export const useOperations = (filters: { compte?: number; detenu?: number; type?: TypeOperation }, options?: Opts) =>
  useQuery({
    queryKey: [ROOT, "operations", filters],
    queryFn: () => getOperations(filters),
    staleTime: STALE,
    enabled: (options?.enabled ?? true) && !!(filters.compte || filters.detenu),
  });

export const useDepots = (filters?: { detenu?: number; statut?: StatutPaiement }, options?: Opts) =>
  useQuery({
    queryKey: [ROOT, "depots", filters ?? {}],
    queryFn: () => getDepots(filters),
    staleTime: STALE,
    enabled: options?.enabled ?? true,
  });

// Suivi d'un dépôt après sa création : relu toutes les 4 s tant que le paiement est en attente.
// Le crédit du compte est fait par le backend à la notification de l'opérateur, jamais ici.
export const useDepotSuivi = (id: number | null) => {
  const invalidate = useInvalidateCantine();
  return useQuery({
    queryKey: [ROOT, "depot", id],
    queryFn: async () => {
      const depot = await getDepot(id as number);
      if (depot.statut !== "INITIE") invalidate();
      return depot;
    },
    enabled: id !== null,
    refetchInterval: (query) => (query.state.data?.statut === "INITIE" || !query.state.data ? 4000 : false),
    refetchIntervalInBackground: false,
  });
};

export const useProduits = (filters?: { prison?: number; actif?: boolean }, options?: Opts) =>
  useQuery({
    queryKey: [ROOT, "produits", filters ?? {}],
    queryFn: () => getProduits(filters),
    staleTime: STALE,
    enabled: options?.enabled ?? true,
  });

export const usePlafonds = (options?: Opts) =>
  useQuery({
    queryKey: [ROOT, "plafonds"],
    queryFn: getPlafonds,
    staleTime: STALE,
    enabled: options?.enabled ?? true,
  });

export const useCommandes = (filters?: { detenu?: number; statut?: StatutCommande }, options?: Opts & { poll?: boolean }) =>
  useQuery({
    queryKey: [ROOT, "commandes", filters ?? {}],
    queryFn: () => getCommandes(filters),
    staleTime: STALE,
    enabled: options?.enabled ?? true,
    // File de préparation : nouvelles commandes visibles sans recharger
    refetchInterval: options?.poll ? 60 * 1000 : false,
  });

// --- Écritures -------------------------------------------------------------------------------
export const useCreateDepot = () => {
  const invalidate = useInvalidateCantine();
  return useMutation({ mutationFn: createDepot, onSuccess: invalidate });
};

export const useCreateCommande = () => {
  const invalidate = useInvalidateCantine();
  return useMutation({ mutationFn: createCommande, onSuccess: invalidate });
};

export const useCommandeAction = () => {
  const invalidate = useInvalidateCantine();
  return useMutation({
    mutationFn: ({ id, action, motif }: { id: number; action: CommandeAction; motif?: string }) =>
      postCommandeAction(id, action, motif),
    onSuccess: invalidate,
  });
};

export const useSaveProduit = () => {
  const invalidate = useInvalidateCantine();
  return useMutation({
    mutationFn: ({ id, dto }: { id?: number; dto: Partial<ProduitInput> }) =>
      id ? updateProduit(id, dto) : createProduit(dto as ProduitInput),
    onSuccess: invalidate,
  });
};

export const useSavePlafonds = () => {
  const invalidate = useInvalidateCantine();
  return useMutation({
    mutationFn: ({ id, dto }: { id?: number; dto: PlafondsInput }) => (id ? updatePlafonds(id, dto) : createPlafonds(dto)),
    onSuccess: invalidate,
  });
};
