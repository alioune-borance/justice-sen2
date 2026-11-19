import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBasket, ShoppingCart, Trash2 } from "lucide-react";
import { useComptes, useCreateCommande, useProduits } from "../../features/cantine/api/useCantine";
import { useDetenuChoisi } from "../../features/cantine/hooks/useDetenuChoisi";
import { DetenuSelect, ErrorList, ProcheCantineNav } from "../../features/cantine/components/CantineParts";
import { CompteArgent, MAX_QUANTITE_LIGNE, ProduitCantine } from "../../features/cantine/types/cantine";
import { formatFcfa } from "../../features/cantine/utils/money";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { CANTEEN_ACTIONS } from "../../features/auth/config/rbac";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

// Proche référent : catalogue de la cantine de l'établissement du détenu et panier.
export const CantinePage: React.FC = () => {
  const { detenus, detenu, choisir } = useDetenuChoisi();
  const comptes = useComptes({ detenu: detenu?.id }, { enabled: !!detenu });
  const compte = comptes.data?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2"><ShoppingBasket className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cantine</h2>
          <p className="text-sm text-gray-500">Commandez des produits pour le détenu ; ils sont payés sur son compte</p>
        </div>
      </div>

      <ProcheCantineNav detenuId={detenu?.id} active="cantine" />
      <DetenuSelect detenus={detenus} value={detenu} onChange={choisir} />

      {detenu && (
        comptes.isLoading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : comptes.isError ? (
          <ErrorList messages={getApiErrorMessages(comptes.error)} />
        ) : !compte ? (
          <p className="text-sm text-gray-500">Aucun compte ouvert pour ce détenu.</p>
        ) : (
          // Panier propre à chaque détenu : remis à zéro quand on en change
          <Boutique key={compte.detenu} compte={compte} />
        )
      )}
    </div>
  );
};

const Boutique: React.FC<{ compte: CompteArgent }> = ({ compte }) => {
  const { allows } = usePermissions();
  const produits = useProduits({ prison: compte.prison, actif: true });
  const order = useCreateCommande();
  const [panier, setPanier] = useState<Record<number, number>>({});
  const [messages, setMessages] = useState<string[]>([]);
  const [commandeId, setCommandeId] = useState<number | null>(null);

  const catalogue = useMemo(() => produits.data ?? [], [produits.data]);
  const lignes = useMemo(
    () =>
      catalogue
        .filter((p) => (panier[p.id] ?? 0) > 0)
        .map((p) => ({ produit: p, quantite: panier[p.id], montant: p.prix * panier[p.id] })),
    [catalogue, panier]
  );
  const total = lignes.reduce((sum, l) => sum + l.montant, 0);
  // Indicatif : le backend vérifie solde, plafond et stock au moment de la commande
  const overBalance = total > compte.solde;
  const overLimit = total > compte.plafonds.depense_restante;

  const setQuantite = (p: ProduitCantine, quantite: number) => {
    setCommandeId(null);
    const max = Math.min(p.stock, MAX_QUANTITE_LIGNE);
    setPanier((prev) => ({ ...prev, [p.id]: Math.max(0, Math.min(max, quantite)) }));
  };

  const submit = async () => {
    setMessages([]);
    try {
      const commande = await order.mutateAsync({
        detenu: compte.detenu,
        lignes: lignes.map((l) => ({ produit: l.produit.id, quantite: l.quantite })),
      });
      setPanier({});
      setCommandeId(commande.id);
    } catch (error) {
      setMessages(getApiErrorMessages(error));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="lg:col-span-2">
        {produits.isLoading ? (
          <p className="text-sm text-gray-500">Chargement du catalogue…</p>
        ) : produits.isError ? (
          <ErrorList messages={getApiErrorMessages(produits.error)} />
        ) : catalogue.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Aucun produit disponible dans cette cantine.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {catalogue.map((p) => {
              const quantite = panier[p.id] ?? 0;
              const max = Math.min(p.stock, MAX_QUANTITE_LIGNE);
              return (
                <li key={p.id} className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="font-medium text-slate-800">{p.nom}</p>
                  {p.description && <p className="mt-1 text-sm text-gray-500">{p.description}</p>}
                  <p className="mt-2 text-lg font-semibold tabular-nums text-slate-800">{formatFcfa(p.prix)}</p>
                  <p className={`text-xs ${p.stock === 0 ? "text-red-700" : "text-gray-500"}`}>
                    {p.stock === 0 ? "Rupture de stock" : `${p.stock} en stock`}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-3">
                    <button type="button" aria-label={`Retirer un ${p.nom}`} disabled={quantite === 0}
                      onClick={() => setQuantite(p, quantite - 1)}
                      className="rounded-lg border border-gray-300 p-1.5 hover:bg-gray-50 disabled:opacity-40">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center tabular-nums" aria-live="polite">{quantite}</span>
                    <button type="button" aria-label={`Ajouter un ${p.nom}`} disabled={quantite >= max}
                      onClick={() => setQuantite(p, quantite + 1)}
                      className="rounded-lg border border-gray-300 p-1.5 hover:bg-gray-50 disabled:opacity-40">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="h-fit space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-800"><ShoppingCart className="h-5 w-5" /> Panier</h3>
        {lignes.length === 0 ? (
          <p className="text-sm text-gray-500">Votre panier est vide.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {lignes.map((l) => (
              <li key={l.produit.id} className="flex items-center justify-between gap-2 py-2">
                <span className="text-gray-800">{l.quantite} × {l.produit.nom}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-gray-700">{formatFcfa(l.montant)}</span>
                  <button type="button" aria-label={`Retirer ${l.produit.nom} du panier`} onClick={() => setQuantite(l.produit, 0)}
                    className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <dl className="space-y-1 border-t border-gray-200 pt-3 text-sm">
          <div className="flex justify-between font-semibold text-slate-800"><dt>Total</dt><dd className="tabular-nums">{formatFcfa(total)}</dd></div>
          <div className="flex justify-between text-gray-600"><dt>Solde du compte</dt><dd className="tabular-nums">{formatFcfa(compte.solde)}</dd></div>
          <div className="flex justify-between text-gray-600"><dt>Dépenses encore possibles</dt><dd className="tabular-nums">{formatFcfa(compte.plafonds.depense_restante)}</dd></div>
        </dl>
        {overBalance && <p className="text-sm text-red-700">Le total dépasse le solde du compte.</p>}
        {!overBalance && overLimit && <p className="text-sm text-red-700">Le total dépasse le plafond de dépenses de la période.</p>}

        <ErrorList messages={messages} />
        {commandeId !== null && (
          <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">
            Commande n° {commandeId} enregistrée et payée sur le compte.{" "}
            <Link to={`/cantine/commandes?detenu=${compte.detenu}`} className="font-medium underline">Suivre mes commandes</Link>
          </p>
        )}

        {allows(CANTEEN_ACTIONS.order) && (
          <button type="button" onClick={submit} disabled={lignes.length === 0 || overBalance || overLimit || order.isPending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {order.isPending ? "Commande en cours…" : "Commander et payer"}
          </button>
        )}
      </aside>
    </div>
  );
};
