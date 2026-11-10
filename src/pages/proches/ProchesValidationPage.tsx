import React, { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { useDecideLien, useGetLiens, useMatchLien } from "../../features/proches/api/useProches";
import { LienAction, LienProche, STATUT_LIEN_STYLES } from "../../features/proches/types/proche";
import { PiecesList } from "../../features/proches/components/PiecesList";
import { useGetDetenus } from "../../features/detenus/api/useGetDetenu";
import { Detenu } from "../../features/detenus/types/detenu";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { getApiErrorMessage } from "../../shared/api/errorMessages";

const FILTRES = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "PIECES_A_COMPLETER", label: "Pièces à compléter" },
  { value: "ACTIF", label: "Validés" },
  { value: "REFUSE", label: "Refusés" },
  { value: "", label: "Toutes" },
];

const CATEGORIES: Record<string, string> = {
  FAMILLE_DIRECTE: "Famille directe (prioritaire)",
  AUTRE_FAMILLE: "Autre famille",
  NON_PARENT: "Non-parent",
};

// File de validation des proches : SUPERVISEUR ou ADMIN de la prison du détenu (D4, D19)
export const ProchesValidationPage: React.FC = () => {
  const [statut, setStatut] = useState("EN_ATTENTE");
  const [aRapprocher, setARapprocher] = useState(false);
  const { data: liens = [], isLoading, isError } = useGetLiens({ statut, a_rapprocher: aRapprocher });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-rose-100 rounded-lg p-2">
          <HeartHandshake className="h-6 w-6 text-rose-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Proches référents</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTRES.map((f) => (
          <button key={f.value} onClick={() => setStatut(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm border ${statut === f.value ? "bg-slate-800 text-white border-slate-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
            {f.label}
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-700 ml-4">
          <input type="checkbox" checked={aRapprocher} onChange={(e) => setARapprocher(e.target.checked)} />
          Demandes à rattacher à un détenu
        </label>
      </div>

      {isError && <p className="text-red-600 text-sm">Impossible de charger les demandes.</p>}
      {isLoading && <p className="text-gray-500 text-sm">Chargement…</p>}
      {!isLoading && liens.length === 0 && (
        <p className="text-gray-500 text-sm bg-white border border-gray-200 rounded-lg p-6 text-center">Aucune demande.</p>
      )}
      <div className="space-y-4">
        {liens.map((lien) => <LienCard key={lien.id} lien={lien} />)}
      </div>
    </div>
  );
};

const LienCard: React.FC<{ lien: LienProche }> = ({ lien }) => {
  const { can, isMyPrison } = usePermissions();
  const decide = useDecideLien();
  const match = useMatchLien();
  const { data: detenus = [] } = useGetDetenus();
  const [detenuChoisi, setDetenuChoisi] = useState("");

  const ouverte = lien.statut === "EN_ATTENTE" || lien.statut === "PIECES_A_COMPLETER";
  const canDecide = can("relative_links:validate") && (lien.detenu_prison == null || isMyPrison(lien.detenu_prison));

  const run = (action: LienAction, question?: string) => {
    let motif: string | undefined;
    if (question) {
      const answer = window.prompt(question);
      if (answer === null) return;
      motif = answer;
    }
    decide.mutate({ id: lien.id, action, motif }, { onError: (e) => window.alert(getApiErrorMessage(e)) });
  };

  const rattacher = () => {
    if (!detenuChoisi) return;
    match.mutate({ id: lien.id, detenu: Number(detenuChoisi) }, { onError: (e) => window.alert(getApiErrorMessage(e)) });
  };

  // Détenus de l'établissement de l'utilisateur uniquement (le backend le vérifie aussi)
  const candidats = (detenus as Detenu[]).filter((d) => isMyPrison(d.prison));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{lien.proche_nom}</p>
          <p className="text-sm text-gray-500">
            {lien.proche_email} — {lien.proche_telephone} — Pièce : {lien.proche_piece_identite}
          </p>
          <p className="text-xs text-gray-400 mt-1">Demande du {new Date(lien.cree_le).toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{CATEGORIES[lien.categorie]}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUT_LIEN_STYLES[lien.statut]}`}>{lien.statut_label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <p><span className="text-gray-500">Détenu demandé :</span> {lien.nom_complet_detenu_saisi}
            {lien.date_naissance_detenu_saisie && ` (né le ${new Date(lien.date_naissance_detenu_saisie).toLocaleDateString("fr-FR")})`}</p>
          <p><span className="text-gray-500">Lien :</span> {lien.lien_parente_label}</p>
          {lien.motivation && <p><span className="text-gray-500">Relation :</span> {lien.motivation}</p>}
          <p>
            <span className="text-gray-500">Rattaché à :</span>{" "}
            {lien.detenu_nom ?? <span className="text-amber-600 font-medium">aucun détenu (à rattacher)</span>}
          </p>
          {lien.motif_refus && <p><span className="text-gray-500">Commentaire :</span> {lien.motif_refus}</p>}
        </div>
        <div>
          <p className="text-gray-500 mb-2">Pièces justificatives</p>
          <PiecesList pieces={lien.pieces} canReview={canDecide && ouverte} />
        </div>
      </div>

      {canDecide && ouverte && (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100">
          {lien.detenu == null ? (
            <>
              <select value={detenuChoisi} onChange={(e) => setDetenuChoisi(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                <option value="">Choisir le détenu…</option>
                {candidats.map((d) => (
                  <option key={d.id} value={d.id}>{d.first_name} {d.last_name} {d.matricule_number ? `(${d.matricule_number})` : ""}</option>
                ))}
              </select>
              <button onClick={rattacher} disabled={!detenuChoisi || match.isPending}
                className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm disabled:opacity-50">
                Rattacher
              </button>
            </>
          ) : (
            <button onClick={() => run("approve")} disabled={decide.isPending}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              Valider
            </button>
          )}
          <button onClick={() => run("request-documents", "Pièces à compléter (message au proche) :")} disabled={decide.isPending}
            className="px-3 py-1.5 border border-orange-300 text-orange-700 rounded-lg text-sm hover:bg-orange-50">
            Demander des pièces
          </button>
          <button onClick={() => run("reject", "Motif du refus :")} disabled={decide.isPending}
            className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50">
            Refuser
          </button>
        </div>
      )}
      {canDecide && lien.statut === "ACTIF" && (
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button onClick={() => run("revoke", "Motif de la révocation :")} disabled={decide.isPending}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            Révoquer le lien
          </button>
        </div>
      )}
    </div>
  );
};
