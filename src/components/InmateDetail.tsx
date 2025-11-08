import React, { useState } from 'react';
import { ArrowLeft, User, FileText, Calendar, Heart, Award } from 'lucide-react';

interface InmateDetailProps {
  onBack: () => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ 
  active, 
  onClick, 
  children 
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm border-b-2 ${
      active 
        ? 'border-blue-500 text-blue-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
  >
    {children}
  </button>
);

export const InmateDetail: React.FC<InmateDetailProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Informations personnelles', icon: User },
    { id: 'criminal', label: 'Casier judiciaire', icon: FileText },
    { id: 'visits', label: 'Historique des visites', icon: Calendar },
    { id: 'behavior', label: 'Comportement et notes', icon: Heart },
    { id: 'pardon', label: 'Éligibilité à la grâce', icon: Award }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <p className="text-lg font-semibold text-slate-800">Martin Dubois</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <p className="text-gray-800">15/03/1985 (38 ans)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                <p className="text-gray-800">Paris, France</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'écrou</label>
                <p className="text-gray-800">ECR-2021-003457</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Établissement</label>
                <p className="text-gray-800">Maison d'arrêt de Fresnes</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'incarcération</label>
                <p className="text-gray-800">12/08/2021</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin de peine prévue</label>
                <p className="text-gray-800">12/08/2026</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                  Détenu condamné
                </span>
              </div>
            </div>
          </div>
        );
      
      case 'criminal':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Condamnation principale</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Chef d'accusation:</span> Vol avec violence</p>
                <p><span className="font-medium">Peine:</span> 5 ans d'emprisonnement</p>
                <p><span className="font-medium">Tribunal:</span> Tribunal correctionnel de Paris</p>
                <p><span className="font-medium">Date de jugement:</span> 28/07/2021</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Antécédents</h4>
              <div className="space-y-2">
                <p><span className="font-medium">2018:</span> Vol simple - 6 mois avec sursis</p>
                <p><span className="font-medium">2016:</span> Conduite sous l'emprise - Amende</p>
              </div>
            </div>
          </div>
        );
      
      case 'visits':
        return (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Visiteur</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Relation</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Durée</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-800">15/01/2024</td>
                    <td className="px-4 py-3 text-sm text-gray-800">Marie Dubois</td>
                    <td className="px-4 py-3 text-sm text-gray-800">Épouse</td>
                    <td className="px-4 py-3 text-sm text-gray-800">45 min</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Terminée
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-800">08/01/2024</td>
                    <td className="px-4 py-3 text-sm text-gray-800">Paul Dubois</td>
                    <td className="px-4 py-3 text-sm text-gray-800">Père</td>
                    <td className="px-4 py-3 text-sm text-gray-800">30 min</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Terminée
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'behavior':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Comportement général</h4>
              <p className="text-green-700">Excellente conduite, participation active aux activités de réinsertion</p>
            </div>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-800">Note du 10/01/2024</h5>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Positive</span>
                </div>
                <p className="text-sm text-gray-600">Participation exemplaire à l'atelier menuiserie</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-800">Note du 03/01/2024</h5>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Positive</span>
                </div>
                <p className="text-sm text-gray-600">Aide apportée aux nouveaux détenus</p>
              </div>
            </div>
          </div>
        );
      
      case 'pardon':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Éligibilité à la grâce présidentielle</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Temps purgé:</span> 60% de la peine</p>
                <p><span className="font-medium">Comportement:</span> Exemplaire</p>
                <p><span className="font-medium">Activités de réinsertion:</span> Formation professionnelle en cours</p>
                <p><span className="font-medium">État de santé:</span> Bon</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Critères remplis</h4>
              <ul className="space-y-1 text-green-700">
                <li>✓ Plus de 50% de la peine purgée</li>
                <li>✓ Aucun incident disciplinaire depuis 18 mois</li>
                <li>✓ Participation active aux programmes de réinsertion</li>
                <li>✓ Soutien familial confirmé</li>
              </ul>
            </div>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Proposer pour grâce présidentielle
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Fiche détenu</h2>
      </div>
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};