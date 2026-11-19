import React from "react";
import { Check, Circle, Clock, X } from "lucide-react";
import { DemandeVisite, EtapeDemande, HistoriqueDemande } from "../types/demande";
import { roleLabel } from "../../auth/config/rbac";
import { Role } from "../../auth/types/user.types";
import { formatDateTime } from "../../../shared/utils/dates";

type StepState = "done" | "current" | "refused" | "pending" | "skipped";

interface StepView {
  key: string;
  title: string;
  state: StepState;
  lines: string[];
}

const DECISIONS_OF_STEP = ["TRANSMISE", "VALIDEE", "REFUSEE"];

// Qui a agi : nom (gestionnaires) ou rôle seul (le proche ne voit pas les noms, masqués par le backend)
const who = (entry: HistoriqueDemande) => {
  const role = entry.auteur_role_label ?? (entry.auteur_role ? roleLabel(entry.auteur_role as Role) : null);
  if (entry.auteur_nom && role) return `${entry.auteur_nom} (${role})`;
  return entry.auteur_nom ?? role ?? "—";
};

// Décision la plus récente prise à une étape (après un éventuel réacheminement)
const lastDecision = (history: HistoriqueDemande[], etape: EtapeDemande) =>
  history.filter((h) => h.etape === etape && DECISIONS_OF_STEP.includes(h.decision)).pop();

// Étape de vérification / décision : terminée, refusée, en cours, en attente ou sautée
const decisionStep = (
  key: EtapeDemande,
  title: string,
  demande: DemandeVisite,
  history: HistoriqueDemande[],
  closedBefore: boolean
): StepView => {
  const entry = lastDecision(history, key);
  if (entry) {
    const refused = entry.decision === "REFUSEE";
    const verb = entry.decision === "TRANSMISE" ? "Transmise" : refused ? "Refusée" : "Validée";
    const lines = [`${verb} par ${who(entry)}`, formatDateTime(entry.horodatage)];
    if (entry.motif || (refused && entry.commentaire)) lines.push(`Motif : ${entry.motif || entry.commentaire}`);
    return { key, title, state: refused ? "refused" : "done", lines };
  }
  if (closedBefore) return { key, title, state: "skipped", lines: [] };
  if (demande.etape_courante === key) {
    return { key, title, state: "current", lines: [demande.statut === "SOUMISE" ? "En attente de prise en charge" : "En cours"] };
  }
  // Complément demandé à cette étape : la demande attend le proche
  const complement = history.filter((h) => h.etape === key && h.decision === "INCOMPLETE").pop();
  if (demande.statut === "INCOMPLETE" && complement) {
    return {
      key,
      title,
      state: "current",
      lines: [`Pièces demandées par ${who(complement)}`, formatDateTime(complement.horodatage), complement.commentaire].filter(Boolean),
    };
  }
  return { key, title, state: "pending", lines: [] };
};

const buildSteps = (demande: DemandeVisite): StepView[] => {
  const sorted = [...demande.historique].sort((a, b) => a.horodatage.localeCompare(b.horodatage));
  // Après un réacheminement (prévenu ↔ condamné, transfert), seules les étapes suivantes comptent
  const reroute = sorted.map((h) => h.evenement).lastIndexOf("REACHEMINEMENT");
  const history = reroute >= 0 ? sorted.slice(reroute + 1) : sorted;

  const steps: StepView[] = [
    {
      key: "DEPOT",
      title: "Dépôt de la demande",
      state: "done",
      lines: [`Par ${demande.proche_nom}`, formatDateTime(demande.soumise_le ?? demande.cree_le)],
    },
  ];

  if (demande.circuit === "JUDICIAIRE") {
    const greffe = decisionStep("GREFFE", "Vérification par le greffe", demande, history, false);
    const magistrat = demande.magistrat_attendu ? roleLabel(demande.magistrat_attendu) : "magistrat";
    steps.push(greffe);
    steps.push(decisionStep("MAGISTRAT", `Décision du ${magistrat.toLowerCase()}`, demande, history, greffe.state === "refused"));
  } else {
    steps.push(decisionStep("PRISON", "Vérification et décision de l'établissement", demande, history, false));
  }

  // Refus automatique (détenu libéré, lien révoqué…) : il clôt l'étape en cours
  const auto = history.filter((h) => h.etape === "SYSTEME" && h.decision === "REFUSEE").pop();
  if (auto) {
    const open = steps.find((s) => s.state === "current" || s.state === "pending");
    if (open) {
      open.state = "refused";
      open.lines = ["Refus automatique", formatDateTime(auto.horodatage), auto.motif || auto.commentaire].filter(Boolean);
    }
    steps.forEach((s) => {
      if (s.state === "pending") s.state = "skipped";
    });
  }

  const refused = steps.some((s) => s.state === "refused");
  steps.push({
    key: "PERMIS",
    title: "Permis de visite",
    state: demande.permis ? "done" : refused ? "skipped" : "pending",
    lines: demande.permis ? [`Permis ${demande.permis.numero}`] : [],
  });
  return steps;
};

const STATE_STYLES: Record<StepState, { dot: string; title: string; icon: React.ReactNode }> = {
  done: { dot: "bg-green-600 text-white", title: "text-gray-900", icon: <Check className="h-4 w-4" /> },
  current: { dot: "bg-blue-600 text-white", title: "text-blue-800", icon: <Clock className="h-4 w-4" /> },
  refused: { dot: "bg-red-600 text-white", title: "text-red-800", icon: <X className="h-4 w-4" /> },
  pending: { dot: "bg-gray-200 text-gray-500", title: "text-gray-500", icon: <Circle className="h-3 w-3" /> },
  skipped: { dot: "bg-gray-100 text-gray-300", title: "text-gray-400 line-through", icon: <Circle className="h-3 w-3" /> },
};

const STATE_TEXT: Record<StepState, string> = {
  done: "terminée",
  current: "en cours",
  refused: "refusée",
  pending: "à venir",
  skipped: "sans objet",
};

// Frise des étapes : dépôt → greffe → magistrat → permis (judiciaire) ou dépôt → prison → permis
export const EtapesDemande: React.FC<{ demande: DemandeVisite }> = ({ demande }) => {
  const steps = buildSteps(demande);
  return (
    <ol className="grid gap-4 md:grid-flow-col md:auto-cols-fr">
      {steps.map((step, index) => {
        const style = STATE_STYLES[step.state];
        return (
          <li key={step.key} className="relative flex gap-3 md:flex-col">
            {/* Trait de liaison vers l'étape suivante */}
            {index < steps.length - 1 && (
              <span aria-hidden className="absolute left-4 top-8 h-[calc(100%-1rem)] w-px bg-gray-200 md:left-8 md:top-4 md:h-px md:w-[calc(100%-1rem)]" />
            )}
            <span className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${style.dot}`}>
              {style.icon}
            </span>
            <div className="text-sm">
              <p className={`font-medium ${style.title}`}>
                {step.title}
                <span className="sr-only"> ({STATE_TEXT[step.state]})</span>
              </p>
              {step.lines.map((line) => (
                <p key={line} className="text-gray-600">{line}</p>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
