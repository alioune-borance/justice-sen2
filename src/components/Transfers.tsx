import React, { useState } from 'react';
import { ArrowRightLeft, LogOut, Calendar, Search, Filter, Plus, User, MapPin, Clock, CheckCircle, XCircle, AlertTriangle, FileText, Truck, Building, Phone, Mail, Eye, CreditCard as Edit, MoreVertical } from 'lucide-react';

interface Transfer {
  id: number;
  inmateId: string;
  inmateName: string;
  fromPrison: string;
  toPrison: string;
  reason: string;
  requestDate: string;
  scheduledDate: string;
  status: 'En attente' | 'Approuvé' | 'En cours' | 'Terminé' | 'Refusé';
  priority: 'Normale' | 'Urgente' | 'Critique';
  requestedBy: string;
  transportType: 'Fourgon' | 'Escorte' | 'Ambulance';
}

interface Release {
  id: number;
  inmateId: string;
  inmateName: string;
  prison: string;
  releaseType: 'Fin de peine' | 'Libération conditionnelle' | 'Grâce présidentielle' | 'Acquittement';
  scheduledDate: string;
  status: 'Programmée' | 'En cours' | 'Terminée' | 'Reportée';
  conditions?: string[];
  followUpRequired: boolean;
  contactPerson?: string;
  documents: string[];
}

const transfers: Transfer[] = [
  {
    id: 1,
    inmateId: 'ECR-2021-003457',
    inmateName: 'Martin Dubois',
    fromPrison: 'Fresnes',
    toPrison: 'Fleury-Mérogis',
    reason: 'Surpopulation',
    requestDate: '15/01/2024',
    scheduledDate: '25/01/2024',
    status: 'Approuvé',
    priority: 'Normale',
    requestedBy: 'Direction Fresnes',
    transportType: 'Fourgon'
  },
  {
    id: 2,
    inmateId: 'ECR-2022-001234',
    inmateName: 'Sophie Laurent',
    fromPrison: 'Marseille',
    toPrison: 'Hôpital Sainte-Marguerite',
    reason: 'Soins médicaux',
    requestDate: '18/01/2024',
    scheduledDate: '20/01/2024',
    status: 'En cours',
    priority: 'Urgente',
    requestedBy: 'Service médical',
    transportType: 'Ambulance'
  },
  {
    id: 3,
    inmateId: 'ECR-2023-005678',
    inmateName: 'Pierre Moreau',
    fromPrison: 'Lyon',
    toPrison: 'Tribunal de Lyon',
    reason: 'Comparution',
    requestDate: '19/01/2024',
    scheduledDate: '22/01/2024',
    status: 'En attente',
    priority: 'Normale',
    requestedBy: 'Tribunal de Lyon',
    transportType: 'Escorte'
  }
];

const releases: Release[] = [
  {
    id: 1,
    inmateId: 'ECR-2020-002345',
    inmateName: 'Jean Dupont',
    prison: 'Fresnes',
    releaseType: 'Fin de peine',
    scheduledDate: '28/01/2024',
    status: 'Programmée',
    followUpRequired: true,
    contactPerson: 'Service de probation Paris',
    documents: ['Certificat de libération', 'Carte d\'identité', 'Attestation de domicile']
  },
  {
    id: 2,
    inmateId: 'ECR-2021-004567',
    inmateName: 'Marie Leroy',
    prison: 'Marseille',
    releaseType: 'Libération conditionnelle',
    scheduledDate: '30/01/2024',
    status: 'Programmée',
    conditions: ['Pointage hebdomadaire', 'Interdiction de contact avec la victime', 'Suivi psychologique'],
    followUpRequired: true,
    contactPerson: 'Juge d\'application des peines',
    documents: ['Décision JAP', 'Conditions de libération', 'Adresse de résidence']
  },
  {
    id: 3,
    inmateId: 'ECR-2019-001234',
    inmateName: 'Paul Martin',
    prison: 'Lyon',
    releaseType: 'Grâce présidentielle',
    scheduledDate: '02/02/2024',
    status: 'En cours',
    followUpRequired: false,
    documents: ['Décret présidentiel', 'Certificat de libération']
  }
];

export const Transfers: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transfers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const tabs = [
    { id: 'transfers', label: 'Transferts', icon: ArrowRightLeft },
    { id: 'releases', label: 'Sorties', icon: LogOut },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'transport', label: 'Transport', icon: Truck },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approuvé':
      case 'Programmée':
        return 'bg-green-100 text-green-800';
      case 'En cours':
        return 'bg-blue-100 text-blue-800';
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Terminé':
      case 'Terminée':
        return 'bg-gray-100 text-gray-800';
      case 'Refusé':
      case 'Reportée':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critique':
        return 'bg-red-100 text-red-800';
      case 'Urgente':
        return 'bg-orange-100 text-orange-800';
      case 'Normale':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReleaseTypeColor = (type: string) => {
    switch (type) {
      case 'Fin de peine':
        return 'bg-green-100 text-green-800';
      case 'Libération conditionnelle':
        return 'bg-blue-100 text-blue-800';
      case 'Grâce présidentielle':
        return 'bg-purple-100 text-purple-800';
      case 'Acquittement':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTransfersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Gestion des transferts</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nouveau transfert</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou numéro d'écrou..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="En attente">En attente</option>
            <option value="Approuvé">Approuvé</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">Toutes priorités</option>
            <option value="Critique">Critique</option>
            <option value="Urgente">Urgente</option>
            <option value="Normale">Normale</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Détenu</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Transfert</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Motif</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date prévue</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Priorité</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transfers.map((transfer) => (
              <tr key={transfer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{transfer.inmateName}</p>
                      <p className="text-xs text-gray-500">{transfer.inmateId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-800">{transfer.fromPrison}</span>
                    <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-800">{transfer.toPrison}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{transfer.transportType}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">{transfer.reason}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{transfer.scheduledDate}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(transfer.priority)}`}>
                    {transfer.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transfer.status)}`}>
                    {transfer.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button className="p-1 text-blue-600 hover:text-blue-800" title="Voir détails">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-800" title="Modifier">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-800" title="Plus d'options">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReleasesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Gestion des sorties</h3>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Programmer une sortie</span>
        </button>
      </div>

      <div className="space-y-4">
        {releases.map((release) => (
          <div key={release.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <LogOut className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{release.inmateName}</h4>
                  <p className="text-sm text-gray-600">{release.inmateId} • {release.prison}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${getReleaseTypeColor(release.releaseType)}`}>
                      {release.releaseType}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(release.status)}`}>
                      {release.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">Date prévue</p>
                <p className="text-lg font-bold text-blue-600">{release.scheduledDate}</p>
              </div>
            </div>

            {release.conditions && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Conditions de libération :</h5>
                <div className="flex flex-wrap gap-2">
                  {release.conditions.map((condition, index) => (
                    <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Documents requis :</h5>
                <div className="space-y-1">
                  {release.documents.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
              {release.contactPerson && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Contact de suivi :</h5>
                  <p className="text-sm text-gray-600">{release.contactPerson}</p>
                  {release.followUpRequired && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-orange-600">Suivi post-carcéral requis</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Programmée</span>
                </div>
                {release.followUpRequired && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>Suivi requis</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm">
                  Voir détails
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                  Modifier
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlanningTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Planning des mouvements</h3>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Calendrier des mouvements</h4>
            <p className="text-gray-600">Vue calendrier des transferts et sorties programmés</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransportTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Gestion du transport</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Truck className="h-6 w-6 text-blue-600" />
            <h4 className="font-semibold text-slate-800">Véhicules disponibles</h4>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">12</div>
          <p className="text-sm text-gray-600">Fourgons et escortes</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-6 w-6 text-yellow-600" />
            <h4 className="font-semibold text-slate-800">En mission</h4>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">3</div>
          <p className="text-sm text-gray-600">Véhicules en cours</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="h-6 w-6 text-green-600" />
            <h4 className="font-semibold text-slate-800">Trajets aujourd'hui</h4>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">8</div>
          <p className="text-sm text-gray-600">Mouvements programmés</p>
        </div>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Gestion documentaire</h3>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Documents et formulaires</h4>
            <p className="text-gray-600">Gestion des documents administratifs pour les transferts et sorties</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transfers':
        return renderTransfersTab();
      case 'releases':
        return renderReleasesTab();
      case 'planning':
        return renderPlanningTab();
      case 'transport':
        return renderTransportTab();
      case 'documents':
        return renderDocumentsTab();
      default:
        return renderTransfersTab();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des sorties et transferts</h2>
        <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-lg">
          <ArrowRightLeft className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">Module Mouvements</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transferts en attente</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">15</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <ArrowRightLeft className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sorties programmées</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">8</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <LogOut className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mouvements aujourd'hui</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">12</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urgences</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">3</p>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};