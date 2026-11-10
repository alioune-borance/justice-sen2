import React, { useState } from "react";
import { Download, FileText } from "lucide-react";
import { downloadPiece } from "../api/proches.api";
import { useReviewPiece } from "../api/useProches";
import { PieceJustificative } from "../types/proche";
import { getApiErrorMessage } from "../../../shared/api/errorMessages";

const STATUT_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  CONFORME: "bg-green-100 text-green-800",
  NON_CONFORME: "bg-red-100 text-red-800",
};

interface PiecesListProps {
  pieces: PieceJustificative[];
  // Vérification (superviseur / administrateur de la prison)
  canReview?: boolean;
}

export const PiecesList: React.FC<PiecesListProps> = ({ pieces, canReview = false }) => {
  const review = useReviewPiece();
  const [downloading, setDownloading] = useState<number | null>(null);

  const handleDownload = async (piece: PieceJustificative) => {
    setDownloading(piece.id);
    try {
      await downloadPiece(piece);
    } catch (error) {
      window.alert(getApiErrorMessage(error));
    } finally {
      setDownloading(null);
    }
  };

  const handleReview = (piece: PieceJustificative, statut: "CONFORME" | "NON_CONFORME") => {
    const commentaire = statut === "NON_CONFORME" ? window.prompt("Motif (facultatif) :") ?? "" : "";
    review.mutate({ id: piece.id, statut, commentaire }, { onError: (e) => window.alert(getApiErrorMessage(e)) });
  };

  if (pieces.length === 0) {
    return <p className="text-sm text-gray-500">Aucune pièce déposée.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
      {pieces.map((piece) => (
        <li key={piece.id} className="flex items-center justify-between gap-3 p-2 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-gray-800 truncate">{piece.type_label}</p>
              <p className="text-xs text-gray-500 truncate">
                {piece.nom_original}
                {piece.date_expiration && ` — expire le ${new Date(piece.date_expiration).toLocaleDateString("fr-FR")}`}
                {piece.expiree && <span className="text-red-600 font-medium"> (expirée)</span>}
                {piece.commentaire && ` — ${piece.commentaire}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs ${STATUT_STYLES[piece.statut_verification]}`}>
              {piece.statut_verification_label}
            </span>
            <button onClick={() => handleDownload(piece)} disabled={downloading === piece.id}
              className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50" title="Télécharger">
              <Download className="h-4 w-4" />
            </button>
            {canReview && piece.statut_verification === "EN_ATTENTE" && (
              <>
                <button onClick={() => handleReview(piece, "CONFORME")} className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">
                  Conforme
                </button>
                <button onClick={() => handleReview(piece, "NON_CONFORME")} className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50">
                  Non conforme
                </button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};
