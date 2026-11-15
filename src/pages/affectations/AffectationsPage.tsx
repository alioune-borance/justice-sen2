import React, { useState } from "react";
import { Gavel } from "lucide-react";
import { useCreateAffectation, useEndAffectation, useGetAffectations } from "../../features/affectations/api/affectations.api";
import { useGetUsers } from "../../features/users/api/useUsers";
import { useGetDetenus } from "../../features/detenus/api/useGetDetenu";
import { Detenu } from "../../features/detenus/types/detenu";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { Can } from "../../features/auth/components/Can";
import { isJudicialRole, roleLabel } from "../../features/auth/config/rbac";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";

// Affectations des acteurs judiciaires : créées par le SUPER_ADMIN uniquement (D25)
export const AffectationsPage: React.FC = () => {
  const { can } = usePermissions();
  const canManage = can("judicial_assignments:create");
  const { data: affectations = [], isLoading } = useGetAffectations();
  // Comptes judiciaires (greffier, juge d'instruction, procureur, avocat) : la fonction = le rôle
  const { data: users = [] } = useGetUsers(undefined, { enabled: canManage });
  const acteurs = users.filter((u) => u.is_active && isJudicialRole(u.role));
  const { data: detenus = [] } = useGetDetenus();
  const create = useCreateAffectation();
  const end = useEndAffectation();
  const [form, setForm] = useState({ acteur: "", detenu: "", reference_dossier: "" });
  const [errors, setErrors] = useState<string[]>([]);

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    try {
      await create.mutateAsync({
        acteur: Number(form.acteur),
        detenu: Number(form.detenu),
        reference_dossier: form.reference_dossier,
      });
      setForm((prev) => ({ ...prev, detenu: "", reference_dossier: "" }));
    } catch (error) {
      setErrors(getApiErrorMessages(error));
    }
  };

  const finish = (id: number) => {
    if (window.confirm("Mettre fin à cette affectation ? L'accès au détenu sera retiré immédiatement.")) {
      end.mutate(id, { onError: (error) => window.alert(getApiErrorMessages(error).join(" ")) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 rounded-lg p-2">
          <Gavel className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{canManage ? "Affectations judiciaires" : "Mes affectations"}</h2>
      </div>

      <Can perm="judicial_assignments:create">
        <form onSubmit={submit} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-3">
          <h3 className="font-semibold text-slate-800">Nouvelle affectation</h3>
          {errors.length > 0 && <p className="text-sm text-red-600">{errors.join(" ")}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select name="acteur" value={form.acteur} onChange={update} required className={INPUT}>
              <option value="">Acteur judiciaire</option>
              {acteurs.map((a) => (
                <option key={a.id} value={a.id}>
                  {[a.first_name, a.last_name].filter(Boolean).join(" ") || a.username} — {roleLabel(a.role)}
                </option>
              ))}
            </select>
            <select name="detenu" value={form.detenu} onChange={update} required className={INPUT}>
              <option value="">Détenu</option>
              {(detenus as Detenu[]).map((d) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name} {d.matricule_number ? `(${d.matricule_number})` : ""}</option>)}
            </select>
            <input name="reference_dossier" value={form.reference_dossier} onChange={update} placeholder="Référence du dossier" className={INPUT} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={create.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Affecter
            </button>
          </div>
        </form>
      </Can>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        {isLoading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">Acteur</th>
                <th className="pb-3 pr-4 font-medium">Fonction</th>
                <th className="pb-3 pr-4 font-medium">Détenu</th>
                <th className="pb-3 pr-4 font-medium">Dossier</th>
                <th className="pb-3 pr-4 font-medium">Période</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {affectations.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-500">Aucune affectation</td></tr>}
              {affectations.map((a) => (
                <tr key={a.id} className={a.actif ? "" : "text-gray-400"}>
                  <td className="py-3 pr-4">{a.acteur_nom}</td>
                  <td className="py-3 pr-4">{a.fonction_label}</td>
                  <td className="py-3 pr-4">{a.detenu_nom}</td>
                  <td className="py-3 pr-4">{a.reference_dossier || "—"}</td>
                  <td className="py-3 pr-4">
                    {new Date(a.date_debut).toLocaleDateString("fr-FR")}
                    {a.date_fin ? ` → ${new Date(a.date_fin).toLocaleDateString("fr-FR")}` : ""}
                    {!a.actif && " (terminée)"}
                  </td>
                  <td className="py-3">
                    <Can perm="judicial_assignments:update" when={a.actif}>
                      <button onClick={() => finish(a.id)} className="text-sm text-red-600 hover:text-red-800">Terminer</button>
                    </Can>
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
