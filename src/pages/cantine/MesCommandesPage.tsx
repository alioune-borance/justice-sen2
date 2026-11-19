import React, { useState } from "react";
import { PackageCheck } from "lucide-react";
import { useCommandeAction, useCommandes } from "../../features/cantine/api/useCantine";
import { useDetenuChoisi } from "../../features/cantine/hooks/useDetenuChoisi";
import {
  CancelCommandeButton,
  CommandeCard,
  DetenuSelect,
  ErrorList,
  ProcheCantineNav,
  SuccessNote,
} from "../../features/cantine/components/CantineParts";
import { STATUTS_COMMANDE, StatutCommande } from "../../features/cantine/types/cantine";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { CANTEEN_ACTIONS } from "../../features/auth/config/rbac";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

// Proche référent : suivi de ses commandes ; annulation (remboursée) tant qu'elle est en attente.
export const MesCommandesPage: React.FC = () => {
  const { detenus, detenu, choisir } = useDetenuChoisi();
  const { allows } = usePermissions();
  const [statut, setStatut] = useState<StatutCommande | "">("");
  const commandes = useCommandes({ detenu: detenu?.id, statut: statut || undefined }, { enabled: detenus.length > 0 });
  const action = useCommandeAction();
  const [messages, setMessages] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const cancel = async (id: number, motif: string) => {
    setMessages([]);
    setSuccess(null);
    try {
      await action.mutateAsync({ id, action: "cancel", motif });
      setSuccess(`Commande n° ${id} annulée : le montant est remboursé sur le compte.`);
    } catch (error) {
      setMessages(getApiErrorMessages(error));
      throw error;
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2"><PackageCheck className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mes commandes cantine</h2>
          <p className="text-sm text-gray-500">En attente, préparée, puis livrée au détenu</p>
        </div>
      </div>

      <ProcheCantineNav detenuId={detenu?.id} active="commandes" />

      <div className="flex flex-wrap items-end gap-4">
        {/* Plusieurs détenus : filtre facultatif (toutes les commandes sinon) */}
        {detenus.length > 1 ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Détenu</span>
            <select value={detenu?.id ?? ""} onChange={(e) => choisir(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Tous mes détenus</option>
              {detenus.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          </label>
        ) : (
          detenus.length === 0 && <DetenuSelect detenus={detenus} value={undefined} onChange={choisir} />
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">État</span>
          <select value={statut} onChange={(e) => setStatut(e.target.value as StatutCommande | "")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Tous</option>
            {STATUTS_COMMANDE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <ErrorList messages={messages} />
      <SuccessNote message={success} />

      {detenus.length > 0 && (
        commandes.isLoading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : commandes.isError ? (
          <ErrorList messages={getApiErrorMessages(commandes.error)} />
        ) : (commandes.data ?? []).length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Aucune commande.</p>
        ) : (
          <div className="space-y-4">
            {(commandes.data ?? []).map((c) => (
              <CommandeCard key={c.id} commande={c}
                actions={
                  c.statut === "EN_ATTENTE" && allows(CANTEEN_ACTIONS.order) ? (
                    <CancelCommandeButton pending={action.isPending} onCancel={(motif) => cancel(c.id, motif)} />
                  ) : undefined
                } />
            ))}
          </div>
        )
      )}
    </div>
  );
};
