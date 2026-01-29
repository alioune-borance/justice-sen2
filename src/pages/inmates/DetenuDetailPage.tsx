// features/detenus/pages/InmateDetailPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, MapPin, Scale, Clock, FolderOpen, Eye, Download, Trash2, Upload, File } from 'lucide-react';
import { useGetDetenuById } from '../../features/detenus/api/useGetDetenu';
const documents = [
    {
      id: 1,
      name: 'Casier judiciaire complet',
      type: 'Casier judiciaire',
      date: '2021-08-12',
      size: '2.3 MB',
      format: 'PDF'
    },
    {
      id: 2,
      name: 'Jugement tribunal correctionnel',
      type: 'Décision de justice',
      date: '2021-07-28',
      size: '1.8 MB',
      format: 'PDF'
    },
    {
      id: 3,
      name: 'Rapport médical d\'entrée',
      type: 'Médical',
      date: '2021-08-12',
      size: '0.5 MB',
      format: 'PDF'
    },
    {
      id: 4,
      name: 'Certificat de bonne conduite',
      type: 'Comportement',
      date: '2024-01-15',
      size: '0.3 MB',
      format: 'PDF'
    },
    {
      id: 5,
      name: 'Attestation formation menuiserie',
      type: 'Formation',
      date: '2023-12-20',
      size: '0.4 MB',
      format: 'PDF'
    },
    {
      id: 6,
      name: 'Pièce d\'identité',
      type: 'Identité',
      date: '2021-08-12',
      size: '0.2 MB',
      format: 'JPG'
    }
  ];

export const InmateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detenuId = parseInt(id || '0');

  const { data: detenu, isLoading, isError } = useGetDetenuById(detenuId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  if (isError || !detenu) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium mb-2">
          Détenu non trouvé
        </h3>
        <p className="text-red-600 text-sm mb-4">
          Impossible de charger les informations de ce détenu.
        </p>
        <button
          onClick={() => navigate('/detenus')}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </button>
      </div>
    );
  }

  // Helper functions
  const getEcrouNumber = (id: number): string => {
    return `EC-${String(id).padStart(3, '0')}`;
  };

  const getPrisonName = (prisonId: number): string => {
    const prisons: Record<number, string> = {
      1: "Fresnes",
      2: "Marseille",
      3: "Lyon",
      4: "Bordeaux"
    };
    return prisons[prisonId] || `Prison #${prisonId}`;
  };

  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateSentenceDuration = (incarcerationDate: string, releaseDate: string): string => {
    const start = new Date(incarcerationDate);
    const end = new Date(releaseDate);
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `et ${months} mois` : ''}`;
  };

  const calculateTimeServedPercentage = (incarcerationDate: string, releaseDate: string): number => {
    const start = new Date(incarcerationDate);
    const end = new Date(releaseDate);
    const now = new Date();
    
    const totalTime = end.getTime() - start.getTime();
    const servedTime = now.getTime() - start.getTime();
    
    return Math.min(100, Math.max(0, (servedTime / totalTime) * 100));
  };

  const timeServedPercentage = calculateTimeServedPercentage(
    detenu.incarceration_date,
    detenu.release_date
  );

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'Casier judiciaire':
      case 'Décision de justice':
        return 'bg-red-100 text-red-800';
      case 'Médical':
        return 'bg-blue-100 text-blue-800';
      case 'Comportement':
        return 'bg-green-100 text-green-800';
      case 'Formation':
        return 'bg-purple-100 text-purple-800';
      case 'Identité':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/detenus')}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Fiche détenu</h1>
        <div className="w-24"></div>
      </div>

      {/* Main Card - MAKE SURE THIS FULL CARD IS RETURNED */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header with inmate info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {detenu.first_name} {detenu.last_name}
                  </h2>
                  <p className="text-gray-600">N° d'écrou: {getEcrouNumber(detenu.id)}</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  Condamné
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Âge</p>
                    <p className="font-medium">{calculateAge(detenu.date_of_birth)} ans</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Scale className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Peine</p>
                    <p className="font-medium">
                      {calculateSentenceDuration(detenu.incarceration_date, detenu.release_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Temps purgé</p>
                    <p className="font-medium">{Math.round(timeServedPercentage)}%</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Établissement</p>
                    <p className="font-medium">{getPrisonName(detenu.prison)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Informations détaillées</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Informations personnelles</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de naissance</span>
                      <span className="font-medium">
                        {new Date(detenu.date_of_birth).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lieu de naissance</span>
                      <span className="font-medium text-gray-400">Non renseigné</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nationalité</span>
                      <span className="font-medium text-gray-400">Non renseignée</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Situation pénale</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Infraction principale</span>
                      <span className="font-medium text-gray-400">Non renseignée</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut juridique</span>
                      <span className="font-medium">Condamné</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avocat</span>
                      <span className="font-medium text-gray-400">Non renseigné</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Détention</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date d'incarcération</span>
                      <span className="font-medium">
                        {new Date(detenu.incarceration_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de libération prévue</span>
                      <span className="font-medium">
                        {new Date(detenu.release_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Durée restante</span>
                      <span className="font-medium">
                        {calculateSentenceDuration(
                          new Date().toISOString().split('T')[0],
                          detenu.release_date
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Progression de la peine</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Temps purgé</span>
                      <span>{Math.round(timeServedPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${timeServedPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Incarcéré depuis le {new Date(detenu.incarceration_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Historique des visites
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Rapport médical
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Modifier la fiche
            </button>
          </div>
        </div>

        <div className="space-y-4">
            {/* Header avec bouton upload */}
            <div className="flex justify-between items-center">
              <h4 className="text-md font-semibold text-gray-800">Documents du dossier</h4>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Ajouter un document</span>
              </button>
            </div>

            {/* Filtres par type de document */}
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200">
                Tous
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200">
                Casier judiciaire
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200">
                Médical
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200">
                Formation
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200">
                Identité
              </button>
            </div>

            {/* Liste des documents */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Document</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date d'ajout</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Taille</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Format</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <File className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getDocumentTypeColor(doc.type)}`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(doc.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {doc.size}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {doc.format}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Voir le document"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total documents</p>
                    <p className="text-2xl font-bold text-slate-800">{documents.length}</p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taille totale</p>
                    <p className="text-2xl font-bold text-slate-800">5.5 MB</p>
                  </div>
                  <File className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Dernier ajout</p>
                    <p className="text-2xl font-bold text-slate-800">15/01/24</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};