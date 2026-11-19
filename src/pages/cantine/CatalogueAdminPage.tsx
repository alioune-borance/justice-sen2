import React, { useState } from "react";
import { Pencil, Plus, Store } from "lucide-react";
import { useProduits, useSaveProduit } from "../../features/cantine/api/useCantine";
import { ErrorList, SuccessNote } from "../../features/cantine/components/CantineParts";
import { ProduitCantine, ProduitInput } from "../../features/cantine/types/cantine";
import { formatFcfa } from "../../features/cantine/utils/money";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { CANTEEN_ACTIONS } from "../../features/auth/config/rbac";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

type Filtre = "TOUS" | "ACTIFS" | "INACTIFS";
const EMPTY: ProduitInput = { nom: "", description: "", prix: 0, stock: 0, actif: true };

// Catalogue de la cantine de l'établissement : géré par l'ADMIN_PRISON (pas de suppression, un produit
// se désactive), consulté par le superviseur. Prison imposée par le backend.
export const CatalogueAdminPage: React.FC = () => {
  const { allows, isMyPrison } = usePermissions();
  const canManage = allows(CANTEEN_ACTIONS.manageCatalogue);
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const produits = useProduits(filtre === "TOUS" ? undefined : { actif: filtre === "ACTIFS" });
  const save = useSaveProduit();

  // null : formulaire fermé ; "new" : création ; sinon le produit modifié
  const [edit, setEdit] = useState<ProduitCantine | "new" | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMessages([]);
    setSuccess(null);
    try {
      await fn();
      setSuccess(ok);
      return true;
    } catch (error) {
      setMessages(getApiErrorMessages(error));
      return false;
    }
  };

  const toggle = (p: ProduitCantine) =>
    run(() => save.mutateAsync({ id: p.id, dto: { actif: !p.actif } }),
      p.actif ? `« ${p.nom} » retiré du catalogue des proches.` : `« ${p.nom} » de nouveau proposé aux proches.`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2"><Store className="h-6 w-6 text-blue-600" /></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Catalogue de la cantine</h2>
            <p className="text-sm text-gray-500">Produits proposés aux proches ; les prix sont figés à la commande</p>
          </div>
        </div>
        {canManage && edit === null && (
          <button type="button" onClick={() => { setEdit("new"); setSuccess(null); }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nouveau produit
          </button>
        )}
      </div>

      {canManage && edit !== null && (
        <ProduitForm
          key={edit === "new" ? "new" : edit.id}
          initial={edit === "new" ? EMPTY : edit}
          pending={save.isPending}
          onCancel={() => setEdit(null)}
          onSubmit={async (dto) => {
            const ok = await run(
              () => save.mutateAsync({ id: edit === "new" ? undefined : edit.id, dto }),
              edit === "new" ? `« ${dto.nom} » ajouté au catalogue.` : `« ${dto.nom} » modifié.`
            );
            if (ok) setEdit(null);
          }}
        />
      )}

      <ErrorList messages={messages} />
      <SuccessNote message={success} />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer">
        {([["TOUS", "Tous"], ["ACTIFS", "Proposés"], ["INACTIFS", "Retirés"]] as [Filtre, string][]).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={filtre === value} onClick={() => setFiltre(value)}
            className={`rounded-full px-3 py-1 text-sm ${filtre === value ? "bg-slate-800 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {produits.isLoading ? (
          <p className="p-6 text-sm text-gray-500">Chargement…</p>
        ) : produits.isError ? (
          <div className="p-4"><ErrorList messages={getApiErrorMessages(produits.error)} /></div>
        ) : (produits.data ?? []).length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Aucun produit.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 text-right font-medium">Prix</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">État</th>
                {canManage && <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(produits.data ?? []).map((p) => (
                <tr key={p.id} className={p.actif ? "" : "bg-gray-50 text-gray-500"}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{p.nom}</span>
                    {p.description && <span className="block text-xs text-gray-500">{p.description}</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatFcfa(p.prix)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${p.stock === 0 ? "font-medium text-red-700" : ""}`}>
                    {p.stock === 0 ? "Rupture" : p.stock}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.actif ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                      {p.actif ? "Proposé" : "Retiré"}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {isMyPrison(p.prison) && (
                        <span className="inline-flex gap-2">
                          <button type="button" onClick={() => { setEdit(p); setSuccess(null); }}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">
                            <Pencil className="h-3.5 w-3.5" /> Modifier
                          </button>
                          <button type="button" disabled={save.isPending} onClick={() => toggle(p)}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                            {p.actif ? "Retirer" : "Remettre en vente"}
                          </button>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const ProduitForm: React.FC<{
  initial: ProduitInput;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (dto: ProduitInput) => void;
}> = ({ initial, pending, onCancel, onSubmit }) => {
  const [form, setForm] = useState<ProduitInput>(initial);
  const set = <K extends keyof ProduitInput>(key: K, value: ProduitInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const isNew = initial === EMPTY;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, nom: form.nom.trim(), description: form.description.trim() });
      }}
      className="grid grid-cols-1 gap-4 rounded-lg border border-blue-200 bg-blue-50/40 p-5 md:grid-cols-4">
      <h3 className="font-semibold text-slate-800 md:col-span-4">{isNew ? "Nouveau produit" : `Modifier « ${initial.nom} »`}</h3>
      <label className="block md:col-span-2">
        <span className="mb-1 block text-sm font-medium text-gray-700">Nom</span>
        <input required maxLength={120} value={form.nom} onChange={(e) => set("nom", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Prix (F CFA)</span>
        <input required type="number" min={1} step={1} value={form.prix || ""} onChange={(e) => set("prix", Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Stock</span>
        <input required type="number" min={0} step={1} value={form.stock} onChange={(e) => set("stock", Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </label>
      <label className="block md:col-span-3">
        <span className="mb-1 block text-sm font-medium text-gray-700">Description (facultative)</span>
        <input maxLength={255} value={form.description} onChange={(e) => set("description", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.actif} onChange={(e) => set("actif", e.target.checked)} />
        Proposé aux proches
      </label>
      <div className="flex gap-2 md:col-span-4">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Annuler
        </button>
      </div>
    </form>
  );
};
