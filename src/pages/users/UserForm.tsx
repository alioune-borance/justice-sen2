import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useCreateUser, useUpdateUser } from "../../features/users/api/useUsers";
import { AppUser, CreateUserDto, RelativeLinkInput, UpdateUserDto } from "../../features/users/types/user";
import { Role } from "../../features/auth/types/user.types";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { isJudicialRole, roleLabel, roleRequiresPrison } from "../../features/auth/config/rbac";
import { useGetPrisons } from "../../features/prisons/api/useGetPrison";
import { Prison } from "../../features/prisons/types/prison";
import { useGetDetenus } from "../../features/detenus/api/useGetDetenu";
import { Detenu } from "../../features/detenus/types/detenu";
import { LIENS_PARENTE } from "../../features/proches/types/proche";
import { useCreateAffectation, useGetAffectations } from "../../features/affectations/api/affectations.api";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

interface AssignmentRow {
  detenu: string;
  reference_dossier: string;
}

interface LinkRow {
  detenu: string;
  lien_parente: string;
  motivation: string;
}

const EMPTY_LINK: LinkRow = { detenu: "", lien_parente: "MERE", motivation: "" };
const EMPTY_ASSIGNMENT: AssignmentRow = { detenu: "", reference_dossier: "" };

interface UserFormProps {
  // Absent : création
  target?: AppUser;
  onDone: (message: string) => void;
  onCancel: () => void;
}

// Création ou modification d'un compte. Les règles (rôles attribuables, établissement, périmètre)
// sont appliquées par le backend ; le formulaire n'affiche que les champs utiles au rôle choisi.
export const UserForm: React.FC<UserFormProps> = ({ target, onDone, onCancel }) => {
  const isEdit = !!target;
  const { user, role: myRole, can } = usePermissions();
  const { data: prisons = [] } = useGetPrisons();
  const { data: detenus = [] } = useGetDetenus();
  const canManageAssignments = can("judicial_assignments:create");
  const { data: allAssignments = [] } = useGetAffectations({ enabled: isEdit && canManageAssignments });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const createAssignment = useCreateAffectation();

  // Rôles proposés : ceux que le backend autorise au compte connecté (GET auth/me/)
  const assignableRoles: Role[] = (user?.assignable_roles ?? []).map((r) => r.value);
  // L'ADMIN_PRISON crée dans son établissement : le serveur l'impose
  const prisonImposed = myRole === "ADMIN_PRISON" && !!user?.rbac_enforced;

  const [form, setForm] = useState({
    username: target?.username ?? "",
    email: target?.email ?? "",
    first_name: target?.first_name ?? "",
    last_name: target?.last_name ?? "",
    role: (target?.role ?? assignableRoles.find((r) => r === "AGENT_PENITENTIAIRE") ?? assignableRoles[0] ?? "AGENT_PENITENTIAIRE") as Role,
    prison: target?.prison ? String(target.prison) : "",
    phone_number: target?.phone_number ?? "",
    national_id: target?.national_id ?? "",
    password: "",
  });
  const [links, setLinks] = useState<LinkRow[]>([{ ...EMPTY_LINK }]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const needsPrison = roleRequiresPrison(form.role);
  const isRelative = form.role === "PROCHE_REFERENT";
  // Greffier, juge d'instruction, procureur, avocat : la fonction sur le dossier est le rôle du compte
  const isJudicial = isJudicialRole(form.role);
  const pending = createUser.isPending || updateUser.isPending || createAssignment.isPending;

  const existingAssignments = useMemo(
    () => (target ? allAssignments.filter((a) => a.acteur === target.id && a.actif) : []),
    [allAssignments, target]
  );

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const prisonValue = (): number | null => {
    if (!needsPrison || prisonImposed) return null;
    return form.prison ? Number(form.prison) : null;
  };

  // Affectations saisies : créées après le compte, par l'API des affectations (SUPER_ADMIN)
  const saveAssignments = async (acteur: number): Promise<string[]> => {
    const failures: string[] = [];
    for (const row of assignments.filter((a) => a.detenu)) {
      try {
        await createAssignment.mutateAsync({
          acteur,
          detenu: Number(row.detenu),
          reference_dossier: row.reference_dossier.trim(),
        });
      } catch (error) {
        const name = detenuName(Number(row.detenu));
        failures.push(`Affectation à ${name} refusée : ${getApiErrorMessages(error).join(" ")}`);
      }
    }
    return failures;
  };

  const detenuName = (id: number) => {
    const d = (detenus as Detenu[]).find((x) => x.id === id);
    return d ? `${d.first_name} ${d.last_name}` : `#${id}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    try {
      let accountId: number;
      let message: string;
      if (isEdit && target) {
        const payload: UpdateUserDto = {
          email: form.email.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
        };
        if (form.role !== target.role) payload.role = form.role;
        // Établissement : envoyé seulement si l'utilisateur peut le choisir
        if (!prisonImposed) {
          const prison = prisonValue();
          if (prison !== target.prison) payload.prison = prison;
        }
        const saved = await updateUser.mutateAsync({ id: target.id, ...payload });
        accountId = saved.id;
        message = `Compte ${saved.username} modifié.`;
      } else {
        const relativeLinks: RelativeLinkInput[] = isRelative
          ? links
              .filter((l) => l.detenu)
              .map((l) => ({ detenu: Number(l.detenu), lien_parente: l.lien_parente, motivation: l.motivation.trim() }))
          : [];
        const payload: CreateUserDto = {
          username: form.username.trim(),
          email: form.email.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          role: form.role,
          prison: prisonValue(),
          phone_number: form.phone_number.trim(),
          national_id: form.national_id.trim(),
          links: relativeLinks,
          ...(form.password ? { password: form.password } : {}),
        };
        const created = await createUser.mutateAsync(payload);
        accountId = created.id;
        message = created.activation_email_sent
          ? `Compte ${created.username} créé : un email d'activation a été envoyé.`
          : `Compte ${created.username} créé.`;
      }

      const failures = isJudicial && canManageAssignments ? await saveAssignments(accountId) : [];
      if (failures.length) {
        // Le compte existe : on reste sur le formulaire pour corriger les affectations
        setErrors([message, ...failures]);
        setAssignments([]);
        return;
      }
      onDone(message);
    } catch (error) {
      setErrors(getApiErrorMessages(error));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h3 className="font-semibold text-slate-800">{isEdit ? `Modifier le compte ${target?.username}` : "Nouveau compte"}</h3>

      {errors.length > 0 && (
        <ul className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Identifiant *">
          <input name="username" value={form.username} onChange={update} required disabled={isEdit}
            className={`${INPUT} ${isEdit ? "bg-gray-100" : ""}`} />
        </Field>
        <Field label="Email *"><input type="email" name="email" value={form.email} onChange={update} required className={INPUT} /></Field>
        <Field label="Rôle *">
          <select name="role" value={form.role} onChange={update} className={INPUT}>
            {assignableRoles.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
        </Field>
        <Field label="Prénom"><input name="first_name" value={form.first_name} onChange={update} className={INPUT} /></Field>
        <Field label="Nom"><input name="last_name" value={form.last_name} onChange={update} className={INPUT} /></Field>

        {/* Établissement : affiché et obligatoire seulement pour les rôles prison */}
        {needsPrison && (
          <Field label="Établissement *">
            {prisonImposed ? (
              <input value={user?.prison?.name ?? ""} disabled className={`${INPUT} bg-gray-100`} />
            ) : (
              <select name="prison" value={form.prison} onChange={update} required className={INPUT}>
                <option value="">Sélectionner</option>
                {(prisons as Prison[]).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </Field>
        )}

        {isRelative && !isEdit && (
          <>
            <Field label="Téléphone *"><input name="phone_number" value={form.phone_number} onChange={update} required className={INPUT} /></Field>
            <Field label="N° de pièce d'identité *"><input name="national_id" value={form.national_id} onChange={update} required className={INPUT} /></Field>
          </>
        )}

        {!isEdit && (
          <Field label="Mot de passe (développement uniquement)">
            <input type="password" name="password" value={form.password} onChange={update} className={INPUT}
              placeholder="Sinon : email d'activation" autoComplete="new-password" />
          </Field>
        )}
      </div>

      {/* Proche référent : ses détenus (création) */}
      {isRelative && !isEdit && (
        <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
          <legend className="px-1 text-sm font-medium text-gray-700">Détenus liés *</legend>
          {links.map((link, index) => {
            const nonParent = LIENS_PARENTE.find((l) => l.value === link.lien_parente)?.nonParent;
            const set = (patch: Partial<LinkRow>) =>
              setLinks((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
            return (
              <div key={index} className="grid grid-cols-1 items-end gap-3 md:grid-cols-[2fr_1fr_2fr_auto]">
                <Field label="Détenu">
                  <DetenuSelect value={link.detenu} onChange={(v) => set({ detenu: v })} detenus={detenus as Detenu[]} required />
                </Field>
                <Field label="Lien">
                  <select value={link.lien_parente} onChange={(e) => set({ lien_parente: e.target.value })} className={INPUT}>
                    {LIENS_PARENTE.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </Field>
                <Field label={nonParent ? "Nature de la relation *" : "Précision"}>
                  <input value={link.motivation} onChange={(e) => set({ motivation: e.target.value })} required={nonParent} className={INPUT} />
                </Field>
                <RemoveButton disabled={links.length === 1} onClick={() => setLinks((rows) => rows.filter((_, i) => i !== index))} />
              </div>
            );
          })}
          <AddButton label="Ajouter un détenu" onClick={() => setLinks((rows) => [...rows, { ...EMPTY_LINK }])} />
        </fieldset>
      )}
      {isRelative && isEdit && (
        <p className="text-sm text-gray-600">
          Les liens de ce proche avec ses détenus se gèrent dans la file{" "}
          <Link to="/proches" className="text-blue-600 hover:underline">Proches à valider</Link>.
        </p>
      )}

      {/* Acteur judiciaire : ses détenus affectés (SUPER_ADMIN) */}
      {isJudicial && (
        canManageAssignments ? (
          <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
            <legend className="px-1 text-sm font-medium text-gray-700">Détenus affectés</legend>
            {existingAssignments.length > 0 && (
              <ul className="space-y-1 text-sm text-gray-700">
                {existingAssignments.map((a) => (
                  <li key={a.id}>
                    {a.detenu_nom}{a.reference_dossier ? `, dossier ${a.reference_dossier}` : ""}
                  </li>
                ))}
              </ul>
            )}
            {assignments.map((row, index) => {
              const set = (patch: Partial<AssignmentRow>) =>
                setAssignments((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
              return (
                <div key={index} className="grid grid-cols-1 items-end gap-3 md:grid-cols-[2fr_1fr_auto]">
                  <Field label="Détenu">
                    <DetenuSelect value={row.detenu} onChange={(v) => set({ detenu: v })} detenus={detenus as Detenu[]} required />
                  </Field>
                  <Field label="Référence du dossier">
                    <input value={row.reference_dossier} onChange={(e) => set({ reference_dossier: e.target.value })} className={INPUT} />
                  </Field>
                  <RemoveButton onClick={() => setAssignments((rows) => rows.filter((_, i) => i !== index))} />
                </div>
              );
            })}
            <AddButton label="Affecter un détenu" onClick={() => setAssignments((rows) => [...rows, { ...EMPTY_ASSIGNMENT }])} />
            <p className="text-xs text-gray-500">
              Fin d'une affectation : écran <Link to="/affectations" className="text-blue-600 hover:underline">Affectations judiciaires</Link>.
            </p>
          </fieldset>
        ) : (
          <p className="text-sm text-gray-600">Les détenus d'un acteur judiciaire sont affectés par le super administrateur.</p>
        )
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Annuler
        </button>
        <button type="submit" disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le compte"}
        </button>
      </div>
    </form>
  );
};

export const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    {children}
  </label>
);

const DetenuSelect: React.FC<{ value: string; onChange: (v: string) => void; detenus: Detenu[]; required?: boolean }> = ({
  value,
  onChange,
  detenus,
  required,
}) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className={INPUT}>
    <option value="">Sélectionner</option>
    {detenus.map((d) => (
      <option key={d.id} value={d.id}>
        {d.first_name} {d.last_name} {d.matricule_number ? `(${d.matricule_number})` : ""}
      </option>
    ))}
  </select>
);

const AddButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
    <Plus className="h-4 w-4" /> {label}
  </button>
);

const RemoveButton: React.FC<{ onClick: () => void; disabled?: boolean }> = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled} aria-label="Retirer"
    className="mb-1 rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 disabled:opacity-30">
    <Trash2 className="h-4 w-4" />
  </button>
);
