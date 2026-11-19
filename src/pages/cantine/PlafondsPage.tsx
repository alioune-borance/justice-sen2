import React, { useState } from "react";
import { Gauge } from "lucide-react";
import { usePlafonds, useSavePlafonds } from "../../features/cantine/api/useCantine";
import { ErrorList, SuccessNote } from "../../features/cantine/components/CantineParts";
import { PERIODES_PLAFOND, periodeLabel, PlafondsCantine, PlafondsInput } from "../../features/cantine/types/cantine";
import { formatFcfa } from "../../features/cantine/utils/money";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { CANTEEN_ACTIONS } from "../../features/auth/config/rbac";
import { formatDateTime } from "../../shared/utils/dates";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

// Plafonds de dépôt et de dépense de l'établissement, par détenu et par période calendaire,
// tous proches confondus. Modifiés par l'ADMIN_PRISON, lus par le superviseur. Sans ligne,
// le backend applique ses valeurs par défaut (CANTEEN_DEFAULT_*).
export const PlafondsPage: React.FC = () => {
  const { allows, isMyPrison } = usePermissions();
  const { data = [], isLoading, isError, error } = usePlafonds();
  const plafonds: PlafondsCantine | undefined = data[0];
  const canManage = allows(CANTEEN_ACTIONS.manageLimits) && (!plafonds || isMyPrison(plafonds.prison));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2"><Gauge className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Plafonds de la cantine</h2>
          <p className="text-sm text-gray-500">Montants maximum par détenu sur la période, tous proches confondus</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : isError ? (
        <ErrorList messages={getApiErrorMessages(error)} />
      ) : (
        <>
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {plafonds ? (
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                <Item label="Période" value={periodeLabel(plafonds.periode)} />
                <Item label="Dépôts maximum" value={formatFcfa(plafonds.depot_max)} />
                <Item label="Dépenses maximum" value={formatFcfa(plafonds.depense_max)} />
                <p className="text-xs text-gray-500 sm:col-span-3">Dernière modification le {formatDateTime(plafonds.modifie_le)}</p>
              </dl>
            ) : (
              <p className="text-sm text-gray-600">
                Aucun plafond propre à l'établissement : les valeurs par défaut du système s'appliquent
                (visibles par les proches sur le compte de chaque détenu).
              </p>
            )}
          </section>

          {canManage && <PlafondsForm plafonds={plafonds} />}
        </>
      )}
    </div>
  );
};

const PlafondsForm: React.FC<{ plafonds?: PlafondsCantine }> = ({ plafonds }) => {
  const save = useSavePlafonds();
  const [form, setForm] = useState<PlafondsInput>({
    periode: plafonds?.periode ?? "SEMAINE",
    depot_max: plafonds?.depot_max ?? 0,
    depense_max: plafonds?.depense_max ?? 0,
  });
  const [messages, setMessages] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessages([]);
    setSuccess(null);
    try {
      await save.mutateAsync({ id: plafonds?.id, dto: form });
      setSuccess("Plafonds enregistrés. Ils s'appliquent aux prochains dépôts et commandes.");
    } catch (error) {
      setMessages(getApiErrorMessages(error));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-slate-800">{plafonds ? "Modifier les plafonds" : "Définir les plafonds de l'établissement"}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Période</span>
          <select value={form.periode} onChange={(e) => setForm((f) => ({ ...f, periode: e.target.value as PlafondsInput["periode"] }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {PERIODES_PLAFOND.map((p) => <option key={p.value} value={p.value}>{p.label} calendaire</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Dépôts maximum (F CFA)</span>
          <input type="number" required min={0} step={1} value={form.depot_max}
            onChange={(e) => setForm((f) => ({ ...f, depot_max: Number(e.target.value) }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Dépenses maximum (F CFA)</span>
          <input type="number" required min={0} step={1} value={form.depense_max}
            onChange={(e) => setForm((f) => ({ ...f, depense_max: Number(e.target.value) }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <ErrorList messages={messages} />
      <SuccessNote message={success} />
      <button type="submit" disabled={save.isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
        {save.isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
};

const Item: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-gray-500">{label}</dt>
    <dd className="text-lg font-semibold tabular-nums text-slate-800">{value}</dd>
  </div>
);
