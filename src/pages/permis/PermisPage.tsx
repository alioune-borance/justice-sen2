import React, { useState } from "react";
import { Download, FileBadge, Ban } from "lucide-react";
import { useGetPermis, useRevokePermis } from "../../features/permis/api/usePermis";
import { downloadPermis } from "../../features/permis/api/permis.api";
import { ETAT_PERMIS_LABELS, ETAT_PERMIS_STYLES, EtatPermis, PermisVisite } from "../../features/permis/types/permis";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { useRole } from "../../features/auth/hooks/useRole";
import { formatDate, formatDateTime } from "../../shared/utils/dates";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

// Permis de visite émis. Le backend filtre : titulaire (proche), circuit (acteur judiciaire), prison du permis.
// Révocation (motif obligatoire) : gestionnaires du circuit et super administrateur.
export const PermisPage: React.FC = () => {
  const [etat, setEtat] = useState<"" | EtatPermis>("");
  const { data: permis = [], isLoading, isError } = useGetPermis({ etat: etat || undefined });
  const revoke = useRevokePermis();
  const { canOnPrisoner } = usePermissions();
  const { isRelative } = useRole();

  const [revoking, setRevoking] = useState<number | null>(null);
  const [motif, setMotif] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

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

  const confirmRevoke = async (p: PermisVisite) => {
    if (!motif.trim()) return;
    const done = await run(() => revoke.mutateAsync({ id: p.id, motif: motif.trim() }), `Permis ${p.numero} révoqué.`);
    if (done) {
      setRevoking(null);
      setMotif("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2"><FileBadge className="h-6 w-6 text-blue-600" /></div>
          <h2 className="text-2xl font-bold text-slate-800">{isRelative ? "Mes permis de visite" : "Permis de visite émis"}</h2>
        </div>
        <select value={etat} onChange={(e) => setEtat(e.target.value as "" | EtatPermis)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" aria-label="Filtrer par état">
          <option value="">Tous les états</option>
          {(Object.keys(ETAT_PERMIS_LABELS) as EtatPermis[]).map((e) => <option key={e} value={e}>{ETAT_PERMIS_LABELS[e]}</option>)}
        </select>
      </div>

      {errors.length > 0 && (
        <ul className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
      {success && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</p>}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {isError ? (
          <p className="p-6 text-sm text-red-600">Impossible de charger les permis.</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-gray-500">Chargement…</p>
        ) : permis.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Aucun permis.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {permis.map((p) => {
              const canRevoke = p.etat !== "REVOQUE" && p.etat !== "EXPIRE" && canOnPrisoner("visit_permits:validate", p.detenu);
              return (
                <li key={p.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-gray-900">
                        {p.numero}
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${ETAT_PERMIS_STYLES[p.etat]}`}>{p.etat_label}</span>
                      </p>
                      <p className="text-gray-700">
                        Détenu : {p.detenu_nom}{p.detenu_matricule ? ` (${p.detenu_matricule})` : ""} — {p.prison_nom}
                      </p>
                      <p className="text-gray-700">
                        Titulaire : {p.titulaire_nom}
                        {p.visiteurs_supplementaires.length > 0 && ` + ${p.visiteurs_supplementaires.map((v) => v.nom).join(", ")}`}
                      </p>
                      <p className="text-gray-500">
                        Valable du {formatDate(p.valide_du)} au {formatDate(p.valide_au)} — signé par {p.signataire_nom} ({p.signataire_qualite})
                      </p>
                      {p.revoque_le && (
                        <p className="text-red-700">Révoqué le {formatDateTime(p.revoque_le)} : {p.motif_revocation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {p.etat !== "REVOQUE" && (
                        <button type="button" onClick={() => run(() => downloadPermis(p))}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                          <Download className="h-4 w-4" /> PDF
                        </button>
                      )}
                      {canRevoke && revoking !== p.id && (
                        <button type="button" onClick={() => { setRevoking(p.id); setMotif(""); }}
                          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
                          <Ban className="h-4 w-4" /> Révoquer
                        </button>
                      )}
                    </div>
                  </div>
                  {revoking === p.id && (
                    <div className="flex flex-col gap-2 md:flex-row">
                      <input value={motif} onChange={(e) => setMotif(e.target.value)} autoFocus maxLength={2000}
                        placeholder="Motif de la révocation (obligatoire)"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                      <button type="button" disabled={!motif.trim() || revoke.isPending} onClick={() => confirmRevoke(p)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                        Confirmer la révocation
                      </button>
                      <button type="button" onClick={() => setRevoking(null)} className="px-3 py-1.5 text-sm text-gray-600">
                        Annuler
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
