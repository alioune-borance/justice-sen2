import React, { useMemo, useState } from "react";
import { Search, Wallet, X } from "lucide-react";
import { useComptes, useDepots, useOperations } from "../../features/cantine/api/useCantine";
import { ErrorList, OperationsTable, StatutPaiementBadge } from "../../features/cantine/components/CantineParts";
import { CompteArgent, MOYENS_PAIEMENT, StatutPaiement } from "../../features/cantine/types/cantine";
import { formatFcfa } from "../../features/cantine/utils/money";
import { formatDateTime } from "../../shared/utils/dates";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

type Tab = "COMPTES" | "DEPOTS";

// ADMIN_PRISON et superviseur : comptes argent des détenus de leur prison (périmètre appliqué par le
// backend), journal d'un compte et suivi des dépôts des proches. Lecture seule : aucune écriture
// manuelle sur un compte, le journal n'est alimenté que par les dépôts, achats et remboursements.
export const ComptesPrisonPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>("COMPTES");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2"><Wallet className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Comptes des détenus</h2>
          <p className="text-sm text-gray-500">Soldes, opérations et dépôts des proches de l'établissement</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {([["COMPTES", "Comptes"], ["DEPOTS", "Dépôts des proches"]] as [Tab, string][]).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
            className={`rounded-full px-3 py-1 text-sm ${tab === value ? "bg-slate-800 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "COMPTES" ? <ComptesTab /> : <DepotsTab />}
    </div>
  );
};

const ComptesTab: React.FC = () => {
  const { data = [], isLoading, isError, error } = useComptes();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CompteArgent | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? data.filter((c) => `${c.detenu_nom} ${c.matricule ?? ""}`.toLowerCase().includes(q)) : data;
  }, [data, search]);
  const total = data.reduce((sum, c) => sum + c.solde, 0);

  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (isError) return <ErrorList messages={getApiErrorMessages(error)} />;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <section className="space-y-3 xl:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="relative block">
            <span className="sr-only">Rechercher un détenu</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou matricule"
              className="rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm" />
          </label>
          <p className="text-sm text-gray-600">
            {data.length} comptes · total des soldes <span className="font-semibold tabular-nums text-slate-800">{formatFcfa(total)}</span>
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Aucun compte.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Détenu</th>
                  <th className="px-4 py-3 text-right font-medium">Solde</th>
                  <th className="px-4 py-3 text-right font-medium">Dépôts (période)</th>
                  <th className="px-4 py-3 text-right font-medium">Dépenses (période)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((c) => (
                  <tr key={c.id} className={selected?.id === c.id ? "bg-blue-50" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setSelected(c)} className="text-left font-medium text-blue-700 hover:underline">
                        {c.detenu_nom}
                      </button>
                      {c.matricule && <span className="block text-xs text-gray-500">{c.matricule}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-800">{formatFcfa(c.solde)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {formatFcfa(c.plafonds.depot_utilise)}
                      <span className="block text-xs text-gray-500">sur {formatFcfa(c.plafonds.depot_max)}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {formatFcfa(c.plafonds.depense_utilisee)}
                      <span className="block text-xs text-gray-500">sur {formatFcfa(c.plafonds.depense_max)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
        {selected ? (
          <Journal compte={selected} onClose={() => setSelected(null)} />
        ) : (
          <p className="text-sm text-gray-500">Choisissez un détenu pour afficher le journal de son compte.</p>
        )}
      </section>
    </div>
  );
};

const Journal: React.FC<{ compte: CompteArgent; onClose: () => void }> = ({ compte, onClose }) => {
  const { data = [], isLoading, isError, error } = useOperations({ compte: compte.id });
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">{compte.detenu_nom}</h3>
          <p className="text-sm text-gray-600">Solde : <span className="font-semibold tabular-nums">{formatFcfa(compte.solde)}</span></p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer le journal" className="text-gray-400 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : isError ? (
        <ErrorList messages={getApiErrorMessages(error)} />
      ) : (
        <OperationsTable operations={data} showAuthor />
      )}
    </div>
  );
};

const DepotsTab: React.FC = () => {
  const [statut, setStatut] = useState<StatutPaiement | "">("");
  const { data = [], isLoading, isError, error } = useDepots({ statut: statut || undefined });

  return (
    <div className="space-y-3">
      <label className="block w-fit">
        <span className="mb-1 block text-sm font-medium text-gray-700">État</span>
        <select value={statut} onChange={(e) => setStatut(e.target.value as StatutPaiement | "")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Tous</option>
          <option value="INITIE">En attente de paiement</option>
          <option value="CONFIRME">Confirmés</option>
          <option value="ECHOUE">Échoués</option>
        </select>
      </label>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Chargement…</p>
        ) : isError ? (
          <div className="p-4"><ErrorList messages={getApiErrorMessages(error)} /></div>
        ) : data.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Aucun dépôt.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Proche</th>
                <th className="px-4 py-3 font-medium">Moyen</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((d) => (
                <tr key={d.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDateTime(d.cree_le)}</td>
                  <td className="px-4 py-3 text-gray-900">{d.proche_nom || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{MOYENS_PAIEMENT.find((m) => m.value === d.moyen)?.label ?? d.moyen}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatFcfa(d.montant)}</td>
                  <td className="px-4 py-3">
                    <StatutPaiementBadge statut={d.statut} label={d.statut_label} />
                    {d.statut === "ECHOUE" && d.motif_echec && <span className="block text-xs text-red-700">{d.motif_echec}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
