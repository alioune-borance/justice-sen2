import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { registerRelative } from "../../features/proches/api/proches.api";
import { LIENS_PARENTE, RegisterForm, RegisterLink } from "../../features/proches/types/proche";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const EMPTY_LINK: RegisterLink = {
  nom_complet_detenu: "",
  date_naissance_detenu: "",
  prison: null,
  lien_parente: "MERE",
  motivation: "",
  justificatif: null,
};

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// Inscription publique d'un proche (D4, D22) : compte en attente jusqu'à validation par l'établissement
export const RegisterPage: React.FC = () => {
  const [form, setForm] = useState<RegisterForm>({
    username: "", email: "", first_name: "", last_name: "", phone_number: "", national_id: "",
    piece_expiration: "", password: "", piece_identite: null, photo_1: null, photo_2: null,
    liens: [{ ...EMPTY_LINK }],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === "file" ? e.target.files?.[0] ?? null : e.target.value }));

  const setLink = (index: number, patch: Partial<RegisterLink>) =>
    setForm((prev) => ({ ...prev, liens: prev.liens.map((l, i) => (i === index ? { ...l, ...patch } : l)) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const { message } = await registerRelative(form);
      setDone(message);
    } catch (error) {
      setErrors(getApiErrorMessages(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold text-slate-800">Demande enregistrée</h1>
          <p className="text-gray-600">{done}</p>
          <Link to="/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <form onSubmit={submit} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Créer un compte proche</h1>
          <p className="text-sm text-gray-600 mt-1">
            Votre compte sera activé après vérification de vos pièces par l'établissement. La famille directe
            (conjoint, parents, enfants, frères et sœurs) est prioritaire.
          </p>
        </div>

        {errors.length > 0 && (
          <ul className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm list-disc list-inside">
            {errors.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}

        <section className="space-y-3">
          <h2 className="font-semibold text-slate-700">Vos informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className={INPUT} placeholder="Prénom *" required value={form.first_name} onChange={set("first_name")} />
            <input className={INPUT} placeholder="Nom *" required value={form.last_name} onChange={set("last_name")} />
            <input className={INPUT} placeholder="Email *" type="email" required value={form.email} onChange={set("email")} />
            <input className={INPUT} placeholder="Téléphone *" required value={form.phone_number} onChange={set("phone_number")} />
            <input className={INPUT} placeholder="Identifiant de connexion *" required value={form.username} onChange={set("username")} />
            <input className={INPUT} placeholder="Mot de passe *" type="password" required value={form.password} onChange={set("password")} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-slate-700">Pièces d'identité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <input className={INPUT} placeholder="N° CNI CEDEAO ou passeport *" required value={form.national_id} onChange={set("national_id")} />
            <label className="block">
              <span className="text-gray-600">Date d'expiration de la pièce *</span>
              <input className={INPUT} type="date" required value={form.piece_expiration} onChange={set("piece_expiration")} />
            </label>
            <label className="block"><span className="text-gray-600">Copie de la pièce d'identité *</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={set("piece_identite")} /></label>
            <span />
            <label className="block"><span className="text-gray-600">Photo d'identité 1 *</span>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={set("photo_1")} /></label>
            <label className="block"><span className="text-gray-600">Photo d'identité 2 *</span>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={set("photo_2")} /></label>
          </div>
          <p className="text-xs text-gray-500">Formats acceptés : PDF, JPG, PNG (5 Mo maximum par fichier).</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-slate-700">Détenu(s) concerné(s)</h2>
          {form.liens.map((lien, index) => {
            const nonParent = LIENS_PARENTE.find((l) => l.value === lien.lien_parente)?.nonParent;
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className={INPUT} placeholder="Nom complet du détenu *" required value={lien.nom_complet_detenu}
                    onChange={(e) => setLink(index, { nom_complet_detenu: e.target.value })} />
                  <label className="block text-sm"><span className="text-gray-600">Date de naissance du détenu</span>
                    <input className={INPUT} type="date" value={lien.date_naissance_detenu}
                      onChange={(e) => setLink(index, { date_naissance_detenu: e.target.value })} /></label>
                  <select className={INPUT} value={lien.lien_parente} onChange={(e) => setLink(index, { lien_parente: e.target.value })}>
                    {LIENS_PARENTE.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                {nonParent && (
                  <textarea className={INPUT} rows={2} required placeholder="Précisez la nature de votre relation *"
                    value={lien.motivation} onChange={(e) => setLink(index, { motivation: e.target.value })} />
                )}
                <label className="block text-sm">
                  <span className="text-gray-600">
                    {nonParent ? "Justification de la relation" : "Justificatif du lien (acte de naissance, livret de famille, certificat de mariage…)"}
                  </span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setLink(index, { justificatif: e.target.files?.[0] ?? null })} />
                </label>
                {form.liens.length > 1 && (
                  <button type="button" onClick={() => setForm((p) => ({ ...p, liens: p.liens.filter((_, i) => i !== index) }))}
                    className="flex items-center gap-1 text-sm text-red-600"><Trash2 className="h-4 w-4" /> Retirer</button>
                )}
              </div>
            );
          })}
          {form.liens.length < 5 && (
            <button type="button" onClick={() => setForm((p) => ({ ...p, liens: [...p.liens, { ...EMPTY_LINK }] }))}
              className="flex items-center gap-1 text-sm text-blue-600"><Plus className="h-4 w-4" /> Ajouter un détenu</button>
          )}
        </section>

        <div className="flex items-center justify-between">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-800">J'ai déjà un compte</Link>
          <button type="submit" disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? "Envoi…" : "Envoyer ma demande"}
          </button>
        </div>
      </form>
    </div>
  );
};
