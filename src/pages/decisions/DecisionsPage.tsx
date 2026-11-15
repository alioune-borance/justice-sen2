import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Download, Gavel, History, Pencil, Plus, X } from "lucide-react";
import { downloadDecision, useDecisionEffect, useGetDecisions } from "../../features/decisions/api/decisions.api";
import { DecisionJustice, EFFET_STYLES, TYPES_DECISION } from "../../features/decisions/types/decision";
import { useGetDetenus } from "../../features/detenus/api/useGetDetenu";
import { Detenu } from "../../features/detenus/types/detenu";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { Can } from "../../features/auth/components/Can";
import { useRole } from "../../features/auth/hooks/useRole";
import { ROUTE_ACCESS } from "../../features/auth/config/rbac";
import { prisonerStatusLabel } from "../../features/detenus/types/detenu";
import { formatDate, formatDateTime } from "../../shared/utils/dates";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const SELECT = "rounded-lg border border-gray-300 px-3 py-2 text-sm";

// Décisions de justice. Lecture : prison actuelle du détenu, ministère de la Justice, acteurs judiciaires affectés.
// Saisie et correction : greffier affecté. Effet sur le statut : AP / SP de la prison.
export const DecisionsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const detenu = params.get("detenu") ?? "";
  const type = params.get("type") ?? "";
  const aAppliquer = params.get("effet") === "PROPOSE";
  const historique = params.get("historique") === "1";

  const { data: decisions = [], isLoading, isError } = useGetDecisions({
    detenu: detenu ? Number(detenu) : undefined,
    type: type || undefined,
    effet: aAppliquer ? "PROPOSE" : undefined,
    historique,
  });
  const { data: detenus = [] } = useGetDetenus();
  const effect = useDecisionEffect();
  const { can, allows, isMyPrison } = usePermissions();
  // Saisie et correction : greffier seulement (règle appliquée par le backend, même en mode observation)
  const canEnter = allows(ROUTE_ACCESS["/decisions/new"]);
  const canCorrect = allows(ROUTE_ACCESS["/decisions/:id/correct"]);
  // Effet sur le statut : AP / SP de la prison du détenu
  const { is } = useRole();
  const canApplyEffect = can("court_decisions:validate") && is("ADMIN_PRISON", "SUPERVISEUR_PRISON");

  const [dismissing, setDismissing] = useState<number | null>(null);
  const [motif, setMotif] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const sorted = useMemo(
    () => [...decisions].sort((a, b) => b.date_decision.localeCompare(a.date_decision) || b.version - a.version),
    [decisions]
  );

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setErrors([]);
    setSuccess(null);
    try {
      await fn();
      if (ok) setSuccess(ok);
      return true;
    } catch (error) {
      setErrors(getApiErrorMessages(error));
      return false;
    }
  };

  const apply = (d: DecisionJustice) => {
    if (!window.confirm(`Appliquer l'effet proposé : ${d.detenu_nom} passe au statut « ${prisonerStatusLabel(d.statut_propose)} » ?`)) return;
    run(() => effect.mutateAsync({ id: d.id, apply: true }), `Statut de ${d.detenu_nom} mis à jour.`);
  };

  const dismiss = async (d: DecisionJustice) => {
    if (!motif.trim()) return;
    const done = await run(() => effect.mutateAsync({ id: d.id, apply: false, motif: motif.trim() }), "Effet écarté.");
    if (done) {
      setDismissing(null);
      setMotif("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2"><Gavel className="h-6 w-6 text-blue-600" /></div>
          <h2 className="text-2xl font-bold text-slate-800">Décisions de justice</h2>
        </div>
        <Can perm="court_decisions:create" when={canEnter}>
          <Link to={`/decisions/new${detenu ? `?detenu=${detenu}` : ""}`}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Saisir une décision
          </Link>
        </Can>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <select value={detenu} onChange={(e) => setFilter("detenu", e.target.value)} className={SELECT} aria-label="Détenu">
          <option value="">Tous les détenus</option>
          {(detenus as Detenu[]).map((d) => (
            <option key={d.id} value={d.id}>{d.first_name} {d.last_name}{d.matricule_number ? ` (${d.matricule_number})` : ""}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setFilter("type", e.target.value)} className={SELECT} aria-label="Type">
          <option value="">Tous les types</option>
          {TYPES_DECISION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {canApplyEffect && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={aAppliquer} onChange={(e) => setFilter("effet", e.target.checked ? "PROPOSE" : "")} />
            Effets à appliquer
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={historique} onChange={(e) => setFilter("historique", e.target.checked ? "1" : "")} />
          <History className="h-4 w-4" /> Afficher les versions corrigées
        </label>
      </div>

      {errors.length > 0 && (
        <ul className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
      {success && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</p>}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {isError ? (
          <p className="p-6 text-sm text-red-600">Impossible de charger les décisions.</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-gray-500">Chargement…</p>
        ) : sorted.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Aucune décision.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sorted.map((d) => (
              <li key={d.id} className={`space-y-2 p-4 ${d.est_courante ? "" : "bg-gray-50 opacity-80"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-900">
                      {d.type_label} du {formatDate(d.date_decision)} — {d.juridiction}
                      <span className="ml-2 text-xs text-gray-500">version {d.version}{d.est_courante ? "" : " (remplacée)"}</span>
                    </p>
                    <p className="text-gray-700">
                      <Link to={`/decisions?detenu=${d.detenu}&historique=1`} className="text-blue-700 hover:underline">{d.detenu_nom}</Link>
                      {d.detenu_matricule ? ` (${d.detenu_matricule})` : ""} — {d.prison_nom}
                      {d.reference_affaire && ` — affaire ${d.reference_affaire}`}
                    </p>
                    <p className="text-gray-600">{d.resume}</p>
                    {d.version > 1 && d.motif_correction && <p className="text-gray-500">Correction : {d.motif_correction}</p>}
                    <p className="text-xs text-gray-400">Saisie par {d.auteur_nom ?? "—"} le {formatDateTime(d.cree_le)}</p>
                    {d.effet_etat !== "AUCUN" && (
                      <p>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${EFFET_STYLES[d.effet_etat]}`}>{d.effet_etat_label}</span>
                        {d.statut_propose && <span className="ml-2 text-gray-700">Statut proposé : {prisonerStatusLabel(d.statut_propose)}</span>}
                        {d.peine_proposee && <span className="ml-2 text-gray-700">Peine : {d.peine_proposee} mois</span>}
                        {d.date_liberation_proposee && <span className="ml-2 text-gray-700">Libération : {formatDate(d.date_liberation_proposee)}</span>}
                        {d.effet_traite_par_nom && (
                          <span className="ml-2 text-xs text-gray-500">par {d.effet_traite_par_nom} le {formatDateTime(d.effet_traite_le)}</span>
                        )}
                        {d.effet_motif && <span className="ml-2 text-xs text-gray-500">({d.effet_motif})</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {d.a_document && (
                      <button type="button" onClick={() => run(() => downloadDecision(d))}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                        <Download className="h-4 w-4" /> PDF
                      </button>
                    )}
                    {d.est_courante && canCorrect && (
                      <Link to={`/decisions/${d.id}/correct`} className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900">
                        <Pencil className="h-4 w-4" /> Corriger
                      </Link>
                    )}
                    <Can perm="court_decisions:validate" when={canApplyEffect && d.effet_etat === "PROPOSE" && d.est_courante && isMyPrison(d.prison)}>
                      <button type="button" disabled={effect.isPending} onClick={() => apply(d)}
                        className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50">
                        <Check className="h-4 w-4" /> Appliquer
                      </button>
                      <button type="button" disabled={effect.isPending} onClick={() => { setDismissing(d.id); setMotif(""); }}
                        className="flex items-center gap-1 rounded-md bg-gray-600 px-2 py-1 text-sm text-white hover:bg-gray-700 disabled:opacity-50">
                        <X className="h-4 w-4" /> Écarter
                      </button>
                    </Can>
                  </div>
                </div>
                {dismissing === d.id && (
                  <div className="flex flex-col gap-2 md:flex-row">
                    <input value={motif} onChange={(e) => setMotif(e.target.value)} autoFocus maxLength={2000}
                      placeholder="Motif (obligatoire)" className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                    <button type="button" disabled={!motif.trim() || effect.isPending} onClick={() => dismiss(d)}
                      className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-white disabled:opacity-50">
                      Confirmer
                    </button>
                    <button type="button" onClick={() => setDismissing(null)} className="px-3 py-1.5 text-sm text-gray-600">Annuler</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
