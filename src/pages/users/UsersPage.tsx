import React, { useMemo, useState } from "react";
import { Plus, Search, UserCheck, UserX, Users as UsersIcon, X } from "lucide-react";
import { useGetUsers, useCreateUser, useSetUserActive } from "../../features/users/api/useUsers";
import {
  ACCOUNT_STATUS_LABELS,
  AppUser,
  CreateUserDto,
  PRISON_ROLES_LIST,
  ROLE_LABELS,
} from "../../features/users/types/user";
import { Role } from "../../features/auth/types/user.types";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { Can } from "../../features/auth/components/Can";
import { useGetPrisons } from "../../features/prisons/api/useGetPrison";
import { Prison } from "../../features/prisons/types/prison";
import { useGetDetenus } from "../../features/detenus/api/useGetDetenu";
import { Detenu } from "../../features/detenus/types/detenu";
import { LIENS_PARENTE } from "../../features/proches/types/proche";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  REJECTED: "bg-red-100 text-red-800",
  DISABLED: "bg-gray-200 text-gray-700",
};

const EMPTY_FORM = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  role: "AGENT_PENITENTIAIRE" as Role,
  prison: "",
  phone_number: "",
  national_id: "",
  password: "",
  detenu: "",
  lien_parente: "MERE",
  motivation: "",
};

// Gestion des comptes : SUPER_ADMIN (tous les rôles) ; ADMIN_PRISON (rôles prison de son établissement ;
// il voit les proches de ses détenus mais ne gère pas leurs comptes)
export const UsersPage: React.FC = () => {
  const { user, role, isMyPrison } = usePermissions();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const { data: users = [], isLoading, isError } = useGetUsers({ search: search || undefined, role: roleFilter || undefined });
  const { data: prisons = [] } = useGetPrisons();
  const { data: detenus = [] } = useGetDetenus();
  const createUser = useCreateUser();
  const setActive = useSetUserActive();

  const isAdminPrison = role === "ADMIN_PRISON" && !!user?.rbac_enforced;
  // Rôles attribuables donnés par le backend (GET auth/me/) : l'ADMIN_PRISON n'attribue que les rôles prison
  const assignableRoles: Role[] = (user?.assignable_roles ?? []).map((r) => r.value);
  const needsPrison = PRISON_ROLES_LIST.includes(form.role);
  const isRelative = form.role === "PROCHE_REFERENT";
  const lienNonParent = LIENS_PARENTE.find((l) => l.value === form.lien_parente)?.nonParent;

  const prisonName = useMemo(() => {
    const names = new Map(prisons.map((p: Prison) => [p.id, p.name]));
    return (id: number | null) => (id ? names.get(id) ?? `#${id}` : "—");
  }, [prisons]);

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    const payload: CreateUserDto = {
      username: form.username.trim(),
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      role: form.role,
      // ADMIN_PRISON : l'établissement est imposé par le serveur
      prison: needsPrison && !isAdminPrison && form.prison ? Number(form.prison) : null,
      phone_number: form.phone_number.trim(),
      national_id: form.national_id.trim(),
      links: isRelative && form.detenu
        ? [{ detenu: Number(form.detenu), lien_parente: form.lien_parente, motivation: form.motivation }]
        : [],
      ...(form.password ? { password: form.password } : {}),
    };
    try {
      const created = await createUser.mutateAsync(payload);
      setNotice(
        created.activation_email_sent
          ? `Compte ${created.username} créé : un email d'activation a été envoyé.`
          : `Compte ${created.username} créé.`
      );
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (error) {
      setErrors(getApiErrorMessages(error));
    }
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
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Fermer" : "Nouveau compte"}
          </button>
        </Can>
      </div>

      {notice && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm flex justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-800">Nouveau compte</h3>
          {errors.length > 0 && (
            <ul className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm list-disc list-inside">
              {errors.map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Identifiant *"><input name="username" value={form.username} onChange={update} required className={INPUT} /></Field>
            <Field label="Email *"><input type="email" name="email" value={form.email} onChange={update} required className={INPUT} /></Field>
            <Field label="Rôle *">
              <select name="role" value={form.role} onChange={update} className={INPUT}>
                {assignableRoles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </Field>
            <Field label="Prénom"><input name="first_name" value={form.first_name} onChange={update} className={INPUT} /></Field>
            <Field label="Nom"><input name="last_name" value={form.last_name} onChange={update} className={INPUT} /></Field>
            {needsPrison && (
              <Field label="Établissement *">
                {isAdminPrison ? (
                  <input value={user?.prison?.name ?? ""} disabled className={`${INPUT} bg-gray-100`} />
                ) : (
                  <select name="prison" value={form.prison} onChange={update} required className={INPUT}>
                    <option value="">Sélectionner</option>
                    {prisons.map((p: Prison) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </Field>
            )}
            {isRelative && (
              <>
                <Field label="Téléphone *"><input name="phone_number" value={form.phone_number} onChange={update} required className={INPUT} /></Field>
                <Field label="N° de pièce d'identité *"><input name="national_id" value={form.national_id} onChange={update} required className={INPUT} /></Field>
                <Field label="Détenu *">
                  <select name="detenu" value={form.detenu} onChange={update} required className={INPUT}>
                    <option value="">Sélectionner</option>
                    {detenus.map((d: Detenu) => (
                      <option key={d.id} value={d.id}>{d.first_name} {d.last_name} {d.matricule_number ? `(${d.matricule_number})` : ""}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Lien *">
                  <select name="lien_parente" value={form.lien_parente} onChange={update} className={INPUT}>
                    {LIENS_PARENTE.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </Field>
                {lienNonParent && (
                  <Field label="Nature de la relation *">
                    <textarea name="motivation" value={form.motivation} onChange={update} required rows={2} className={INPUT} />
                  </Field>
                )}
              </>
            )}
            <Field label="Mot de passe (développement uniquement)">
              <input type="password" name="password" value={form.password} onChange={update} className={INPUT}
                placeholder="Sinon : email d'activation" />
            </Field>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={createUser.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createUser.isPending ? "Création..." : "Créer le compte"}
            </button>
          </div>
        </form>
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
                  <td className="py-3 pr-4">{u.role ? ROLE_LABELS[u.role] : <span className="text-amber-600">Aucun rôle</span>}</td>
                  <td className="py-3 pr-4">{prisonName(u.prison)}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[u.account_status ?? ""] ?? "bg-gray-100"}`}>
                      {ACCOUNT_STATUS_LABELS[u.account_status ?? ""] ?? "—"}
                    </span>
                  </td>
                  <td className="py-3">
                    {/* ADMIN_PRISON : seulement le personnel de sa prison (pas les comptes des proches) */}
                    <Can perm="users:update" when={u.id !== user?.id && (!isAdminPrison || isMyPrison(u.prison))}>
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

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    {children}
  </label>
);
