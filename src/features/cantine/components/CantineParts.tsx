import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CommandeCantine, OperationCompte, PlafondsStatus, StatutCommande, StatutPaiement } from "../types/cantine";
import { periodeCourante } from "../types/cantine";
import { DetenuLie } from "../hooks/useDetenuChoisi";
import {
  formatFcfa,
  formatSignedFcfa,
  STATUT_COMMANDE_STYLES,
  STATUT_PAIEMENT_STYLES,
  TYPE_OPERATION_STYLES,
} from "../utils/money";
import { formatDateTime } from "../../../shared/utils/dates";

// ── Badges ─────────────────────────────────────────────────────────────────────────────────────
export const StatutCommandeBadge: React.FC<{ statut: StatutCommande; label: string }> = ({ statut, label }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_COMMANDE_STYLES[statut]}`}>{label}</span>
);

export const StatutPaiementBadge: React.FC<{ statut: StatutPaiement; label: string }> = ({ statut, label }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_PAIEMENT_STYLES[statut]}`}>{label}</span>
);

// ── Choix du détenu (proche référent) ──────────────────────────────────────────────────────────
export const DetenuSelect: React.FC<{
  detenus: DetenuLie[];
  value: DetenuLie | undefined;
  onChange: (id: number | null) => void;
}> = ({ detenus, value, onChange }) => {
  if (detenus.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Aucun détenu rattaché à votre compte. Le compte et la cantine sont accessibles une fois votre lien avec un détenu
        validé par l'établissement.
      </p>
    );
  }
  return (
    <label className="block max-w-md">
      <span className="mb-1 block text-sm font-medium text-gray-700">Détenu</span>
      <select value={value?.id ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
        <option value="">Choisir un détenu…</option>
        {detenus.map((d) => (
          <option key={d.id} value={d.id}>{d.nom}{d.lien ? ` (${d.lien})` : ""}</option>
        ))}
      </select>
    </label>
  );
};

// Raccourcis entre les écrans du proche, en gardant le détenu choisi
export const ProcheCantineNav: React.FC<{ detenuId?: number; active: "compte" | "cantine" | "commandes" }> = ({ detenuId, active }) => {
  const query = detenuId ? `?detenu=${detenuId}` : "";
  const items: [typeof active, string, string][] = [
    ["compte", "Compte et dépôts", "/compte-detenu"],
    ["cantine", "Cantine", "/cantine"],
    ["commandes", "Mes commandes", "/cantine/commandes"],
  ];
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Compte et cantine">
      {items.map(([key, label, path]) => (
        <Link key={key} to={`${path}${query}`} aria-current={active === key ? "page" : undefined}
          className={`rounded-full px-3 py-1 text-sm ${active === key ? "bg-slate-800 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
};

// ── Plafonds de la période ─────────────────────────────────────────────────────────────────────
const Gauge: React.FC<{ label: string; used: number; max: number; left: number }> = ({ label, used, max, left }) => {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="tabular-nums text-gray-900">{formatFcfa(left)} restants</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={used} aria-label={label}>
        <div className={`h-full rounded-full ${left === 0 ? "bg-red-600" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-500">{formatFcfa(used)} sur {formatFcfa(max)}</p>
    </div>
  );
};

export const PlafondsGauges: React.FC<{ plafonds: PlafondsStatus }> = ({ plafonds }) => (
  <div className="space-y-3">
    <p className="text-xs text-gray-500">Plafonds {periodeCourante(plafonds.periode)}, tous proches confondus</p>
    <Gauge label="Dépôts" used={plafonds.depot_utilise} max={plafonds.depot_max} left={plafonds.depot_restant} />
    <Gauge label="Dépenses cantine" used={plafonds.depense_utilisee} max={plafonds.depense_max} left={plafonds.depense_restante} />
  </div>
);

// ── Journal du compte ──────────────────────────────────────────────────────────────────────────
export const OperationsTable: React.FC<{ operations: OperationCompte[]; showAuthor?: boolean }> = ({ operations, showAuthor }) => {
  if (operations.length === 0) return <p className="text-sm text-gray-500">Aucune opération.</p>;
  // Le backend renvoie le journal du plus ancien au plus récent ; on affiche le plus récent en premier
  const rows = [...operations].reverse();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 pr-4 font-medium">Date</th>
            <th className="pb-2 pr-4 font-medium">Opération</th>
            {showAuthor && <th className="pb-2 pr-4 font-medium">Par</th>}
            <th className="pb-2 pr-4 text-right font-medium">Montant</th>
            <th className="pb-2 text-right font-medium">Solde après</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((op) => (
            <tr key={op.id}>
              <td className="whitespace-nowrap py-2 pr-4 text-gray-600">{formatDateTime(op.cree_le)}</td>
              <td className="py-2 pr-4">
                <span className="font-medium text-gray-900">{op.type_label}</span>
                {op.libelle && <span className="block text-xs text-gray-500">{op.libelle}</span>}
              </td>
              {showAuthor && <td className="py-2 pr-4 text-gray-700">{op.par_moi ? "Vous" : op.auteur_nom || "—"}</td>}
              <td className={`whitespace-nowrap py-2 pr-4 text-right tabular-nums font-medium ${TYPE_OPERATION_STYLES[op.type]}`}>
                {formatSignedFcfa(op.montant)}
              </td>
              <td className="whitespace-nowrap py-2 text-right tabular-nums text-gray-900">{formatFcfa(op.solde_apres)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Commande ───────────────────────────────────────────────────────────────────────────────────
export const CommandeCard: React.FC<{
  commande: CommandeCantine;
  showRelative?: boolean;
  actions?: React.ReactNode;
}> = ({ commande, showRelative, actions }) => (
  <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="font-semibold text-slate-800">Commande n° {commande.id} · {commande.detenu_nom}</p>
        <p className="text-xs text-gray-500">
          Passée le {formatDateTime(commande.cree_le)}
          {showRelative && commande.proche_nom ? ` par ${commande.proche_nom}` : ""}
        </p>
      </div>
      <StatutCommandeBadge statut={commande.statut} label={commande.statut_label} />
    </header>
    <ul className="mt-3 divide-y divide-gray-100 text-sm">
      {commande.lignes.map((l) => (
        <li key={l.id} className="flex justify-between gap-3 py-1.5">
          <span className="text-gray-800"><span className="tabular-nums font-medium">{l.quantite} ×</span> {l.nom_produit}</span>
          <span className="tabular-nums text-gray-600">{formatFcfa(l.montant)}</span>
        </li>
      ))}
    </ul>
    <p className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold text-slate-800">
      <span>Total</span><span className="tabular-nums">{formatFcfa(commande.montant_total)}</span>
    </p>
    <CommandeSuivi commande={commande} />
    {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
  </article>
);

const CommandeSuivi: React.FC<{ commande: CommandeCantine }> = ({ commande }) => {
  const lines = [
    commande.preparee_le && `Préparée le ${formatDateTime(commande.preparee_le)}`,
    commande.livree_le && `Livrée le ${formatDateTime(commande.livree_le)}`,
    commande.annulee_le && `Annulée le ${formatDateTime(commande.annulee_le)}${commande.motif_annulation ? ` : ${commande.motif_annulation}` : ""}`,
  ].filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <ul className="mt-2 space-y-0.5 text-xs text-gray-500">
      {lines.map((l) => <li key={l as string}>{l}</li>)}
    </ul>
  );
};

// Annulation avec motif obligatoire (proche tant que « en attente », AG / AP jusqu'à la livraison)
export const CancelCommandeButton: React.FC<{
  onCancel: (motif: string) => Promise<unknown>;
  pending?: boolean;
  hint?: string;
}> = ({ onCancel, pending, hint }) => {
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState("");
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
        Annuler
      </button>
    );
  }
  return (
    <form className="flex w-full flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (motif.trim()) onCancel(motif.trim()).then(() => setOpen(false), () => undefined);
      }}>
      <label className="block flex-1">
        <span className="mb-1 block text-xs font-medium text-gray-600">Motif de l'annulation{hint ? ` (${hint})` : ""}</span>
        <input value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={255} required autoFocus
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !motif.trim()}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50">
          Confirmer l'annulation
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
          Retour
        </button>
      </div>
    </form>
  );
};

export const ErrorList: React.FC<{ messages: string[] }> = ({ messages }) =>
  messages.length === 0 ? null : (
    <ul className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      {messages.map((m) => <li key={m}>{m}</li>)}
    </ul>
  );

export const SuccessNote: React.FC<{ message: string | null }> = ({ message }) =>
  message ? <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">{message}</p> : null;
