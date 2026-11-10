import React from "react";
import { Navigate } from "react-router-dom";
import { Dashboard } from "../../components/Dashboard";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { WelcomePage } from "./WelcomePage";

// Page d'accueil selon le rôle
export const HomePage: React.FC = () => {
  const { role, can } = usePermissions();

  if (role === "PERSONNEL_SANTE") {
    return <Navigate to="/infirmerie" replace />;
  }
  // Portails des proches et des acteurs judiciaires : à venir (demandes de visite, décisions)
  if (role === "PROCHE_REFERENT" || role === "ACTEUR_JUDICIAIRE") {
    return <WelcomePage />;
  }
  if (!can("prisoners:read")) {
    return <WelcomePage />;
  }
  return <Dashboard />;
};
