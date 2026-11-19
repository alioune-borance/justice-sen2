import React, { useState } from "react";
import { Check, Clock, Download, X } from "lucide-react";
import {
  HistoriqueDemande,
  PieceDemande,
  STATUT_DEMANDE_LABELS,
  STATUT_DEMANDE_STYLES,
  STATUT_PIECE_STYLES,
  StatutDemande,
} from "../types/demande";
import { downloadPieceDemande } from "../api/demandes.api";
import { ETAT_PERMIS_STYLES, PermisResume, ETAT_PERMIS_LABELS } from "../../permis/types/permis";
import { getApiErrorMessage } from "../../../shared/api/errorMessages";
import { formatDateTime } from "../../../shared/utils/dates";
import { roleLabel } from "../../auth/config/rbac";
import { Role } from "../../auth/types/user.types";

export const StatutDemandeBadge: React.FC<{ statut: StatutDemande }> = ({ statut }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_DEMANDE_STYLES[statut]}`}>
    {STATUT_DEMANDE_LABELS[statut]}
  </span>
);

export const EtatPermisBadge: React.FC<{ permis: PermisResume }> = ({ permis }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${ETAT_PERMIS_STYLES[permis.etat]}`}>
    {ETAT_PERMIS_LABELS[permis.etat]}
  </span>
);

interface PieceReviewHandler {
  onVerify: (piece: PieceDemande) => void;
  onReject: (piece: PieceDemande, commentaire: string) => void;
  pending?: boolean;
}

// Pièces d'une demande. Avec `review`, chaque pièce à vérifier propose Vérifier / Rejeter (gestionnaires).
export const PiecesDemandeList: React.FC<{ pieces: PieceDemande[]; review?: PieceReviewHandler }> = ({ pieces, review }) => {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState("");

  if (pieces.length === 0) return <p className="text-sm text-gray-500">Aucune pièce.</p>;

  const download = async (piece: PieceDemande) => {
    setDownloadError(null);
    try {
      await downloadPieceDemande(piece);
    } catch (error) {
      setDownloadError(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-2">
      {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {pieces.map((piece) => (
          <li key={piece.id} className="space-y-2 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-medium text-gray-900">{piece.type_label}</span>
                <span className="ml-2 text-gray-500">{piece.nom_original}</span>
                <span className="ml-2 text-xs text-gray-400">déposée le {formatDateTime(piece.deposee_le)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUT_PIECE_STYLES[piece.statut]}`}>{piece.statut_label}</span>
                <button type="button" onClick={() => download(piece)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                  <Download className="h-4 w-4" /> Ouvrir
                </button>
                {review && piece.statut === "A_VERIFIER" && rejecting !== piece.id && (
                  <>
                    <button type="button" disabled={review.pending} onClick={() => review.onVerify(piece)}
                      className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-white hover:bg-green-700 disabled:opacity-50">
                      <Check className="h-4 w-4" /> Conforme
                    </button>
                    <button type="button" disabled={review.pending} onClick={() => { setRejecting(piece.id); setCommentaire(""); }}
                      className="flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700 disabled:opacity-50">
                      <X className="h-4 w-4" /> Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
            {piece.commentaire && <p className="text-gray-600">Commentaire : {piece.commentaire}</p>}
            {review && rejecting === piece.id && (
              <div className="flex flex-col gap-2 md:flex-row">
                <input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} autoFocus
                  placeholder="Motif du rejet (obligatoire, visible par le proche)"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                <button type="button" disabled={!commentaire.trim() || review.pending}
                  onClick={() => { review.onReject(piece, commentaire.trim()); setRejecting(null); }}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50">
                  Confirmer le rejet
                </button>
                <button type="button" onClick={() => setRejecting(null)} className="px-3 py-1.5 text-gray-600 hover:text-gray-900">
                  Annuler
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Auteur : nom et rôle (gestionnaires) ; rôle seul pour le proche (noms masqués par le backend)
const auteurLabel = (entry: HistoriqueDemande) => {
  const role = entry.auteur_role_label ?? (entry.auteur_role ? roleLabel(entry.auteur_role as Role) : null);
  if (entry.auteur_nom && role && entry.auteur_nom !== "Système") return `${entry.auteur_nom} (${role})`;
  return entry.auteur_nom ?? role ?? "—";
};

// Historique horodaté (ajout seul) : qui a fait quoi, à quelle étape, quand et pourquoi
export const HistoriqueDemandeList: React.FC<{ historique: HistoriqueDemande[] }> = ({ historique }) => (
  <ol className="space-y-3">
    {[...historique]
      .sort((a, b) => b.horodatage.localeCompare(a.horodatage))
      .map((entry) => (
        <li key={entry.id} className="flex gap-3 text-sm">
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
          <div>
            <p className="text-gray-900">
              <span className="font-medium">{entry.evenement_label}</span>
              {entry.vers_statut && entry.vers_statut !== entry.de_statut && (
                <span className="text-gray-500"> → {STATUT_DEMANDE_LABELS[entry.vers_statut]}</span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {formatDateTime(entry.horodatage)} — {auteurLabel(entry)}
              {entry.etape_label && entry.etape !== "PROCHE" && <span> · {entry.etape_label}</span>}
            </p>
            {entry.motif && <p className="text-gray-700">Motif : {entry.motif}</p>}
            {entry.commentaire && entry.commentaire !== entry.motif && <p className="text-gray-600">{entry.commentaire}</p>}
          </div>
        </li>
      ))}
  </ol>
);
