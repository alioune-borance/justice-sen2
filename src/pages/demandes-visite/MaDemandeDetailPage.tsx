import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Send, Upload } from "lucide-react";
import { useAddPieceDemande, useDemandeAction, useGetDemande } from "../../features/demandes-visite/api/useDemandes";
import {
  MAX_DOCUMENT_BYTES,
  TYPES_PIECE_DEMANDE,
  TypePieceDemande,
} from "../../features/demandes-visite/types/demande";
import { EtatPermisBadge, HistoriqueDemandeList, PiecesDemandeList, StatutDemandeBadge } from "../../features/demandes-visite/components/DemandeParts";
import { periodeDemande } from "../../features/demandes-visite/utils/periode";
import { formatDate, formatDateTime } from "../../shared/utils/dates";
import { downloadPermis } from "../../features/permis/api/permis.api";
import { Can } from "../../features/auth/components/Can";
import { ACCEPTED_DOCUMENTS } from "../../shared/api/download";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

// Proche référent : suivi d'une demande, réponse à « pièces à compléter », téléchargement du permis.
export const MaDemandeDetailPage: React.FC = () => {
  const id = Number(useParams().id);
  const { data: demande, isLoading, isError } = useGetDemande(id);
  const addPiece = useAddPieceDemande();
  const action = useDemandeAction();

  const [type, setType] = useState<TypePieceDemande>("PIECE_IDENTITE");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  if (isLoading) return <p className="text-gray-500">Chargement…</p>;
  if (isError || !demande) return <p className="text-red-600">Demande introuvable.</p>;

  // Dépôt de pièces : demande soumise ou incomplète (règle appliquée par le backend)
  const canAddPieces = demande.statut === "SOUMISE" || demande.statut === "INCOMPLETE";
  // Pièces déposées depuis la demande de complément : condition de la resoumission
  const complementAt = [...demande.historique]
    .filter((h) => h.vers_statut === "INCOMPLETE")
    .map((h) => h.horodatage)
    .sort()
    .pop();
  const newPieces = complementAt ? demande.pieces.filter((p) => p.deposee_le > complementAt).length : 0;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMessages([]);
    setSuccess(null);
    try {
      await fn();
      setSuccess(ok);
    } catch (error) {
      setMessages(getApiErrorMessages(error));
    }
  };

  const upload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (file.size > MAX_DOCUMENT_BYTES) {
      setMessages([`« ${file.name} » dépasse 5 Mo.`]);
      return;
    }
    run(async () => {
      await addPiece.mutateAsync({ id: demande.id, type, fichier: file });
      setFile(null);
      setFileKey((k) => k + 1);
    }, "Pièce déposée.");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/mes-demandes" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Mes demandes
      </Link>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Visite à {demande.detenu_nom}</h2>
          <StatutDemandeBadge statut={demande.statut} />
        </div>
        <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <Item label="Établissement" value={demande.prison_nom} />
          <Item label="Période souhaitée" value={periodeDemande(demande)} />
          <Item label="Déposée le" value={formatDateTime(demande.cree_le)} />
          <Item label="Décision" value={demande.decidee_le ? formatDateTime(demande.decidee_le) : "En attente"} />
          {demande.visiteurs_supplementaires.length > 0 && (
            <Item label="Autres visiteurs" value={demande.visiteurs_supplementaires.map((v) => v.nom).join(", ")} />
          )}
        </dl>
        {demande.message && <p className="text-sm text-gray-700">{demande.message}</p>}
        {demande.statut === "REFUSEE" && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Demande refusée{demande.motif_refus ? ` : ${demande.motif_refus}` : "."}
          </p>
        )}
        {demande.statut === "SOUMISE" && demande.circuit === "JUDICIAIRE" && (
          <p className="text-sm text-gray-500">Votre demande sera examinée par l'autorité judiciaire chargée du dossier.</p>
        )}
      </div>

      {/* Permis émis à la validation */}
      {demande.permis && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="text-sm text-green-900">
            <p className="font-medium">Permis {demande.permis.numero} <EtatPermisBadge permis={demande.permis} /></p>
            <p>Valable du {formatDate(demande.permis.valide_du)} au {formatDate(demande.permis.valide_au)}</p>
          </div>
          {demande.permis.etat !== "REVOQUE" && (
            <button type="button" onClick={() => run(() => downloadPermis(demande.permis!), "Permis téléchargé.")}
              className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800">
              <Download className="h-4 w-4" /> Télécharger le permis
            </button>
          )}
        </div>
      )}

      {messages.length > 0 && (
        <ul className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {messages.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
      {success && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</p>}

      {/* Réponse à « pièces à compléter » */}
      {demande.statut === "INCOMPLETE" && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Pièces à compléter</p>
          {demande.commentaire_complement && <p>{demande.commentaire_complement}</p>}
          <p>Déposez les pièces demandées ci-dessous, puis renvoyez la demande.</p>
          <Can perm="visit_requests:create">
            <button type="button" disabled={newPieces === 0 || action.isPending}
              onClick={() => run(() => action.mutateAsync({ id: demande.id, action: "resubmit" }), "Demande renvoyée pour vérification.")}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
              title={newPieces === 0 ? "Déposez d'abord au moins une pièce" : undefined}>
              <Send className="h-4 w-4" /> Renvoyer la demande
            </button>
          </Can>
        </div>
      )}

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800">Pièces du dossier</h3>
        <PiecesDemandeList pieces={demande.pieces} />

        {canAddPieces && (
          <Can perm="visit_requests:create">
            <form onSubmit={upload} className="flex flex-col gap-3 border-t border-gray-100 pt-3 md:flex-row md:items-end">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Type de pièce</span>
                <select value={type} onChange={(e) => setType(e.target.value as TypePieceDemande)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {TYPES_PIECE_DEMANDE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <input key={fileKey} type="file" accept={ACCEPTED_DOCUMENTS} required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
              <button type="submit" disabled={!file || addPiece.isPending}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
                <Upload className="h-4 w-4" /> {addPiece.isPending ? "Envoi…" : "Déposer"}
              </button>
            </form>
          </Can>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Suivi</h3>
        <HistoriqueDemandeList historique={demande.historique} />
      </section>
    </div>
  );
};

const Item: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-gray-500">{label}</dt>
    <dd className="text-gray-900">{value}</dd>
  </div>
);
