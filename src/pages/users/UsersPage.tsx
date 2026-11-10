import React, { useMemo, useState } from "react";
import { Pencil, Plus, Search, UserCheck, UserX, Users as UsersIcon, X } from "lucide-react";
import { useGetUsers, useSetUserActive } from "../../features/users/api/useUsers";
import { ACCOUNT_STATUS_LABELS, AppUser } from "../../features/users/types/user";
import { Role } from "../../features/auth/types/user.types";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { Can } from "../../features/auth/components/Can";
import { ROLE_LABELS, roleLabel } from "../../features/auth/config/rbac";
import { useGetPrisons } from "../../features/prisons/api/useGetPrison";
import { Prison } from "../../features/prisons/types/prison";
import { getApiErrorMessages } from "../../shared/api/errorMessages";
import { UserForm } from "./UserForm";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  REJECTED: "bg-red-100 text-red-800",
  DISABLED: "bg-gray-200 text-gray-700",
};

// Gestion des comptes : SUPER_ADMIN (tous les rôles) ; ADMIN_PRISON (rôles prison de son établissement ;
// il voit les proches de ses détenus mais ne gère pas leurs comptes)
export const UsersPage: React.FC = () => {
  const { user, role, isMyPrison } = usePermissions();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  // null : formulaire fermé ; "new" : création ; sinon le compte modifié
  const [editing, setEditing] = useState<AppUser | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data: users = [], isLoading, isError } = useGetUsers({ search: search || undefined, role: roleFilter || undefined });
  const { data: prisons = [] } = useGetPrisons();
  const setActive = useSetUserActive();

  const isAdminPrison = role === "ADMIN_PRISON" && !!user?.rbac_enforced;
  const assignable = useMemo(() => new Set<Role>((user?.assignable_roles ?? []).map((r) => r.value)), [user]);

  // Gestion d'un compte (affichage) : pas le sien ; ADMIN_PRISON : seulement le personnel de sa prison
  const canManage = (u: AppUser) =>
    u.id !== user?.id && (!isAdminPrison || isMyPrison(u.prison)) && (!user?.rbac_enforced || (u.role !== null && assignable.has(u.role)));

  const prisonName = useMemo(() => {
    const names = new Map(prisons.map((p: Prison) => [p.id, p.name]));
    return (id: number | null) => (id ? names.get(id) ?? `#${id}` : "—");
  }, [prisons]);

  const closeForm = (message?: string) => {
    setEditing(null);
    if (message) setNotice(message);
  };

  const toggleActive = (target: AppUser) => {
    const activate = !target.is_active;
    const question = activate
      ? `Réactiver le compte ${target.username} ?`
      : `Désactiver le compte ${target.username} ? Ses sessions seront fermées.`;
    if (!window.confirm(question)) return;
    setActive.mutate(
      { id: target.id, active: activate },
      { onError: (error) => window.alert(getApiErrorMessages(error).join(" ")) }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-lg p-2">
            <UsersIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Utilisateurs</h2>
        </div>
        <Can perm="users:create">
          <button
            onClick={() => setEditing((v) => (v ? null : "new"))}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {editing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Fermer" : "Nouveau compte"}
          </button>
        </Can>
      </div>

      {notice && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm flex justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {editing && (
        <UserForm
          key={editing === "new" ? "new" : editing.id}
          target={editing === "new" ? undefined : editing}
          onDone={(message) => closeForm(message)}
          onCancel={() => closeForm()}
        />
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (identifiant, nom, email)…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Tous les rôles</option>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {isError ? (
          <p className="text-red-600 text-sm">Impossible de charger les comptes.</p>
        ) : isLoading ? (
          <p className="text-gray-500 text-sm">Chargement…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">Compte</th>
                <th className="pb-3 pr-4 font-medium">Rôle</th>
                <th className="pb-3 pr-4 font-medium">Établissement</th>
                <th className="pb-3 pr-4 font-medium">Statut</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">Aucun compte</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-gray-900">{[u.first_name, u.last_name].filter(Boolean).join(" ") || u.username}</div>
                    <div className="text-xs text-gray-500">{u.username} — {u.email}</div>
                  </td>
                  <td className="py-3 pr-4">{u.role ? roleLabel(u.role) : <span className="text-amber-600">Aucun rôle</span>}</td>
                  <td className="py-3 pr-4">{prisonName(u.prison)}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[u.account_status ?? ""] ?? "bg-gray-100"}`}>
                      {ACCOUNT_STATUS_LABELS[u.account_status ?? ""] ?? "—"}
                    </span>
                  </td>
                  <td className="py-3 flex flex-wrap gap-3">
                    {/* ADMIN_PRISON : seulement le personnel de sa prison (pas les comptes des proches) */}
                    <Can perm="users:update" when={canManage(u)}>
                      <button onClick={() => setEditing(u)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                        <Pencil className="h-4 w-4" /> Modifier
                      </button>
                    </Can>
                    <Can perm="users:update" when={canManage(u)}>
                      <button onClick={() => toggleActive(u)} disabled={setActive.isPending}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        title={u.is_active ? "Désactiver" : "Réactiver"}>
                        {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        {u.is_active ? "Désactiver" : "Réactiver"}
                      </button>
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
