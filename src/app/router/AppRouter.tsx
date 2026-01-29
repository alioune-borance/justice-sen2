// router/router.tsx
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../../widgets/layout/Layout';
import { Dashboard } from '../../components/Dashboard';
import { InmateListPage } from '../../pages/inmates/DetenusPage';
import { InmateDetailPage } from '../../pages/inmates/DetenuDetailPage';
import { VisitManagement } from '../../components/VisitManagement';
import { PresidentialPardons } from '../../components/PresidentialPardons';
import { SecurityDashboard } from '../../components/SecurityDashboard';
import { ReinsertionManagement } from '../../components/ReinsertionManagement';
import { TransfersReleases } from '../../components/TransfersReleases';
import { ReportsManagement } from '../../components/ReportsManagement';
import { Users } from '../../components/Users';
import { Settings } from '../../components/Settings';
import { Transfers } from '../../components/Transfers';
import { GenericDashboard } from '../../components/GenericDashboard';

import { RequireAuth } from "../../features/auth/components/RequireAuth";
import { LoginPage } from "../../pages/login/LoginPage";
import { AuthBootstrap } from '../../features/auth/components/AuthBootstrap';
import { VisiteListPage } from '../../pages/visites/VisitePage';
import { TransfertListPage } from '../../pages/transferts/TransfertPage';
import { VisiteDetail } from '../../components/visite/VisiteDetail';
import { VisiteDetailPage } from '../../pages/visites/VisitDetailPage';
import { TransfertDetailPage } from '../../pages/transferts/TransfertDetailPage';

export const router = createBrowserRouter([
  // 🔓 ROUTES PUBLIQUES
  {
    path: "/login",
    element: <LoginPage />,
  },

  // 🔐 ROUTES PROTÉGÉES
  {
    element: <AuthBootstrap />,
    children: [
    
      {
        element: <RequireAuth />,
        children: [
          {
            path: "/",
            element: <Layout />,
            children: [
              {
                index: true,
                element: <Dashboard />,
              },
              {
                path: "prison",
                element: <Dashboard />,
              },
              {
                path: "generic-dashboard",
                element: <GenericDashboard />,
              },
              {
                path: "detenus",
                children: [
                  {
                    index: true,
                    element: <InmateListPage />,
                  },
                  {
                    path: ":id",
                    element: <InmateDetailPage />,
                  },
                ],
              },
              {
                path: "visits",
                children: [
                  {
                    index: true, 
                    element: <VisiteListPage />,
                    // element: <VisitManagement />,
                  },
                  {
                    path: ":id",
                    element: <VisiteDetailPage />,
                  },
                ],
                
              },
              {
                path: "transfers",
                children: [
                  {
                  index: true,
                  element: <TransfertListPage />
                  //element: <Transfers />
                  },
                  {
                    path: ":id",
                    element: <TransfertDetailPage />,
                  },

                ]
              },
              {
                path: "pardons",
                element: <PresidentialPardons />,
              },
              {
                path: "reinsertion",
                element: <ReinsertionManagement />,
              },
              {
                path: "transfers-releases",
                element: <TransfersReleases />,
              },
              {
                path: "reports",
                element: <ReportsManagement />,
              },
              {
                path: "security",
                element: <SecurityDashboard />,
              },
              {
                path: "users",
                element: <Users />,
              },
              {
                path: "settings",
                element: <Settings />,
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
