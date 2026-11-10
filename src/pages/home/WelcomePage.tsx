import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, UserRound } from "lucide-react";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { useRole } from "../../features/auth/hooks/useRole";
import { ROUTE_ACCESS, RoutePath } from "../../features/auth/config/rbac";
import { useGetDetenus } from "../../features/detenus/api/useGetDetenu";
import { useGetPrisons } from "../../features/prisons/api/useGetPrison";
import { Detenu } from "../../features/detenus/types/detenu";
import { Prison } from "../../features/prisons/types/prison";
import { RelativeRequestsPanel } from "../../features/proches/components/RelativeRequestsPanel";

// Raccourcis de l'accueil : affichés seulement si la route est accessible (même règle que le menu)
const SHORTCUTS: { path: RoutePath; label: string }[] = [
  { path: "/mes-demandes/new", label: "Demander un permis de visite" },
  { path: "/mes-demandes", label: "Suivre mes demandes" },
];

// Accueil « Mes détenus » des proches référents et des acteurs judiciaires
// (et accueil par défaut d'un compte sans accès aux détenus).
export const WelcomePage: React.FC = () => {
  const { user, can, allows } = usePermissions();
  const { label, isRelative, isJudicialActor } = useRole();
  const canReadPrisoners = can("prisoners:read");

  // Le backend ne renvoie que les détenus liés (proche) ou affectés (acteur judiciaire)
  const { data: detenus = [], isLoading } = useGetDetenus();
  const { data: prisons = [] } = useGetPrisons();
  const links = user?.links ?? [];

  const prisonName = useMemo(() => {
    const names = new Map((prisons as Prison[]).map((p) => [p.id, p.name]));
    return (id: number) => names.get(id) ?? "—";
  }, [prisons]);

  const linkInfo = (prisonerId: number) => {
    const link = links.find((l) => l.prisoner_id === prisonerId);
    if (!link) return "";
    return link.type === "judicial"
      ? `${link.function_label}${link.case_reference ? ` — dossier ${link.case_reference}` : ""}`
      : link.relationship_label;
  };

  const shortcuts = SHORTCUTS.filter((s) => allows(ROUTE_ACCESS[s.path]));
  const pendingLinks = links.filter((l) => l.type === "relative" && l.prisoner_id === null);
  const showPrisoners = canReadPrisoners && (isRelative || isJudicialActor);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">
          Bienvenue{user?.first_name ? `, ${user.first_name}` : ""}
        </h2>
        <p className="text-gray-600">{label}</p>

        {shortcuts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {shortcuts.map((s) => (
              <Link key={s.path} to={s.path}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                {s.label} <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {showPrisoners && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">
            {isJudicialActor ? "Mes détenus affectés" : "Mes détenus"}
          </h3>
          {isLoading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : detenus.length === 0 ? (
            <p className="text-sm text-gray-500">
              {isJudicialActor
                ? "Aucun détenu ne vous est actuellement affecté."
                : "Aucun détenu lié pour le moment (lien en attente de validation par l'établissement)."}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {(detenus as Detenu[]).map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <span className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{d.first_name} {d.last_name}</span>
                    {d.matricule_number && <span className="text-gray-500">({d.matricule_number})</span>}
                  </span>
                  <span className="text-gray-600">
                    {d.status} — {prisonName(d.prison)}
                    {linkInfo(d.id) && <span className="ml-2 text-gray-500">· {linkInfo(d.id)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {pendingLinks.length > 0 && (
            <p className="mt-3 text-sm text-amber-700">
              {pendingLinks.length} demande(s) de rattachement en cours de traitement.
            </p>
          )}
        </section>
      )}

      {isRelative && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <RelativeRequestsPanel />
        </div>
      )}
    </div>
  );
};
