// router/router.tsx
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../../widgets/layout/Layout';
import { Dashboard } from '../../components/Dashboard';
import { InmateListPage } from '../../pages/inmates/DetenusPage';
import { InmateDetailPage } from '../../pages/inmates/DetenuDetailPage';
import { PresidentialPardons } from '../../components/PresidentialPardons';
import { SecurityDashboard } from '../../components/SecurityDashboard';
import { ReinsertionManagement } from '../../components/ReinsertionManagement';
import { TransfersReleases } from '../../components/TransfersReleases';
import { ReportsManagement } from '../../components/ReportsManagement';
import { Settings } from '../../components/Settings';
import { GenericDashboard } from '../../components/GenericDashboard';

import { RequireAuth } from "../../features/auth/components/RequireAuth";
import { ProtectedRoute, FORBIDDEN_PATH } from "../../features/auth/components/ProtectedRoute";
import { RoutePath } from "../../features/auth/config/rbac";
import { ForbiddenPage } from "../../pages/errors/ForbiddenPage";
import { LoginPage } from "../../pages/login/LoginPage";
import { AuthBootstrap } from '../../features/auth/components/AuthBootstrap';
import { VisiteListPage } from '../../pages/visites/VisitePage';
import { TransfertListPage } from '../../pages/transferts/TransfertPage';
import { VisiteDetailPage } from '../../pages/visites/VisitDetailPage';
import { VisiteFormPage } from '../../pages/visites/VisiteFormPage';
import { TransfertDetailPage } from '../../pages/transferts/TransfertDetailPage';
import { DetenuFormPage } from '../../pages/inmates/DetenuFormPage';
import { TransfertFormPage } from '../../pages/transferts/TransfertFormPage';
import { SortieFormPage } from '../../pages/transferts/SortieFormPage';
import { IncidentsPage } from '../../pages/incidents/IncidentsPage';
import { IncidentFormPage } from '../../pages/incidents/IncidentFormPage';
import { InfirmeriePage } from '../../pages/infirmerie/InfirmeriePage';
import { InfirmerieFormPage } from '../../pages/infirmerie/InfirmerieFormPage';
import { HomePage } from '../../pages/home/HomePage';
import { AccountStatusPage } from '../../pages/errors/AccountStatusPage';
import { UsersPage } from '../../pages/users/UsersPage';
import { ProchesValidationPage } from '../../pages/proches/ProchesValidationPage';
import { AffectationsPage } from '../../pages/affectations/AffectationsPage';
import { EtablissementsPage } from '../../pages/prisons/EtablissementsPage';
import { RegisterPage } from '../../pages/register/RegisterPage';
import { MesDemandesPage } from '../../pages/demandes-visite/MesDemandesPage';
import { DemandeVisiteFormPage } from '../../pages/demandes-visite/DemandeVisiteFormPage';
import { MaDemandeDetailPage } from '../../pages/demandes-visite/MaDemandeDetailPage';
import { DemandesATraiterPage } from '../../pages/demandes-visite/DemandesATraiterPage';
import { DemandeVerificationPage } from '../../pages/demandes-visite/DemandeVerificationPage';
import { PermisPage } from '../../pages/permis/PermisPage';
import { VerificationPermisPage } from '../../pages/permis/VerificationPermisPage';
import { DecisionsPage } from '../../pages/decisions/DecisionsPage';
import { NotificationsPage } from '../../pages/notifications/NotificationsPage';
import { DecisionFormPage } from '../../pages/decisions/DecisionFormPage';
import { JusticeDashboard } from '../../pages/stats/JusticeDashboard';
import { InterieurDashboard } from '../../pages/stats/InterieurDashboard';
import { CompteDetenuPage } from '../../pages/cantine/CompteDetenuPage';
import { CantinePage } from '../../pages/cantine/CantinePage';
import { MesCommandesPage } from '../../pages/cantine/MesCommandesPage';
import { PreparationCommandesPage } from '../../pages/cantine/PreparationCommandesPage';
import { CatalogueAdminPage } from '../../pages/cantine/CatalogueAdminPage';
import { PlafondsPage } from '../../pages/cantine/PlafondsPage';
import { ComptesPrisonPage } from '../../pages/cantine/ComptesPrisonPage';

// Garde d'affichage : la règle de chaque chemin est dans features/auth/config/rbac.ts (ROUTE_ACCESS).
// Le backend refuse de toute façon (403 / 404) ce qui n'est pas autorisé.
const guard = (path: RoutePath, element: React.ReactNode) =>
  <ProtectedRoute path={path}>{element}</ProtectedRoute>;

export const router = createBrowserRouter([
  // 🔓 ROUTES PUBLIQUES
  {
    path: "/login",
    element: <LoginPage />,
  },
  // Inscription d'un proche référent (compte validé ensuite par l'établissement)
  {
    path: "/inscription",
    element: <RegisterPage />,
  },

  // 🔐 ROUTES PROTÉGÉES
  {
    element: <AuthBootstrap />,
    children: [

      {
        element: <RequireAuth />,
        children: [
          // Compte en attente / refusé / désactivé / sans rôle
          {
            path: "/compte",
            element: <AccountStatusPage />,
          },
          {
            path: "/",
            element: <Layout />,
            children: [
              {
                index: true,
                element: <HomePage />,
              },
              {
                path: "prison",
                element: guard("/prison", <Dashboard />),
              },
              {
                path: "generic-dashboard",
                element: guard("/generic-dashboard", <GenericDashboard />),
              },
              {
                path: "detenus",
                children: [
                  { index: true, element: guard("/detenus", <InmateListPage />) },
                  { path: ":id", element: guard("/detenus/:id", <InmateDetailPage />) },
                  { path: "new", element: guard("/detenus/new", <DetenuFormPage />) },
                  { path: "update/:id", element: guard("/detenus/update/:id", <DetenuFormPage />) },
                ],
              },
              {
                path: "visits",
                children: [
                  { index: true, element: guard("/visits", <VisiteListPage />) },
                  { path: "new", element: guard("/visits/new", <VisiteFormPage />) },
                  { path: "update/:id", element: guard("/visits/update/:id", <VisiteFormPage />) },
                  { path: ":id", element: guard("/visits/:id", <VisiteDetailPage />) },
                ],
              },
              {
                path: "transfers",
                children: [
                  { index: true, element: guard("/transfers", <TransfertListPage />) },
                  { path: "new", element: guard("/transfers/new", <TransfertFormPage />) },
                  { path: "update/:id", element: guard("/transfers/update/:id", <TransfertFormPage />) },
                  { path: "sorties/new", element: guard("/transfers/sorties/new", <SortieFormPage />) },
                  { path: "sorties/update/:id", element: guard("/transfers/sorties/update/:id", <SortieFormPage />) },
                  { path: ":id", element: guard("/transfers/:id", <TransfertDetailPage />) },
                ],
              },
              {
                path: "pardons",
                element: guard("/pardons", <PresidentialPardons />),
              },
              {
                path: "reinsertion",
                element: guard("/reinsertion", <ReinsertionManagement />),
              },
              {
                path: "transfers-releases",
                element: guard("/transfers-releases", <TransfersReleases />),
              },
              {
                path: "reports",
                element: guard("/reports", <ReportsManagement />),
              },
              {
                path: "incidents",
                children: [
                  { index: true, element: guard("/incidents", <IncidentsPage />) },
                  { path: "new", element: guard("/incidents/new", <IncidentFormPage />) },
                  { path: "update/:id", element: guard("/incidents/update/:id", <IncidentFormPage />) },
                ],
              },
              {
                path: "infirmerie",
                children: [
                  { index: true, element: guard("/infirmerie", <InfirmeriePage />) },
                  { path: "new", element: guard("/infirmerie/new", <InfirmerieFormPage />) },
                  { path: "update/:id", element: guard("/infirmerie/update/:id", <InfirmerieFormPage />) },
                ],
              },
              {
                path: "security",
                element: guard("/security", <SecurityDashboard />),
              },
              {
                path: "users",
                element: guard("/users", <UsersPage />),
              },
              {
                path: "proches",
                element: guard("/proches", <ProchesValidationPage />),
              },
              {
                path: "affectations",
                element: guard("/affectations", <AffectationsPage />),
              },
              {
                // Création : SUPER_ADMIN ; modification : SUPER_ADMIN ou ADMIN_PRISON (le sien)
                path: "etablissements",
                element: guard("/etablissements", <EtablissementsPage />),
              },
              {
                // Proche référent : demandes de visite et permis
                path: "mes-demandes",
                children: [
                  { index: true, element: guard("/mes-demandes", <MesDemandesPage />) },
                  { path: "new", element: guard("/mes-demandes/new", <DemandeVisiteFormPage />) },
                  { path: ":id", element: guard("/mes-demandes/:id", <MaDemandeDetailPage />) },
                ],
              },
              {
                // Gestionnaires : acteur judiciaire (prévenus affectés), AP / SP (condamnés de la prison)
                path: "demandes",
                children: [
                  { index: true, element: guard("/demandes", <DemandesATraiterPage />) },
                  { path: ":id", element: guard("/demandes/:id", <DemandeVerificationPage />) },
                ],
              },
              {
                path: "permis",
                element: guard("/permis", <PermisPage />),
              },
              {
                // Agent pénitentiaire : contrôle d'un permis à l'entrée (numéro, code ou QR code)
                path: "verification-permis",
                element: guard("/verification-permis", <VerificationPermisPage />),
              },
              // Notifications de l'utilisateur (tous les rôles ; cloche dans l'en-tête)
              { path: "notifications", element: guard("/notifications", <NotificationsPage />) },
              {
                path: "decisions",
                children: [
                  { index: true, element: guard("/decisions", <DecisionsPage />) },
                  { path: "new", element: guard("/decisions/new", <DecisionFormPage />) },
                  { path: ":id/correct", element: guard("/decisions/:id/correct", <DecisionFormPage />) },
                ],
              },
              // Compte argent et cantine : proche (compte, cantine, commandes), AG / AP (préparation),
              // AP / SP (catalogue, plafonds, comptes de la prison)
              { path: "compte-detenu", element: guard("/compte-detenu", <CompteDetenuPage />) },
              { path: "comptes", element: guard("/comptes", <ComptesPrisonPage />) },
              {
                path: "cantine",
                children: [
                  { index: true, element: guard("/cantine", <CantinePage />) },
                  { path: "commandes", element: guard("/cantine/commandes", <MesCommandesPage />) },
                  { path: "preparation", element: guard("/cantine/preparation", <PreparationCommandesPage />) },
                  { path: "catalogue", element: guard("/cantine/catalogue", <CatalogueAdminPage />) },
                  { path: "plafonds", element: guard("/cantine/plafonds", <PlafondsPage />) },
                ],
              },
              {
                // Tableaux de bord nationaux (lecture seule) ; accueil des ministères, voir HomePage
                path: "statistiques",
                children: [
                  { path: "justice", element: guard("/statistiques/justice", <JusticeDashboard />) },
                  { path: "interieur", element: guard("/statistiques/interieur", <InterieurDashboard />) },
                ],
              },
              {
                path: "settings",
                element: guard("/settings", <Settings />),
              },
              // 403 : écran refusé par ProtectedRoute
              {
                path: FORBIDDEN_PATH.slice(1),
                element: <ForbiddenPage />,
              },
              // 404 PROTÉGÉ
              {
                path: "*",
                element: (
                  <div className="flex flex-col items-center justify-center h-64">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      404 - Page non trouvée
                    </h2>
                    <p className="text-gray-600">
                      La page que vous cherchez n'existe pas.
                    </p>
                  </div>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);
