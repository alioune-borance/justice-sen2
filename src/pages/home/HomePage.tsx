import React from "react";
import { Navigate } from "react-router-dom";
import { Dashboard } from "../../components/Dashboard";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { useRole } from "../../features/auth/hooks/useRole";
import { HOME_REDIRECT } from "../../features/auth/config/rbac";
import { WelcomePage } from "./WelcomePage";
import { JusticeDashboard } from "../stats/JusticeDashboard";
import { InterieurDashboard } from "../stats/InterieurDashboard";

// Page d'accueil selon le rôle (affichage seulement : chaque écran ne reçoit que les données autorisées)
export const HomePage: React.FC = () => {
  const { can } = usePermissions();
  const { role, isRelative, isJudicialActor } = useRole();

  const redirect = role ? HOME_REDIRECT[role] : undefined;
  if (redirect) return <Navigate to={redirect} replace />;

  // Ministères : leur tableau de bord national, en lecture seule (GET stats/justice|interieur/)
  if (role === "REP_MIN_JUSTICE") return <JusticeDashboard />;
  if (role === "REP_MIN_INTERIEUR") return <InterieurDashboard />;
  // Proche référent et acteur judiciaire : « mes détenus » et raccourcis
  if (isRelative || isJudicialActor || !can("prisoners:read")) return <WelcomePage />;
  // Rôles prison et super administrateur : tableau de bord de l'établissement
  return <Dashboard />;
};
