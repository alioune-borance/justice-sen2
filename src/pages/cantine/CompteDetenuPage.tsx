import React, { useState } from "react";
import { ExternalLink, Loader2, Wallet } from "lucide-react";
import { useComptes, useCreateDepot, useDepots, useDepotSuivi, useOperations } from "../../features/cantine/api/useCantine";
import { useDetenuChoisi } from "../../features/cantine/hooks/useDetenuChoisi";
import {
  DetenuSelect,
  ErrorList,
  OperationsTable,
  PlafondsGauges,
  ProcheCantineNav,
  StatutPaiementBadge,
} from "../../features/cantine/components/CantineParts";
import { MOYENS_PAIEMENT, MoyenPaiement, PaiementDepot } from "../../features/cantine/types/cantine";
import { formatFcfa } from "../../features/cantine/utils/money";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { CANTEEN_ACTIONS } from "../../features/auth/config/rbac";
import { formatDateTime } from "../../shared/utils/dates";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

// Montant minimal affiché à titre indicatif (CANTEEN_DEPOSIT_MIN du backend, qui reste seul juge)
const MIN_DEPOT_INDICATIF = 500;

// Proche référent : solde, plafonds, dépôt d'argent et historique, par détenu lié.
export const CompteDetenuPage: React.FC = () => {
  const { detenus, detenu, choisir } = useDetenuChoisi();
  const { allows } = usePermissions();
  const comptes = useComptes({ detenu: detenu?.id }, { enabled: !!detenu });
  const compte = comptes.data?.[0];
  const operations = useOperations({ detenu: detenu?.id }, { enabled: !!detenu });
  const depots = useDepots({ detenu: detenu?.id }, { enabled: !!detenu });

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2"><Wallet className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Compte du détenu</h2>
          <p className="text-sm text-gray-500">Solde, dépôts d'argent et historique des opérations</p>
        </div>
      </div>

      <ProcheCantineNav detenuId={detenu?.id} active="compte" />
      <DetenuSelect detenus={detenus} value={detenu} onChange={choisir} />

      {detenu && (
        comptes.isLoading ? (
          <p className="text-sm text-gray-500">Chargement du compte…</p>
        ) : comptes.isError ? (
          <ErrorList messages={getApiErrorMessages(comptes.error)} />
        ) : !compte ? (
          <p className="text-sm text-gray-500">Aucun compte ouvert pour ce détenu.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Solde disponible</p>
                <p className="mt-2 text-4xl font-bold tabular-nums text-slate-800">{formatFcfa(compte.solde)}</p>
                <p className="mt-1 text-xs text-gray-500">{compte.detenu_nom}{compte.matricule ? ` · ${compte.matricule}` : ""}</p>
              </section>
              <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <PlafondsGauges plafonds={compte.plafonds} />
              </section>
            </div>

            {allows(CANTEEN_ACTIONS.deposit) && (
              <DepotForm detenuId={detenu.id} depotRestant={compte.plafonds.depot_restant} />
            )}
          </>
        )
      )}

      {detenu && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Mes dépôts</h3>
          {depots.isLoading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : (depots.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">Aucun dépôt.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {(depots.data ?? []).map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-gray-700">
                    {formatDateTime(d.cree_le)} · {MOYENS_PAIEMENT.find((m) => m.value === d.moyen)?.label ?? d.moyen}
                    {d.statut === "ECHOUE" && d.motif_echec && <span className="block text-xs text-red-700">{d.motif_echec}</span>}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums font-medium text-gray-900">{formatFcfa(d.montant)}</span>
                    <StatutPaiementBadge statut={d.statut} label={d.statut_label} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {detenu && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Historique du compte</h3>
          {operations.isLoading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : operations.isError ? (
            <ErrorList messages={getApiErrorMessages(operations.error)} />
          ) : (
            <OperationsTable operations={operations.data ?? []} showAuthor />
          )}
        </section>
      )}
    </div>
  );
};

// ── Dépôt par paiement mobile ──────────────────────────────────────────────────────────────────
const DepotForm: React.FC<{ detenuId: number; depotRestant: number }> = ({ detenuId, depotRestant }) => {
  const create = useCreateDepot();
  const [montant, setMontant] = useState("");
  const [moyen, setMoyen] = useState<MoyenPaiement>("WAVE");
  const [telephone, setTelephone] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [suiviId, setSuiviId] = useState<number | null>(null);

  const value = Number(montant);
  const overLimit = value > depotRestant;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessages([]);
    try {
      const depot = await create.mutateAsync({ detenu: detenuId, montant: value, moyen, telephone: telephone.trim() });
      setSuiviId(depot.id);
      setMontant("");
    } catch (error) {
      setMessages(getApiErrorMessages(error));
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-slate-800">Déposer de l'argent</h3>
      <p className="mb-4 text-sm text-gray-500">
        Le compte est crédité dès que l'opérateur confirme le paiement. Vous pouvez encore déposer {formatFcfa(depotRestant)} sur la période.
      </p>

      {suiviId !== null && <DepotSuivi id={suiviId} onClose={() => setSuiviId(null)} />}

      {depotRestant === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Le plafond de dépôt de la période est atteint pour ce détenu.
        </p>
      ) : (
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Montant (F CFA)</span>
            <input type="number" inputMode="numeric" min={MIN_DEPOT_INDICATIF} max={depotRestant} step={1} required
              value={montant} onChange={(e) => setMontant(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            {overLimit && <span className="mt-1 block text-xs text-red-700">Au-delà du plafond restant.</span>}
          </label>
          <fieldset>
            <legend className="mb-1 block text-sm font-medium text-gray-700">Moyen de paiement</legend>
            <div className="flex gap-4 pt-2">
              {MOYENS_PAIEMENT.map((m) => (
                <label key={m.value} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="moyen" value={m.value} checked={moyen === m.value} onChange={() => setMoyen(m.value)} />
                  {m.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Téléphone du compte {MOYENS_PAIEMENT.find((m) => m.value === moyen)?.label}</span>
            <input type="tel" required pattern="\+?[0-9 ]{7,20}" placeholder="77 123 45 67"
              value={telephone} onChange={(e) => setTelephone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-3 space-y-3">
            <ErrorList messages={messages} />
            <button type="submit" disabled={create.isPending || !value || overLimit || suiviId !== null}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {create.isPending ? "Envoi…" : `Payer ${value ? formatFcfa(value) : ""}`}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

// Lien de paiement de l'opérateur : affiché seulement s'il s'agit d'une URL http(s)
const safePaymentUrl = (depot: PaiementDepot) => {
  try {
    const url = new URL(depot.url_paiement);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
};

const DepotSuivi: React.FC<{ id: number; onClose: () => void }> = ({ id, onClose }) => {
  const { data: depot, isError } = useDepotSuivi(id);
  if (isError) {
    return <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Impossible de suivre ce paiement. Consultez « Mes dépôts ».</p>;
  }
  if (!depot) return null;
  const url = safePaymentUrl(depot);

  const tone =
    depot.statut === "CONFIRME" ? "border-green-200 bg-green-50 text-green-900"
      : depot.statut === "ECHOUE" ? "border-red-200 bg-red-50 text-red-900"
        : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <div className={`mb-4 space-y-2 rounded-lg border p-4 text-sm ${tone}`} role="status" aria-live="polite">
      <p className="flex flex-wrap items-center gap-2 font-medium">
        Dépôt de {formatFcfa(depot.montant)} <StatutPaiementBadge statut={depot.statut} label={depot.statut_label} />
      </p>
      {depot.statut === "INITIE" && (
        <>
          <p className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Validez le paiement sur votre téléphone ({depot.telephone}). Cette page se met à jour toute seule.
          </p>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline">
              Ouvrir la page de paiement <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </>
      )}
      {depot.statut === "CONFIRME" && <p>Paiement confirmé : le compte du détenu est crédité.</p>}
      {depot.statut === "ECHOUE" && <p>Paiement échoué{depot.motif_echec ? ` : ${depot.motif_echec}` : "."} Aucun montant n'a été crédité.</p>}
      <button type="button" onClick={onClose} className="text-sm font-medium underline">
        {depot.statut === "INITIE" ? "Masquer (le suivi reste dans « Mes dépôts »)" : "Fermer"}
      </button>
    </div>
  );
};
