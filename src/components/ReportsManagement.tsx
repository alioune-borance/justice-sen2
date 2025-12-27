import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, Search, Plus, BarChart3, Users, Building, Shield, Clock, CheckCircle, AlertTriangle, Eye, CreditCard as Edit, Trash2, Send, Settings, PieChart, TrendingUp, FileSpreadsheet, File as FilePdf, Printer } from 'lucide-react';

interface Report {
  id: number;
  title: string;
  type: 'statistique' | 'operationnel' | 'securite' | 'reinsertion' | 'financier';
  category: string;
  description: string;
  frequency: 'Ponctuel' | 'Quotidien' | 'Hebdomadaire' | 'Mensuel' | 'Trimestriel' | 'Annuel';
  status: 'Brouillon' | 'Programmé' | 'En cours' | 'Terminé' | 'Erreur';
  createdBy: string;
  createdDate: string;
  lastGenerated?: string;
  nextGeneration?: string;
  recipients: string[];
  format: 'PDF' | 'Excel' | 'CSV' | 'Word';
  size?: string;
}

interface ReportTemplate {
  id: number;
  name: string;
  type: string;
  description: string;
  fields: string[];
  isActive: boolean;
}

const reports: Report[] = [
  {
    id: 1,
    title: 'Rapport mensuel de population carcérale',
    type: 'statistique',
    category: 'Population',
    description: 'Analyse détaillée de la population carcérale par établissement',
    frequency: 'Mensuel',
    status: 'Terminé',
    createdBy: 'Direction Générale',
    createdDate: '15/01/2024',
    lastGenerated: '01/02/2024',
    nextGeneration: '01/03/2024',
    recipients: ['Ministère Justice', 'Direction Régionale'],
    format: 'PDF',
    size: '2.4 MB'
  },
  {
    id: 2,
    title: 'Rapport de sécurité hebdomadaire',
    type: 'securite',
    category: 'Incidents',
    description: 'Synthèse des incidents de sécurité et mesures prises',
    frequency: 'Hebdomadaire',
    status: 'Programmé',
    createdBy: 'Service Sécurité',
    createdDate: '10/01/2024',
    nextGeneration: '26/01/2024',
    recipients: ['Ministère Intérieur', 'Préfecture'],
    format: 'PDF'
  },
  {
    id: 3,
    title: 'Bilan des programmes de réinsertion',
    type: 'reinsertion',
    category: 'Formation',
    description: 'Évaluation des programmes de formation et taux de réussite',
    frequency: 'Trimestriel',
    status: 'En cours',
    createdBy: 'Service Réinsertion',
    createdDate: '05/01/2024',
    recipients: ['Direction Générale', 'Partenaires ONG'],
    format: 'Excel'
  },
  {
    id: 4,
    title: 'Rapport financier annuel',
    type: 'financier',
    category: 'Budget',
    description: 'Analyse des coûts et budget des établissements pénitentiaires',
    frequency: 'Annuel',
    status: 'Brouillon',
    createdBy: 'Service Financier',
    createdDate: '20/01/2024',
    recipients: ['Ministère Justice', 'Cour des Comptes'],
    format: 'Excel'
  }
];

const reportTemplates: ReportTemplate[] = [
  {
    id: 1,
    name: 'Modèle Population Standard',
    type: 'statistique',
    description: 'Modèle standard pour les rapports de population',
    fields: ['Effectifs', 'Répartition par âge', 'Types de crimes', 'Durée moyenne'],
    isActive: true
  },
  {
    id: 2,
    name: 'Modèle Sécurité Incidents',
    type: 'securite',
    description: 'Modèle pour les rapports d\'incidents de sécurité',
    fields: ['Nombre d\'incidents', 'Gravité', 'Mesures prises', 'Recommandations'],
    isActive: true
  },
  {
    id: 3,
    name: 'Modèle Réinsertion',
    type: 'reinsertion',
    description: 'Modèle pour les bilans de réinsertion',
    fields: ['Participants', 'Taux de réussite', 'Emplois trouvés', 'Suivi post-carcéral'],
    isActive: true
  }
];

export const ReportsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<number | null>(null);

  const tabs = [
    { id: 'reports', label: 'Rapports', icon: FileText },
    { id: 'templates', label: 'Modèles', icon: Settings },
    { id: 'scheduled', label: 'Planification', icon: Calendar },
    { id: 'analytics', label: 'Analytique', icon: BarChart3 },
    { id: 'archive', label: 'Archives', icon: FileSpreadsheet }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'statistique':
        return 'bg-blue-100 text-blue-800';
      case 'operationnel':
        return 'bg-green-100 text-green-800';
      case 'securite':
        return 'bg-red-100 text-red-800';
      case 'reinsertion':
        return 'bg-purple-100 text-purple-800';
      case 'financier':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Terminé':
        return 'bg-green-100 text-green-800';
      case 'En cours':
        return 'bg-blue-100 text-blue-800';
      case 'Programmé':
        return 'bg-yellow-100 text-yellow-800';
      case 'Brouillon':
        return 'bg-gray-100 text-gray-800';
      case 'Erreur':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF':
        return <FilePdf className="h-4 w-4 text-red-600" />;
      case 'Excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'CSV':
        return <FileSpreadsheet className="h-4 w-4 text-blue-600" />;
      case 'Word':
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Gestion des rapports</h3>
        <div className="flex space-x-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouveau rapport</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export groupé</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un rapport..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tous les types</option>
            <option value="statistique">Statistique</option>
            <option value="operationnel">Opérationnel</option>
            <option value="securite">Sécurité</option>
            <option value="reinsertion">Réinsertion</option>
            <option value="financier">Financier</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="Brouillon">Brouillon</option>
            <option value="Programmé">Programmé</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
            <option value="Erreur">Erreur</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-slate-800">{report.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(report.type)}`}>
                    {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Par {report.createdBy}</span>
                  <span>•</span>
                  <span>{report.createdDate}</span>
                  <span>•</span>
                  <span>{report.frequency}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getFormatIcon(report.format)}
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </div>
            </div>

            {report.lastGenerated && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Dernière génération:</span>
                  <span className="font-medium">{report.lastGenerated}</span>
                </div>
                {report.size && (
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Taille:</span>
                    <span className="font-medium">{report.size}</span>
                  </div>
                )}
                {report.nextGeneration && (
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Prochaine génération:</span>
                    <span className="font-medium text-blue-600">{report.nextGeneration}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">Destinataires:</p>
              <div className="flex flex-wrap gap-1">
                {report.recipients.map((recipient, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {recipient}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="p-2 text-blue-600 hover:text-blue-800" title="Voir">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800" title="Modifier">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-green-600 hover:text-green-800" title="Télécharger">
                  <Download className="h-4 w-4" />
                </button>
                <button className="p-2 text-purple-600 hover:text-purple-800" title="Envoyer">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Générer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Modèles de rapports</h3>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nouveau modèle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTemplates.map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {template.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">Champs inclus:</p>
              <div className="space-y-1">
                {template.fields.map((field, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-gray-700">{field}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                Modifier
              </button>
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Utiliser
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderScheduledTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Rapports planifiés</h3>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Planifier rapport</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rapport</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fréquence</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Prochaine exécution</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Destinataires</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.filter(r => r.nextGeneration).map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{report.title}</p>
                    <p className="text-xs text-gray-500">{report.category}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">{report.frequency}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{report.nextGeneration}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {report.recipients.slice(0, 2).map((recipient, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {recipient}
                      </span>
                    ))}
                    {report.recipients.length > 2 && (
                      <span className="text-xs text-gray-500">+{report.recipients.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button className="p-1 text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-800">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:text-red-800">
                      <Trash2 className="h-4 w-4" />
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

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Analytique des rapports</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rapports générés</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">247</p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Téléchargements</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">1,432</p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+8%</span>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Download className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rapports planifiés</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">18</p>
              <div className="flex items-center mt-2 text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Actifs</span>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Erreurs</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">3</p>
              <div className="flex items-center mt-2 text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">À corriger</span>
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Rapports les plus générés</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Population carcérale</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-sm font-medium">42</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Sécurité</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <span className="text-sm font-medium">35</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Réinsertion</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-sm font-medium">28</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Financier</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <span className="text-sm font-medium">18</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Formats préférés</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FilePdf className="h-5 w-5 text-red-600" />
                <span className="text-sm text-gray-700">PDF</span>
              </div>
              <span className="text-sm font-medium">65%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">Excel</span>
              </div>
              <span className="text-sm font-medium">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-700">Word</span>
              </div>
              <span className="text-sm font-medium">7%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-700">CSV</span>
              </div>
              <span className="text-sm font-medium">3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderArchiveTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Archives des rapports</h3>
        <div className="flex space-x-2">
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Recherche avancée</span>
          </button>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
            <Trash2 className="h-4 w-4" />
            <span>Nettoyer archives</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Archives des rapports</h4>
            <p className="text-gray-600">Historique complet des rapports générés et archivés</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reports':
        return renderReportsTab();
      case 'templates':
        return renderTemplatesTab();
      case 'scheduled':
        return renderScheduledTab();
      case 'analytics':
        return renderAnalyticsTab();
      case 'archive':
        return renderArchiveTab();
      default:
        return renderReportsTab();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des rapports</h2>
        <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-lg">
          <FileText className="h-5 w-5 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-800">Module Rapports</span>
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total rapports</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">247</p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">8</p>
              <div className="flex items-center mt-2 text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Génération</span>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Programmés</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">18</p>
              <div className="flex items-center mt-2 text-purple-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Automatiques</span>
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Téléchargements</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">1.2k</p>
              <div className="flex items-center mt-2 text-green-600">
                <Download className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Ce mois</span>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Download className="h-8 w-8 text-green-600" />
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