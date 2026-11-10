import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useCreateDemande } from "../../features/demandes-visite/api/useDemandes";
import {
  CREATION_FILE_FIELDS,
  CreationFileField,
  MAX_DOCUMENT_BYTES,
  MAX_EXTRA_VISITORS,
  MAX_VALIDITY_DAYS,
} from "../../features/demandes-visite/types/demande";
import { VisiteurSupplementaire } from "../../features/permis/types/permis";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { RelativeMeLink } from "../../features/auth/types/user.types";
import { ACCEPTED_DOCUMENTS } from "../../shared/api/download";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const INPUT = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

// Proche référent : dépôt d'une demande de visite pour un détenu dont le lien est validé.
// Les contrôles (lien actif, statut du détenu, une demande ouverte par lien, fichiers) sont faits par le backend.
export const DemandeVisiteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const createDemande = useCreateDemande();

  const activeLinks = (user?.links ?? []).filter(
    (l): l is RelativeMeLink => l.type === "relative" && l.status === "ACTIF" && l.prisoner_id !== null
  );
  const today = new Date();

  const [lien, setLien] = useState(activeLinks.length === 1 ? String(activeLinks[0].id) : "");
  const [debut, setDebut] = useState(isoDate(today));
  const [fin, setFin] = useState("");
  const [message, setMessage] = useState("");
  const [visiteurs, setVisiteurs] = useState<VisiteurSupplementaire[]>([]);
  const [fichiers, setFichiers] = useState<Partial<Record<CreationFileField, File>>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const maxFin = isoDate(addDays(new Date(debut || isoDate(today)), MAX_VALIDITY_DAYS));

  const pickFile = (field: CreationFileField, file: File | undefined) => {
    setErrors([]);
    if (file && file.size > MAX_DOCUMENT_BYTES) {
      setErrors([`« ${file.name} » dépasse 5 Mo.`]);
      return;
    }
    setFichiers((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    if (!fichiers.demande_manuscrite) {
      setErrors(["La demande manuscrite est obligatoire."]);
      return;
    }
    try {
      const created = await createDemande.mutateAsync({
        lien: Number(lien),
        date_souhaitee_debut: debut,
        date_souhaitee_fin: fin || undefined,
        message: message.trim(),
        visiteurs_supplementaires: visiteurs.filter((v) => v.nom.trim()),
        fichiers,
      });
      navigate(`/mes-demandes/${created.id}`, { replace: true });
    } catch (error) {
      setErrors(getApiErrorMessages(error));
    }
  };

  if (activeLinks.length === 0) {
    return (
      <div className="max-w-3xl space-y-4">
        <BackLink />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Vous ne pouvez déposer une demande qu'après la validation de votre lien avec un détenu par l'établissement.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <BackLink />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">Nouvelle demande de visite</h2>

        {errors.length > 0 && (
          <ul className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errors.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block md:col-span-3">
            <span className="mb-1 block text-sm font-medium text-gray-700">Détenu *</span>
            <select value={lien} onChange={(e) => setLien(e.target.value)} required className={INPUT}>
              <option value="">Sélectionner</option>
              {activeLinks.map((l) => (
                <option key={l.id} value={l.id}>{l.prisoner_name} ({l.relationship_label})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Visite à partir du *</span>
            <input type="date" value={debut} min={isoDate(today)} onChange={(e) => setDebut(e.target.value)} required className={INPUT} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Jusqu'au</span>
            <input type="date" value={fin} min={debut} max={maxFin} onChange={(e) => setFin(e.target.value)} className={INPUT} />
            <span className="mt-1 block text-xs text-gray-500">Facultatif ; au plus {MAX_VALIDITY_DAYS} jours.</span>
          </label>
          <label className="block md:col-span-3">
            <span className="mb-1 block text-sm font-medium text-gray-700">Objet de la demande</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={2000} className={INPUT} />
          </label>
        </div>

        <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
          <legend className="px-1 text-sm font-medium text-gray-700">
            Autres visiteurs (au plus {MAX_EXTRA_VISITORS})
          </legend>
          {visiteurs.map((v, index) => {
            const set = (patch: Partial<VisiteurSupplementaire>) =>
              setVisiteurs((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
            return (
              <div key={index} className="grid grid-cols-1 items-end gap-3 md:grid-cols-[2fr_1fr_auto]">
                <input value={v.nom} onChange={(e) => set({ nom: e.target.value })} placeholder="Nom complet" required className={INPUT} />
                <input value={v.piece_identite} onChange={(e) => set({ piece_identite: e.target.value })}
                  placeholder="N° de pièce d'identité" required className={INPUT} />
                <button type="button" aria-label="Retirer" onClick={() => setVisiteurs((rows) => rows.filter((_, i) => i !== index))}
                  className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {visiteurs.length < MAX_EXTRA_VISITORS && (
            <button type="button" onClick={() => setVisiteurs((rows) => [...rows, { nom: "", piece_identite: "" }])}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <Plus className="h-4 w-4" /> Ajouter un visiteur
            </button>
          )}
        </fieldset>

        <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
          <legend className="px-1 text-sm font-medium text-gray-700">Pièces justificatives (PDF, JPG ou PNG, 5 Mo au plus)</legend>
          {CREATION_FILE_FIELDS.map(({ field, label, required }) => (
            <label key={field} className="grid grid-cols-1 items-center gap-2 text-sm md:grid-cols-[1fr_2fr]">
              <span className="font-medium text-gray-700">{label}{required ? " *" : ""}</span>
              <input type="file" accept={ACCEPTED_DOCUMENTS} required={required}
                onChange={(e) => pickFile(field, e.target.files?.[0])} className="text-sm" />
            </label>
          ))}
        </fieldset>

        <div className="flex justify-end gap-3">
          <Link to="/mes-demandes" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Annuler
          </Link>
          <button type="submit" disabled={createDemande.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {createDemande.isPending ? "Envoi…" : "Envoyer la demande"}
          </button>
        </div>
      </form>
    </div>
  );
};

const BackLink: React.FC = () => (
  <Link to="/mes-demandes" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
    <ArrowLeft className="h-4 w-4" /> Mes demandes
  </Link>
);
