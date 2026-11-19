import React, { useMemo, useState } from "react";
import { ClipboardCheck, PackageCheck, Truck } from "lucide-react";
import { useCommandeAction, useCommandes } from "../../features/cantine/api/useCantine";
import { CancelCommandeButton, CommandeCard, ErrorList, SuccessNote } from "../../features/cantine/components/CantineParts";
import { CommandeCantine, StatutCommande } from "../../features/cantine/types/cantine";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { CANTEEN_ACTIONS } from "../../features/auth/config/rbac";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

type Tab = Extract<StatutCommande, "EN_ATTENTE" | "PREPAREE">;

const TABS: { value: Tab; label: string; empty: string }[] = [
  { value: "EN_ATTENTE", label: "À préparer", empty: "Aucune commande à préparer." },
  { value: "PREPAREE", label: "À livrer", empty: "Aucune commande à livrer." },
];

// ADMIN_PRISON, SUPERVISEUR_PRISON et agent pénitentiaire : commandes de la prison à préparer puis à livrer au détenu.
// Les plus anciennes d'abord. La liste se rafraîchit toute seule chaque minute.
export const PreparationCommandesPage: React.FC = () => {
  const { allows, isMyPrison } = usePermissions();
  const canHandle = allows(CANTEEN_ACTIONS.handleOrders);
  const [tab, setTab] = useState<Tab>("EN_ATTENTE");
  const aPreparer = useCommandes({ statut: "EN_ATTENTE" }, { poll: true });
  const aLivrer = useCommandes({ statut: "PREPAREE" }, { poll: true });
  const action = useCommandeAction();
  const [messages, setMessages] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const current = tab === "EN_ATTENTE" ? aPreparer : aLivrer;
  const commandes = useMemo(
    () => [...(current.data ?? [])].sort((a, b) => a.cree_le.localeCompare(b.cree_le)),
    [current.data]
  );

  const run = async (c: CommandeCantine, act: "prepare" | "deliver" | "cancel", ok: string, motif?: string) => {
    setMessages([]);
    setSuccess(null);
    try {
      await action.mutateAsync({ id: c.id, action: act, motif });
      setSuccess(ok);
    } catch (error) {
      setMessages(getApiErrorMessages(error));
      throw error;
    }
  };

  const count = (t: Tab) => (t === "EN_ATTENTE" ? aPreparer.data?.length : aLivrer.data?.length);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2"><ClipboardCheck className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Commandes cantine</h2>
          <p className="text-sm text-gray-500">Préparer les commandes payées par les proches, puis les remettre aux détenus</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t.value} type="button" role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)}
            className={`rounded-full px-3 py-1 text-sm ${tab === t.value ? "bg-slate-800 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
            {t.label}{count(t.value) !== undefined ? ` (${count(t.value)})` : ""}
          </button>
        ))}
      </div>

      <ErrorList messages={messages} />
      <SuccessNote message={success} />

      {current.isLoading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : current.isError ? (
        <ErrorList messages={getApiErrorMessages(current.error)} />
      ) : commandes.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">{TABS.find((t) => t.value === tab)?.empty}</p>
      ) : (
        <div className="space-y-4">
          {commandes.map((c) => (
            <CommandeCard key={c.id} commande={c} showRelative
              actions={
                canHandle && isMyPrison(c.prison) ? (
                  <>
                    {c.statut === "EN_ATTENTE" ? (
                      <button type="button" disabled={action.isPending}
                        onClick={() => run(c, "prepare", `Commande n° ${c.id} préparée.`).catch(() => undefined)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
                        <PackageCheck className="h-4 w-4" /> Marquer préparée
                      </button>
                    ) : (
                      <button type="button" disabled={action.isPending}
                        onClick={() => run(c, "deliver", `Commande n° ${c.id} livrée à ${c.detenu_nom}.`).catch(() => undefined)}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-800 disabled:opacity-50">
                        <Truck className="h-4 w-4" /> Marquer livrée
                      </button>
                    )}
                    <CancelCommandeButton pending={action.isPending} hint="remboursée au détenu, produits remis en stock"
                      onCancel={(motif) => run(c, "cancel", `Commande n° ${c.id} annulée et remboursée.`, motif)} />
                  </>
                ) : undefined
              } />
          ))}
        </div>
      )}
    </div>
  );
};
