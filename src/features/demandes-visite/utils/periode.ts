import { formatDate } from "../../../shared/utils/dates";
import { DemandeVisite } from "../types/demande";

export const periodeDemande = (demande: Pick<DemandeVisite, "date_souhaitee_debut" | "date_souhaitee_fin">) =>
  demande.date_souhaitee_fin
    ? `du ${formatDate(demande.date_souhaitee_debut)} au ${formatDate(demande.date_souhaitee_fin)}`
    : `à partir du ${formatDate(demande.date_souhaitee_debut)}`;
