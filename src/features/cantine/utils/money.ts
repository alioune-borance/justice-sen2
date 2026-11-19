import { StatutCommande, StatutPaiement, TypeOperation } from "../types/cantine";

const FCFA = new Intl.NumberFormat("fr-FR");

// 12500 → « 12 500 F CFA » ; signé pour le journal (+ crédit, − débit)
export const formatFcfa = (value: number | null | undefined) => (value == null ? "—" : `${FCFA.format(value)} F CFA`);
export const formatSignedFcfa = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatFcfa(Math.abs(value))}`;

export const STATUT_COMMANDE_STYLES: Record<StatutCommande, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  PREPAREE: "bg-blue-100 text-blue-800",
  LIVREE: "bg-green-100 text-green-800",
  ANNULEE: "bg-gray-200 text-gray-700",
};

export const STATUT_PAIEMENT_STYLES: Record<StatutPaiement, string> = {
  INITIE: "bg-amber-100 text-amber-800",
  CONFIRME: "bg-green-100 text-green-800",
  ECHOUE: "bg-red-100 text-red-800",
};

export const TYPE_OPERATION_STYLES: Record<TypeOperation, string> = {
  DEPOT: "text-green-700",
  REMBOURSEMENT: "text-green-700",
  REPRISE: "text-gray-700",
  ACHAT: "text-red-700",
};
