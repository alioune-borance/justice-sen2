import React, { useState } from "react";
import { Building2, Pencil, Plus, X } from "lucide-react";
import { useCreatePrison, useGetPrisons, useUpdatePrison } from "../../features/prisons/api/useGetPrison";
import { Prison } from "../../features/prisons/types/prison";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { PRISON_ACTIONS } from "../../features/auth/config/rbac";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";
const EMPTY = { name: "", location: "", capacity: "", type: "" };

// Établissements : le SUPER_ADMIN les voit tous, en ajoute et les modifie. Un compte rattaché à une prison
// (AP, SP…) ne voit que la sienne ; l'AP et le SP la modifient, sans pouvoir en ajouter.
export const EtablissementsPage: React.FC = () => {
  const { user, allows, isMyPrison } = usePermissions();
  const { data: allPrisons = [], isLoading } = useGetPrisons();
  const ownPrisonId = user?.prison?.id ?? null;
  const prisons = ownPrisonId === null ? allPrisons : allPrisons.filter((p: Prison) => p.id === ownPrisonId);
  const canCreate = allows(PRISON_ACTIONS.create);
  const canUpdate = (prison: Prison) =>
    allows(PRISON_ACTIONS.update) && isMyPrison(prison.id) && (ownPrisonId === null || prison.id === ownPrisonId);
  const create = useCreatePrison();
  const update = useUpdatePrison();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const close = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
    setErrors([]);
  };

  const startEdit = (prison: Prison) => {
    setForm({ name: prison.name, location: prison.location, capacity: String(prison.capacity ?? ""), type: prison.type ?? "" });
    setEditingId(prison.id);
    setShowForm(true);
    setErrors([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    const payload = { ...form, capacity: Number(form.capacity) };
    try {
      if (editingId === null) {
        await create.mutateAsync(payload);
      } else {
        await update.mutateAsync({ id: editingId, payload });
      }
      close();
    } catch (error) {
      setErrors(getApiErrorMessages(error));
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-lg p-2">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {ownPrisonId === null ? "Établissements pénitentiaires" : "Mon établissement"}
          </h2>
        </div>
        {canCreate && !showForm && (
          <button
            onClick={() => { close(); setShowForm(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvel établissement
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              {editingId === null ? "Nouvel établissement" : "Modifier l'établissement"}
            </h3>
            <button type="button" onClick={close} className="text-gray-500 hover:text-gray-800" title="Fermer">
              <X className="h-5 w-5" />
            </button>
          </div>
          {errors.length > 0 && <p className="text-sm text-red-600">{errors.join(" ")}</p>}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input name="name" value={form.name} onChange={change} required placeholder="Nom (ex. MAC de Thiès)" className={INPUT} />
            <input name="location" value={form.location} onChange={change} required placeholder="Localisation" className={INPUT} />
            <input name="capacity" type="number" min={1} value={form.capacity} onChange={change} required placeholder="Capacité" className={INPUT} />
            <input name="type" value={form.type} onChange={change} required placeholder="Type (ex. MAC, Camp pénal)" className={INPUT} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {editingId === null ? "Créer l'établissement" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        {isLoading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">Nom</th>
                <th className="pb-3 pr-4 font-medium">Localisation</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Capacité</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prisons.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">Aucun établissement</td></tr>
              )}
              {prisons.map((prison: Prison) => (
                <tr key={prison.id}>
                  <td className="py-3 pr-4 font-medium text-slate-800">{prison.name}</td>
                  <td className="py-3 pr-4">{prison.location}</td>
                  <td className="py-3 pr-4">{prison.type ?? "—"}</td>
                  <td className="py-3 pr-4">{prison.capacity ?? "—"}</td>
                  <td className="py-3 text-right">
                    {canUpdate(prison) && (
                      <button
                        onClick={() => startEdit(prison)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </button>
                    )}
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
