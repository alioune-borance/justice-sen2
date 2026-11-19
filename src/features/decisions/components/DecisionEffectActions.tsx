import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { useDecisionEffect } from "../api/decisions.api";
import { DecisionJustice } from "../types/decision";
import { prisonerStatusLabel } from "../../detenus/types/detenu";
import { useCanApplyDecisionEffect } from "../hooks/useCanApplyDecisionEffect";
import { getApiErrorMessages } from "../../../shared/api/errorMessages";

interface Props {
  decision: DecisionJustice;
  // Message de succès ou d'erreur remonté à la page (sinon affiché sous les boutons)
  onResult?: (result: { success?: string; errors?: string[] }) => void;
}

// Boutons « Appliquer » / « Écarter » d'un effet proposé (avec saisie du motif pour écarter)
export const DecisionEffectActions: React.FC<Props> = ({ decision, onResult }) => {
  const canApply = useCanApplyDecisionEffect();
  const effect = useDecisionEffect();
  const [dismissing, setDismissing] = useState(false);
  const [motif, setMotif] = useState("");
  const [local, setLocal] = useState<{ success?: string; errors?: string[] }>({});

  if (!canApply || decision.effet_etat !== "PROPOSE" || !decision.est_courante) return null;

  const report = (result: { success?: string; errors?: string[] }) => (onResult ? onResult(result) : setLocal(result));

  const run = async (apply: boolean) => {
    report({});
    try {
      await effect.mutateAsync({ id: decision.id, apply, motif: apply ? undefined : motif.trim() });
      report({ success: apply ? `Statut de ${decision.detenu_nom} mis à jour.` : "Effet écarté." });
      setDismissing(false);
      setMotif("");
    } catch (error) {
      report({ errors: getApiErrorMessages(error) });
    }
  };

  const apply = () => {
    const statut = prisonerStatusLabel(decision.statut_propose);
    if (window.confirm(`Appliquer l'effet proposé : ${decision.detenu_nom} passe au statut « ${statut} » ?`)) run(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={effect.isPending} onClick={apply}
          className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50">
          <Check className="h-4 w-4" /> Appliquer
        </button>
        <button type="button" disabled={effect.isPending} onClick={() => { setDismissing(true); setMotif(""); }}
          className="flex items-center gap-1 rounded-md bg-gray-600 px-2 py-1 text-sm text-white hover:bg-gray-700 disabled:opacity-50">
          <X className="h-4 w-4" /> Écarter
        </button>
      </div>
      {dismissing && (
        <div className="flex flex-col gap-2 md:flex-row">
          <input value={motif} onChange={(e) => setMotif(e.target.value)} autoFocus maxLength={2000}
            placeholder="Motif (obligatoire)" className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
          <button type="button" disabled={!motif.trim() || effect.isPending} onClick={() => run(false)}
            className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-white disabled:opacity-50">
            Confirmer
          </button>
          <button type="button" onClick={() => setDismissing(false)} className="px-3 py-1.5 text-sm text-gray-600">Annuler</button>
        </div>
      )}
      {!onResult && local.success && <p className="text-sm text-green-700">{local.success}</p>}
      {!onResult && local.errors && local.errors.length > 0 && (
        <ul className="list-inside list-disc text-sm text-red-700">
          {local.errors.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
    </div>
  );
};
