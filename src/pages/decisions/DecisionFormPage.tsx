import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCorrectDecision, useCreateDecision, useGetDecision } from "../../features/decisions/api/decisions.api";
import {
  DEFAULT_EFFECT,
  isSentenceProposal,
  MAX_DECISION_BYTES,
  STATUTS_PROPOSES,
  StatutPropose,
  TYPES_DECISION,
  TypeDecision,
} from "../../features/decisions/types/decision";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { ACCEPTED_PDF } from "../../shared/api/download";
import { todayIso } from "../../shared/utils/dates";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const INPUT = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500";

interface FormState {
  detenu: string;
  type: TypeDecision;
  date_decision: string;
  juridiction: string;
  reference_affaire: string;
  resume: string;
  statut_propose: StatutPropose;
  peine_proposee: string;
  date_liberation_proposee: string;
  motif_correction: string;
}

// Greffier : saisie d'une décision (/decisions/new) ou correction (/decisions/:id/correct, version n+1).
// L'effet sur le statut est seulement proposé : la prison l'applique ou l'écarte.
export const DecisionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [search] = useSearchParams();
  const correctionOf = Number(id) || 0;
  const isCorrection = correctionOf > 0;

  const { data: original, isLoading } = useGetDecision(correctionOf);
  const createDecision = useCreateDecision();
  const correctDecision = useCorrectDecision();
  const { user } = usePermissions();

  // Détenus affectés au greffier : liens judiciaires de /me
  const assigned = (user?.links ?? []).filter((l) => l.type === "judicial" && l.prisoner_id !== null);

  const [form, setForm] = useState<FormState>({
    detenu: search.get("detenu") ?? "",
    type: "MANDAT_DE_DEPOT",
    date_decision: todayIso(),
    juridiction: "",
    reference_affaire: "",
    resume: "",
    statut_propose: DEFAULT_EFFECT.MANDAT_DE_DEPOT ?? "",
    peine_proposee: "",
    date_liberation_proposee: "",
    motif_correction: "",
  });
  const [document, setDocument] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Correction : formulaire pré-rempli avec la version corrigée
  useEffect(() => {
    if (!original) return;
    setForm((prev) => ({
      ...prev,
      detenu: String(original.detenu),
      type: original.type,
      date_decision: original.date_decision,
      juridiction: original.juridiction,
      reference_affaire: original.reference_affaire,
      resume: original.resume,
      statut_propose: original.statut_propose ?? "",
      peine_proposee: original.peine_proposee ? String(original.peine_proposee) : "",
      date_liberation_proposee: original.date_liberation_proposee ?? "",
    }));
  }, [original]);

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  // Effet pré-rempli selon le type (modifiable)
  const changeType = (type: TypeDecision) => {
    const statut = DEFAULT_EFFECT[type] ?? "";
    set({
      type,
      statut_propose: statut,
      date_liberation_proposee: statut === "LIBERE" && !form.date_liberation_proposee ? form.date_decision : form.date_liberation_proposee,
    });
  };

  const pickDocument = (file: File | undefined) => {
    setErrors([]);
    if (file && file.size > MAX_DECISION_BYTES) {
      setErrors([`« ${file.name} » dépasse 10 Mo.`]);
      return;
    }
    setDocument(file ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    const fields = {
      type: form.type,
      date_decision: form.date_decision,
      juridiction: form.juridiction.trim(),
      reference_affaire: form.reference_affaire.trim(),
      resume: form.resume.trim(),
      document,
      statut_propose: form.statut_propose,
      peine_proposee: isSentenceProposal(form.statut_propose) && form.peine_proposee ? Number(form.peine_proposee) : null,
      date_liberation_proposee: form.date_liberation_proposee || null,
    };
    try {
      const saved = isCorrection
        ? await correctDecision.mutateAsync({ id: correctionOf, ...fields, motif_correction: form.motif_correction.trim() })
        : await createDecision.mutateAsync({ ...fields, detenu: Number(form.detenu) });
      navigate(`/decisions?detenu=${saved.detenu}&historique=1`, { replace: true });
    } catch (error) {
      setErrors(getApiErrorMessages(error));
    }
  };

  if (isCorrection && isLoading) return <p className="text-gray-500">Chargement…</p>;
  if (isCorrection && original && !original.est_courante) {
    return <p className="text-red-600">Seule la version courante d'une décision peut être corrigée.</p>;
  }
  if (!isCorrection && assigned.length === 0) {
    return (
      <div className="max-w-3xl space-y-4">
        <BackLink />
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Aucun détenu ne vous est affecté : la saisie d'une décision est réservée au greffier du dossier.
        </p>
      </div>
    );
  }

  const pending = createDecision.isPending || correctDecision.isPending;

  return (
    <div className="max-w-3xl space-y-4">
      <BackLink />
      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">
          {isCorrection ? `Corriger la décision (version ${(original?.version ?? 0) + 1})` : "Saisir une décision de justice"}
        </h2>

        {errors.length > 0 && (
          <ul className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errors.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Détenu *" className="md:col-span-2">
            {isCorrection ? (
              <input value={original?.detenu_nom ?? ""} disabled className={`${INPUT} bg-gray-100`} />
            ) : (
              <select value={form.detenu} onChange={(e) => set({ detenu: e.target.value })} required className={INPUT}>
                <option value="">Sélectionner</option>
                {assigned.map((l) => l.type === "judicial" && (
                  <option key={l.id} value={l.prisoner_id}>
                    {l.prisoner_name} — {l.function_label}{l.case_reference ? `, dossier ${l.case_reference}` : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Type de décision *">
            <select value={form.type} onChange={(e) => changeType(e.target.value as TypeDecision)} className={INPUT}>
              {TYPES_DECISION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Date de la décision *">
            <input type="date" value={form.date_decision} max={todayIso()} onChange={(e) => set({ date_decision: e.target.value })} required className={INPUT} />
          </Field>
          <Field label="Juridiction *">
            <input value={form.juridiction} onChange={(e) => set({ juridiction: e.target.value })} required maxLength={200} className={INPUT} />
          </Field>
          <Field label="Référence de l'affaire">
            <input value={form.reference_affaire} onChange={(e) => set({ reference_affaire: e.target.value })} maxLength={100} className={INPUT} />
          </Field>
          <Field label="Résumé *" className="md:col-span-2">
            <textarea value={form.resume} onChange={(e) => set({ resume: e.target.value })} required rows={4} maxLength={5000} className={INPUT} />
          </Field>
          <Field label={isCorrection ? "Nouveau document (PDF, facultatif)" : "Document (PDF, 10 Mo au plus)"} className="md:col-span-2">
            <input type="file" accept={ACCEPTED_PDF} onChange={(e) => pickDocument(e.target.files?.[0])} className="text-sm" />
          </Field>
        </div>

        <fieldset className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-3">
          <legend className="px-1 text-sm font-medium text-gray-700">Effet proposé sur le statut du détenu</legend>
          <Field label="Statut proposé">
            <select value={form.statut_propose} onChange={(e) => set({ statut_propose: e.target.value as StatutPropose })} className={INPUT}>
              {STATUTS_PROPOSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          {isSentenceProposal(form.statut_propose) && (
            <Field label="Peine (mois) *">
              <input type="number" min={1} max={1200} value={form.peine_proposee}
                onChange={(e) => set({ peine_proposee: e.target.value })} required className={INPUT} />
            </Field>
          )}
          {(isSentenceProposal(form.statut_propose) || form.statut_propose === "LIBERE") && (
            <Field label="Date de libération">
              <input type="date" value={form.date_liberation_proposee}
                onChange={(e) => set({ date_liberation_proposee: e.target.value })} className={INPUT} />
            </Field>
          )}
          <p className="text-xs text-gray-500 md:col-span-3">
            L'établissement du détenu applique ou écarte cet effet ; il n'est jamais appliqué automatiquement.
          </p>
        </fieldset>

        {isCorrection && (
          <Field label="Motif de la correction *">
            <textarea value={form.motif_correction} onChange={(e) => set({ motif_correction: e.target.value })}
              required rows={2} maxLength={2000} className={INPUT} />
          </Field>
        )}

        <div className="flex justify-end gap-3">
          <Link to="/decisions" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Annuler</Link>
          <button type="submit" disabled={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {pending ? "Enregistrement…" : isCorrection ? "Enregistrer la correction" : "Enregistrer la décision"}
          </button>
        </div>
      </form>
    </div>
  );
};

const BackLink: React.FC = () => (
  <Link to="/decisions" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
    <ArrowLeft className="h-4 w-4" /> Décisions de justice
  </Link>
);

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <label className={`block ${className ?? ""}`}>
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    {children}
  </label>
);
