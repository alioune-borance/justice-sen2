import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useGetDemandes } from "../../features/demandes-visite/api/useDemandes";
import { STATUT_DEMANDE_LABELS, StatutDemande } from "../../features/demandes-visite/types/demande";
import { StatutDemandeBadge } from "../../features/demandes-visite/components/DemandeParts";
import { periodeDemande } from "../../features/demandes-visite/utils/periode";
import { formatDateTime } from "../../shared/utils/dates";
import { useRole } from "../../features/auth/hooks/useRole";

type Tab = "A_TRAITER" | StatutDemande | "TOUTES";

// « À traiter » : soumises et en vérification (les incomplètes attendent le proche)
const TO_PROCESS: StatutDemande[] = ["SOUMISE", "EN_VERIFICATION"];

const TABS: { value: Tab; label: string }[] = [
  { value: "A_TRAITER", label: "À traiter" },
  ...(Object.keys(STATUT_DEMANDE_LABELS) as StatutDemande[]).map((s) => ({ value: s as Tab, label: STATUT_DEMANDE_LABELS[s] })),
  { value: "TOUTES", label: "Toutes" },
];

// File des demandes de visite du gestionnaire. Le backend ne renvoie que son circuit :
// acteur judiciaire → prévenus qui lui sont affectés ; AP / SP → condamnés de sa prison.
export const DemandesATraiterPage: React.FC = () => {
  const { isJudicialActor } = useRole();
  const [tab, setTab] = useState<Tab>("A_TRAITER");
  const statut = tab === "A_TRAITER" || tab === "TOUTES" ? undefined : tab;
  const { data = [], isLoading, isError } = useGetDemandes({ statut });

  const demandes = useMemo(() => {
    const list = tab === "A_TRAITER" ? data.filter((d) => TO_PROCESS.includes(d.statut)) : data;
    // Les plus anciennes d'abord : premier arrivé, premier traité
    return [...list].sort((a, b) => (a.soumise_le ?? a.cree_le).localeCompare(b.soumise_le ?? b.cree_le));
  }, [data, tab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2"><ClipboardList className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Demandes de visite</h2>
          <p className="text-sm text-gray-500">
            {isJudicialActor ? "Prévenus qui vous sont affectés" : "Condamnés de votre établissement"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t.value} type="button" role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)}
            className={`rounded-full px-3 py-1 text-sm ${tab === t.value ? "bg-slate-800 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {isError ? (
          <p className="p-6 text-sm text-red-600">Impossible de charger les demandes.</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-gray-500">Chargement…</p>
        ) : demandes.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Aucune demande.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Détenu</th>
                <th className="px-4 py-3 font-medium">Demandeur</th>
                <th className="px-4 py-3 font-medium">Période</th>
                <th className="px-4 py-3 font-medium">Soumise le</th>
                <th className="px-4 py-3 font-medium">Pièces</th>
                <th className="px-4 py-3 font-medium">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {demandes.map((d) => {
                const toCheck = d.pieces.filter((p) => p.statut === "A_VERIFIER").length;
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/demandes/${d.id}`} className="font-medium text-blue-700 hover:underline">{d.detenu_nom}</Link>
                      <div className="text-xs text-gray-500">{d.prison_nom}</div>
                    </td>
                    <td className="px-4 py-3">{d.proche_nom}<div className="text-xs text-gray-500">{d.lien_parente_label}</div></td>
                    <td className="px-4 py-3">{periodeDemande(d)}</td>
                    <td className="px-4 py-3">{formatDateTime(d.soumise_le ?? d.cree_le)}</td>
                    <td className="px-4 py-3">
                      {d.pieces.length}{toCheck > 0 && <span className="ml-1 text-amber-700">({toCheck} à vérifier)</span>}
                    </td>
                    <td className="px-4 py-3"><StatutDemandeBadge statut={d.statut} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
