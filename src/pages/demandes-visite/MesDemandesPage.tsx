import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Download, FileText } from "lucide-react";
import { useGetDemandes } from "../../features/demandes-visite/api/useDemandes";
import { DemandeVisite } from "../../features/demandes-visite/types/demande";
import { EtatPermisBadge, StatutDemandeBadge } from "../../features/demandes-visite/components/DemandeParts";
import { periodeDemande } from "../../features/demandes-visite/utils/periode";
import { formatDate } from "../../shared/utils/dates";
import { downloadPermis } from "../../features/permis/api/permis.api";
import { Can } from "../../features/auth/components/Can";
import { getApiErrorMessage } from "../../shared/api/errorMessages";

// Proche référent : ses demandes de visite, leur état, et le permis une fois la demande validée.
export const MesDemandesPage: React.FC = () => {
  const { data: demandes = [], isLoading, isError } = useGetDemandes();
  const [error, setError] = useState<string | null>(null);

  const download = async (demande: DemandeVisite) => {
    if (!demande.permis) return;
    setError(null);
    try {
      await downloadPermis(demande.permis);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const toComplete = demandes.filter((d) => d.statut === "INCOMPLETE");

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800">Mes demandes de visite</h2>
        <Can perm="visit_requests:create">
          <Link to="/mes-demandes/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            <CalendarPlus className="h-4 w-4" /> Nouvelle demande
          </Link>
        </Can>
      </div>

      {toComplete.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {toComplete.length === 1
            ? "Une demande attend des pièces complémentaires."
            : `${toComplete.length} demandes attendent des pièces complémentaires.`}{" "}
          Ouvrez-la pour déposer les pièces et la renvoyer.
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {isError ? (
          <p className="p-6 text-sm text-red-600">Impossible de charger vos demandes.</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-gray-500">Chargement…</p>
        ) : demandes.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Vous n'avez encore déposé aucune demande de visite.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {demandes.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="space-y-1">
                  <Link to={`/mes-demandes/${d.id}`} className="font-medium text-blue-700 hover:underline">
                    Visite à {d.detenu_nom}
                  </Link>
                  <p className="text-sm text-gray-600">{d.prison_nom} — {periodeDemande(d)}</p>
                  <p className="text-xs text-gray-400">Déposée le {formatDate(d.cree_le)}</p>
                  {d.statut === "REFUSEE" && d.motif_refus && (
                    <p className="text-sm text-red-700">Motif du refus : {d.motif_refus}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatutDemandeBadge statut={d.statut} />
                  {d.permis && (
                    <>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <FileText className="h-4 w-4" /> {d.permis.numero} <EtatPermisBadge permis={d.permis} />
                      </span>
                      {d.permis.etat !== "REVOQUE" && (
                        <button type="button" onClick={() => download(d)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                          <Download className="h-4 w-4" /> Permis (PDF)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
