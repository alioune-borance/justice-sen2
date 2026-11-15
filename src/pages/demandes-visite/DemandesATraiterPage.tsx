import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useGetDemandes } from "../../features/demandes-visite/api/useDemandes";
import { EtapeDemande, STEP_BY_ROLE } from "../../features/demandes-visite/types/demande";
import { StatutDemandeBadge } from "../../features/demandes-visite/components/DemandeParts";
import { periodeDemande } from "../../features/demandes-visite/utils/periode";
import { formatDateTime } from "../../shared/utils/dates";
import { useRole } from "../../features/auth/hooks/useRole";
import { roleLabel } from "../../features/auth/config/rbac";

type Tab = "A_TRAITER" | "TERMINEES";

// Ce que voit chaque gestionnaire dans « À traiter » (le backend filtre aussi le périmètre et le circuit)
const STEP_TEXT: Record<string, { title: string; subtitle: string }> = {
  GREFFE: {
    title: "Demandes à vérifier",
    subtitle: "Étape 1 — greffe : vérifier les pièces, puis transmettre au magistrat ou refuser",
  },
  MAGISTRAT: {
    title: "Demandes à décider",
    subtitle: "Étape 2 — demandes vérifiées et transmises par le greffe",
  },
  PRISON: {
    title: "Demandes de visite",
    subtitle: "Condamnés de votre établissement : vérifier les pièces puis décider",
  },
};

// File des demandes de visite du gestionnaire : uniquement celles de SON étape.
//   greffier → GREFFE ; juge d'instruction / procureur → MAGISTRAT (et seulement les demandes qui lui
//   reviennent d'après le statut du détenu) ; AP / SP → PRISON.
export const DemandesATraiterPage: React.FC = () => {
  const { role, isMagistrate } = useRole();
  const myStep: EtapeDemande | undefined = role ? STEP_BY_ROLE[role] : undefined;
  const [tab, setTab] = useState<Tab>("A_TRAITER");

  const etape: EtapeDemande | undefined = tab === "TERMINEES" ? "TERMINEE" : myStep;
  const { data = [], isLoading, isError } = useGetDemandes({ etape }, { enabled: !!etape });

  const demandes = useMemo(() => {
    // Magistrats : le juge d'instruction décide pour les prévenus, le procureur pour les accusés
    // Terminées : seulement celles où son étape a décidé (transmission, validation, refus, complément)
    const list =
      tab === "A_TRAITER"
        ? isMagistrate ? data.filter((d) => d.magistrat_attendu === role) : data
        : data.filter((d) => d.historique.some((h) => h.etape === myStep && h.decision !== ""));
    // À traiter : les plus anciennes d'abord ; terminées : les plus récentes d'abord
    const key = (d: (typeof list)[number]) =>
      tab === "TERMINEES" ? d.decidee_le ?? d.cree_le : d.transmise_le ?? d.soumise_le ?? d.cree_le;
    return [...list].sort((a, b) =>
      tab === "TERMINEES" ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b))
    );
  }, [data, tab, isMagistrate, role, myStep]);

  const text = (myStep && STEP_TEXT[myStep]) || STEP_TEXT.PRISON;

  if (!myStep) {
    return <p className="text-gray-600">Votre rôle ne traite pas de demande de visite.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2"><ClipboardList className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{text.title}</h2>
          <p className="text-sm text-gray-500">{text.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {([["A_TRAITER", "À traiter"], ["TERMINEES", "Terminées"]] as [Tab, string][]).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
            className={`rounded-full px-3 py-1 text-sm ${tab === value ? "bg-slate-800 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {isError ? (
          <p className="p-6 text-sm text-red-600">Impossible de charger les demandes.</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-gray-500">Chargement…</p>
        ) : demandes.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            {tab === "A_TRAITER" ? "Aucune demande en attente à votre étape." : "Aucune demande terminée."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Détenu</th>
                <th className="px-4 py-3 font-medium">Demandeur</th>
                <th className="px-4 py-3 font-medium">Période</th>
                <th className="px-4 py-3 font-medium">{myStep === "MAGISTRAT" ? "Transmise le" : "Soumise le"}</th>
                <th className="px-4 py-3 font-medium">{myStep === "MAGISTRAT" ? "Décision attendue de" : "Pièces"}</th>
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
                    <td className="px-4 py-3">
                      {formatDateTime(myStep === "MAGISTRAT" ? d.transmise_le : d.soumise_le ?? d.cree_le)}
                    </td>
                    <td className="px-4 py-3">
                      {myStep === "MAGISTRAT" ? (
                        roleLabel(d.magistrat_attendu)
                      ) : (
                        <>
                          {d.pieces.length}
                          {toCheck > 0 && <span className="ml-1 text-amber-700">({toCheck} à vérifier)</span>}
                        </>
                      )}
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
