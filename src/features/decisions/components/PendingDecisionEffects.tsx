import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { useGetDecisions } from "../api/decisions.api";
import { prisonerStatusLabel } from "../../detenus/types/detenu";
import { usePermissions } from "../../auth/hooks/usePermissions";
import { ROUTE_ACCESS } from "../../auth/config/rbac";
import { formatDate } from "../../../shared/utils/dates";
import { DecisionEffectActions } from "./DecisionEffectActions";
import { useCanApplyDecisionEffect } from "../hooks/useCanApplyDecisionEffect";

// Décisions dont l'effet sur le statut attend la prison.
//   avec detenuId (fiche détenu) : celles du détenu, pour tous les lecteurs des décisions ;
//   sans detenuId (liste des détenus) : celles de tous les détenus de la prison, pour l'AP / SP seulement.
// Lecteurs : information ; AP / SP de la prison du détenu : boutons Appliquer / Écarter.
export const PendingDecisionEffects: React.FC<{ detenuId?: number }> = ({ detenuId }) => {
  const { can, allows } = usePermissions();
  const canApply = useCanApplyDecisionEffect();
  const allPrisoners = detenuId === undefined;
  const { data: decisions = [] } = useGetDecisions(
    allPrisoners ? { effet: "PROPOSE" } : { detenu: detenuId, effet: "PROPOSE" },
    { enabled: allPrisoners ? canApply : !!detenuId && can("court_decisions:read") }
  );
  const [result, setResult] = useState<{ success?: string; errors?: string[] }>({});

  if (decisions.length === 0) {
    return result.success ? (
      <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{result.success}</p>
    ) : null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 text-amber-900">
        <Scale className="h-5 w-5" />
        <h3 className="font-semibold">
          {decisions.length === 1 ? "Décision de justice en attente d'application" : `${decisions.length} décisions de justice en attente d'application`}
        </h3>
      </div>
      {!canApply && (
        <p className="text-sm text-amber-800">Le statut du détenu changera quand l'administrateur ou le superviseur de la prison aura appliqué l'effet.</p>
      )}
      <ul className="space-y-3">
        {decisions.map((d) => (
          <li key={d.id} className="flex flex-wrap items-start justify-between gap-3 rounded-md bg-white p-3 text-sm shadow-sm">
            <div className="space-y-1">
              {allPrisoners && (
                <Link to={`/detenus/${d.detenu}`} className="font-semibold text-blue-700 hover:underline">
                  {d.detenu_nom}{d.detenu_matricule ? ` (${d.detenu_matricule})` : ""}
                </Link>
              )}
              <p className="font-medium text-gray-900">{d.type_label} du {formatDate(d.date_decision)} — {d.juridiction}</p>
              <p className="text-gray-700">
                Statut proposé : <strong>{prisonerStatusLabel(d.statut_propose)}</strong>
                {d.peine_proposee ? ` — peine : ${d.peine_proposee} mois` : ""}
                {d.date_liberation_proposee ? ` — libération : ${formatDate(d.date_liberation_proposee)}` : ""}
              </p>
              <p className="text-xs text-gray-500">Saisie par {d.auteur_nom ?? "—"}</p>
            </div>
            <DecisionEffectActions decision={d} onResult={setResult} />
          </li>
        ))}
      </ul>
      {result.errors && result.errors.length > 0 && (
        <ul className="list-inside list-disc text-sm text-red-700">
          {result.errors.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
      {!allPrisoners && allows(ROUTE_ACCESS["/decisions"]) && (
        <Link to={`/decisions?detenu=${detenuId}&historique=1`} className="text-sm text-blue-700 hover:underline">
          Voir toutes les décisions du détenu
        </Link>
      )}
    </div>
  );
};
