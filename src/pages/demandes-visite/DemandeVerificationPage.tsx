import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FilePlus, Hand, Info, Send, XCircle } from "lucide-react";
import { useDemandeAction, useGetDemande, useReviewPieceDemande } from "../../features/demandes-visite/api/useDemandes";
import { DemandeAction } from "../../features/demandes-visite/api/demandes.api";
import {
  EtatPermisBadge,
  HistoriqueDemandeList,
  PiecesDemandeList,
  StatutDemandeBadge,
} from "../../features/demandes-visite/components/DemandeParts";
import { periodeDemande } from "../../features/demandes-visite/utils/periode";
import { EtapesDemande } from "../../features/demandes-visite/components/EtapesDemande";
import { downloadPermis } from "../../features/permis/api/permis.api";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { useRole } from "../../features/auth/hooks/useRole";
import { roleLabel } from "../../features/auth/config/rbac";
import { STEP_BY_ROLE } from "../../features/demandes-visite/types/demande";
import { formatDate, formatDateTime } from "../../shared/utils/dates";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

type Dialog = { action: "request-documents" | "reject"; title: string; label: string; field: "commentaire" | "motif" } | null;

// Gestionnaire : vérification pièce par pièce puis décision, selon l'étape en cours.
//   circuit judiciaire : greffier (étape 1 : vérifie, transmet ou refuse), puis juge d'instruction (prévenu)
//   ou procureur (accusé) (étape 2 : valide et émet le permis, ou refuse) ;
//   circuit pénitentiaire : AP / SP (vérifie puis valide ou refuse).
// Les boutons ne s'affichent qu'à l'étape de l'utilisateur ; le backend reste seul juge (403, 400 invalid_state).
export const DemandeVerificationPage: React.FC = () => {
  const id = Number(useParams().id);
  const { data: demande, isLoading, isError } = useGetDemande(id);
  const action = useDemandeAction();
  const review = useReviewPieceDemande();
  const { can } = usePermissions();
  const { role } = useRole();

  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  if (isLoading) return <p className="text-gray-500">Chargement…</p>;
  if (isError || !demande) return <p className="text-red-600">Demande introuvable ou hors de votre périmètre.</p>;

  const myStep = role ? STEP_BY_ROLE[role] : undefined;
  const step = demande.etape_courante;
  // Est-ce mon étape ? Pour l'étape 2, seulement le magistrat attendu (d'après le statut du détenu)
  const atMyStep = !!myStep && step === myStep && (step !== "MAGISTRAT" || demande.magistrat_attendu === role);
  const isGreffe = step === "GREFFE";
  // Instruire (prendre, vérifier les pièces, demander un complément) : greffe ou prison
  const canInstruct = atMyStep && (isGreffe || step === "PRISON") && can("visit_requests:update");
  // Décider son étape : le greffier transmet ou refuse ; le magistrat ou la prison valide ou refuse
  const canDecide = atMyStep && can("visit_requests:validate");
  const open = atMyStep;
  const blockers = demande.problemes_validation ?? [];
  const magistrat = roleLabel(demande.magistrat_attendu).toLowerCase();

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setErrors([]);
    setSuccess(null);
    try {
      await fn();
      setSuccess(ok);
      return true;
    } catch (error) {
      setErrors(getApiErrorMessages(error));
      return false;
    }
  };

  const transition = (name: DemandeAction, ok: string, body?: Record<string, string>) =>
    run(() => action.mutateAsync({ id: demande.id, action: name, body }), ok);

  const confirmDialog = async () => {
    if (!dialog || !text.trim()) return;
    const done = await transition(
      dialog.action,
      dialog.action === "reject" ? "Demande refusée." : "Complément demandé au proche.",
      { [dialog.field]: text.trim() }
    );
    if (done) {
      setDialog(null);
      setText("");
    }
  };

  const pending = action.isPending || review.isPending;

  return (
    <div className="max-w-5xl space-y-6">
      <Link to="/demandes" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Demandes de visite
      </Link>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Demande n° {demande.id}</h2>
          <StatutDemandeBadge statut={demande.statut} />
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <Item label="Détenu" value={`${demande.detenu_nom}${demande.detenu_matricule ? ` (${demande.detenu_matricule})` : ""}`} />
          <Item label="Établissement" value={demande.prison_nom} />
          <Item label="Circuit" value={demande.circuit_label} />
          <Item label="Demandeur" value={`${demande.proche_nom} — ${demande.lien_parente_label}`} />
          <Item label="Période souhaitée" value={periodeDemande(demande)} />
          <Item label="Soumise le" value={formatDateTime(demande.soumise_le ?? demande.cree_le)} />
          {demande.visiteurs_supplementaires.length > 0 && (
            <Item label="Autres visiteurs"
              value={demande.visiteurs_supplementaires.map((v) => `${v.nom} (${v.piece_identite})`).join(", ")} />
          )}
        </dl>
        {demande.message && <p className="rounded bg-gray-50 p-3 text-sm text-gray-700">{demande.message}</p>}
        {demande.statut === "INCOMPLETE" && (
          <p className="text-sm text-amber-700">En attente des pièces du proche : {demande.commentaire_complement}</p>
        )}
        {demande.statut === "REFUSEE" && <p className="text-sm text-red-700">Motif du refus : {demande.motif_refus}</p>}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-800">Étapes de la demande</h3>
        <EtapesDemande demande={demande} />
      </section>

      {errors.length > 0 && (
        <ul className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
      {success && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</p>}

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800">Vérification des pièces</h3>
        <PiecesDemandeList
          pieces={demande.pieces}
          review={canInstruct && open ? {
            pending,
            onVerify: (piece) => run(
              () => review.mutateAsync({ demandeId: demande.id, pieceId: piece.id, statut: "VERIFIEE" }),
              `${piece.type_label} : conforme.`
            ),
            onReject: (piece, commentaire) => run(
              () => review.mutateAsync({ demandeId: demande.id, pieceId: piece.id, statut: "REJETEE", commentaire }),
              `${piece.type_label} : rejetée.`
            ),
          } : undefined}
        />
      </section>

      {/* Demande hors de l'étape de l'utilisateur : consultation seulement */}
      {!atMyStep && demande.statut !== "VALIDEE" && demande.statut !== "REFUSEE" && (
        <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <Info className="h-4 w-4 flex-shrink-0" />
          <p>
            Étape en cours : {demande.etape_courante_label}
            {step === "MAGISTRAT" && demande.magistrat_attendu ? ` (${roleLabel(demande.magistrat_attendu)})` : ""}.
            Aucune action ne vous revient à cette étape.
          </p>
        </div>
      )}

      {/* Décision */}
      {open && (canInstruct || canDecide) && (
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800">Décision</h3>
          {blockers.length > 0 && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <ul>{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {canInstruct && demande.statut === "SOUMISE" && (
              <ActionButton icon={Hand} label="Prendre en charge" className="bg-slate-700 hover:bg-slate-800" disabled={pending}
                onClick={() => transition("take", "Demande prise en charge.")} />
            )}
            {canInstruct && (
              <ActionButton icon={FilePlus} label="Demander un complément" className="bg-amber-600 hover:bg-amber-700" disabled={pending}
                onClick={() => { setDialog({ action: "request-documents", title: "Demander un complément", label: "Pièces ou informations attendues (visible par le proche)", field: "commentaire" }); setText(""); }} />
            )}
            {canDecide && (
              <>
                {isGreffe ? (
                  <ActionButton icon={Send} label={`Transmettre au ${magistrat}`} className="bg-violet-600 hover:bg-violet-700"
                    disabled={pending || blockers.length > 0}
                    title={blockers.length > 0 ? "Toutes les pièces doivent être vérifiées" : undefined}
                    onClick={() => window.confirm(`Transmettre la demande vérifiée au ${magistrat} pour décision ?`)
                      && transition("transmit", `Demande transmise au ${magistrat}.`)} />
                ) : (
                  <ActionButton icon={CheckCircle2} label="Valider et émettre le permis" className="bg-green-600 hover:bg-green-700"
                    disabled={pending || blockers.length > 0}
                    title={blockers.length > 0 ? "Toutes les pièces doivent être vérifiées" : undefined}
                    onClick={() => window.confirm("Valider la demande et émettre le permis de visite ?")
                      && transition("validate", "Demande validée : le permis a été émis.")} />
                )}
                <ActionButton icon={XCircle} label="Refuser" className="bg-red-600 hover:bg-red-700" disabled={pending}
                  onClick={() => { setDialog({ action: "reject", title: "Refuser la demande", label: "Motif du refus (obligatoire, visible par le proche)", field: "motif" }); setText(""); }} />
              </>
            )}
          </div>
          {step === "MAGISTRAT" && (
            <p className="text-xs text-gray-500">
              Pièces vérifiées par le greffe{demande.transmise_le ? `, transmise le ${formatDateTime(demande.transmise_le)}` : ""}.
            </p>
          )}

          {dialog && (
            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium text-gray-800">{dialog.title}</p>
              <label className="block text-sm text-gray-700">
                {dialog.label}
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus maxLength={2000}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={confirmDialog} disabled={!text.trim() || pending}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-50">
                  Confirmer
                </button>
                <button type="button" onClick={() => setDialog(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {demande.permis && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm">
            <p className="font-medium text-gray-900">Permis {demande.permis.numero} <EtatPermisBadge permis={demande.permis} /></p>
            <p className="text-gray-600">Valable du {formatDate(demande.permis.valide_du)} au {formatDate(demande.permis.valide_au)}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => run(() => downloadPermis(demande.permis!), "Permis téléchargé.")}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <Download className="h-4 w-4" /> PDF
            </button>
            <Link to="/permis" className="text-sm text-blue-600 hover:underline">Gérer les permis</Link>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Historique</h3>
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

const ActionButton: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}> = ({ icon: Icon, label, className, onClick, disabled, title }) => (
  <button type="button" onClick={onClick} disabled={disabled} title={title}
    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50 ${className}`}>
    <Icon className="h-4 w-4" /> {label}
  </button>
);
