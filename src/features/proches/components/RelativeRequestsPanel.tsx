import React, { useState } from "react";
import { Upload } from "lucide-react";
import { useGetLiens, useUploadPiece } from "../api/useProches";
import { STATUT_LIEN_STYLES, TYPES_PIECE } from "../types/proche";
import { PiecesList } from "./PiecesList";
import { getApiErrorMessages } from "../../../shared/api/errorMessages";

// Espace du proche référent : ses demandes (y compris compte en attente) et le dépôt de pièces
export const RelativeRequestsPanel: React.FC = () => {
  const { data: liens = [], isLoading } = useGetLiens();
  const upload = useUploadPiece();
  const [type, setType] = useState("JUSTIFICATIF_LIEN");
  const [lien, setLien] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fichier) return;
    setErrors([]);
    setSent(false);
    try {
      await upload.mutateAsync({ type, fichier, lien: lien ? Number(lien) : null });
      setFichier(null);
      setSent(true);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      setErrors(getApiErrorMessages(error));
    }
  };

  if (isLoading) return <p className="text-sm text-gray-500">Chargement de vos demandes…</p>;

  return (
    <div className="space-y-4 text-left">
      <h3 className="font-semibold text-slate-800">Mes demandes</h3>
      {liens.length === 0 && <p className="text-sm text-gray-500">Aucune demande.</p>}
      {liens.map((l) => (
        <div key={l.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-800">
              {l.detenu_nom ?? l.nom_complet_detenu_saisi} — {l.lien_parente_label}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUT_LIEN_STYLES[l.statut]}`}>{l.statut_label}</span>
          </div>
          {l.motif_refus && <p className="text-sm text-orange-700">Message de l'établissement : {l.motif_refus}</p>}
          <PiecesList pieces={l.pieces} />
        </div>
      ))}

      <form onSubmit={submit} className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700">Ajouter une pièce</p>
        {errors.length > 0 && <p className="text-sm text-red-600">{errors.join(" ")}</p>}
        {sent && <p className="text-sm text-green-700">Pièce envoyée.</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
            {TYPES_PIECE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={lien} onChange={(e) => setLien(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
            <option value="">Pièce commune à toutes mes demandes</option>
            {liens.map((l) => <option key={l.id} value={l.id}>{l.detenu_nom ?? l.nom_complet_detenu_saisi}</option>)}
          </select>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            className="text-sm" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={!fichier || upload.isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
            <Upload className="h-4 w-4" /> Envoyer
          </button>
        </div>
      </form>
    </div>
  );
};
