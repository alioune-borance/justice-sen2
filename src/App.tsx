import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InmateList } from './components/InmateList';
import { InmateDetail } from './components/InmateDetail';
import { VisitManagement } from './components/VisitManagement';
import { Statistics } from './components/Statistics';
import { PresidentialPardons } from './components/PresidentialPardons';
import { SecurityDashboard } from './components/SecurityDashboard';
import { ReinsertionManagement } from './components/ReinsertionManagement';
import { Users } from './components/Users';
import { Settings } from './components/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedInmate, setSelectedInmate] = useState<number | null>(null);

  const renderContent = () => {
    if (selectedInmate) {
      return <InmateDetail onBack={() => setSelectedInmate(null)} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inmates':
        return <InmateList onViewDetail={setSelectedInmate} />;
      case 'visits':
        return <VisitManagement />;
      case 'statistics':
        return <Statistics />;
      case 'pardons':
        return <PresidentialPardons />;
      case 'reinsertion':
        return <ReinsertionManagement />;
      case 'security':
        return <SecurityDashboard />;
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    if (selectedInmate) {
      return 'Fiche détenu';
    }
    
    switch (currentPage) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'inmates':
        return 'Gestion des détenus';
      case 'visits':
        return 'Gestion des visites';
      case 'statistics':
        return 'Statistiques';
      case 'pardons':
        return 'Demandes de grâce';
      case 'reinsertion':
        return 'Gestion de la réinsertion';
      case 'security':
        return 'Sécurité & Analytique';
      case 'users':
        return 'Gestion des utilisateurs';
      case 'settings':
        return 'Paramètres';
      default:
        return 'Tableau de bord';
    }
  };

  return (
    <Layout
      title={getPageTitle()}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;