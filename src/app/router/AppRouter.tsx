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
import { RequirePermission } from "../../features/auth/components/RequirePermission";
import { Permission, Role } from "../../features/auth/types/user.types";
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
import { RegisterPage } from '../../pages/register/RegisterPage';

// Garde d'affichage : le backend refuse de toute façon (403 / 404) ce qui n'est pas autorisé
const guard = (perm: Permission | Permission[], element: React.ReactNode) =>
  Array.isArray(perm)
    ? <RequirePermission anyOf={perm}>{element}</RequirePermission>
    : <RequirePermission perm={perm}>{element}</RequirePermission>;

// Écrans maquettes (données statiques, sans API) : réservés au super administrateur
const SUPER_ADMIN_ONLY: Role[] = ['SUPER_ADMIN'];
const mockup = (element: React.ReactNode) => <RequirePermission roles={SUPER_ADMIN_ONLY}>{element}</RequirePermission>;

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
                element: guard('prisoners:read', <Dashboard />),
              },
              {
                path: "generic-dashboard",
                element: mockup(<GenericDashboard />),
              },
              {
                path: "detenus",
                children: [
                  { index: true, element: guard('prisoners:read', <InmateListPage />) },
                  { path: ":id", element: guard('prisoners:read', <InmateDetailPage />) },
                  { path: "new", element: guard('prisoners:create', <DetenuFormPage />) },
                  { path: "update/:id", element: guard('prisoners:update', <DetenuFormPage />) },
                ],
              },
              {
                path: "visits",
                children: [
                  { index: true, element: guard('visits:read', <VisiteListPage />) },
                  { path: "new", element: guard('visits:create', <VisiteFormPage />) },
                  { path: "update/:id", element: guard('visits:update', <VisiteFormPage />) },
                  { path: ":id", element: guard('visits:read', <VisiteDetailPage />) },
                ],
              },
              {
                path: "transfers",
                children: [
                  { index: true, element: guard(['transfers:read', 'exits:read'], <TransfertListPage />) },
                  { path: "new", element: guard('transfers:create', <TransfertFormPage />) },
                  { path: "update/:id", element: guard('transfers:update', <TransfertFormPage />) },
                  { path: "sorties/new", element: guard('exits:create', <SortieFormPage />) },
                  { path: "sorties/update/:id", element: guard('exits:update', <SortieFormPage />) },
                  { path: ":id", element: guard('transfers:read', <TransfertDetailPage />) },
                ],
              },
              {
                path: "pardons",
                element: mockup(<PresidentialPardons />),
              },
              {
                path: "reinsertion",
                element: mockup(<ReinsertionManagement />),
              },
              {
                path: "transfers-releases",
                element: mockup(<TransfersReleases />),
              },
              {
                path: "reports",
                element: mockup(<ReportsManagement />),
              },
              {
                path: "incidents",
                children: [
                  { index: true, element: guard('disciplinary_records:read', <IncidentsPage />) },
                  { path: "new", element: guard('disciplinary_records:create', <IncidentFormPage />) },
                  { path: "update/:id", element: guard('disciplinary_records:update', <IncidentFormPage />) },
                ],
              },
              {
                path: "infirmerie",
                children: [
                  { index: true, element: guard('health_records:read', <InfirmeriePage />) },
                  { path: "new", element: guard('health_records:create', <InfirmerieFormPage />) },
                  { path: "update/:id", element: guard('health_records:update', <InfirmerieFormPage />) },
                ],
              },
              {
                path: "security",
                element: mockup(<SecurityDashboard />),
              },
              {
                path: "users",
                element: guard('users:read', <UsersPage />),
              },
              {
                path: "proches",
                element: guard('relative_links:validate', <ProchesValidationPage />),
              },
              {
                path: "affectations",
                element: guard('judicial_assignments:read', <AffectationsPage />),
              },
              {
                path: "settings",
                element: mockup(<Settings />),
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
