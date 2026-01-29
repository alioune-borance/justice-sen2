import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, MapPin, Scale, Clock } from 'lucide-react';
import { useGetDetenuById } from "../../features/detenus/api/useGetDetenu";
import { useGetVisiteById, useGetVisitors } from '../../features/visites/api/useGetVisite';
import { Visitor } from '../../features/visites/types/visitor';

export const VisiteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const visiteId = parseInt(id || '0');

  const { data: visit, isLoading, isError } = useGetVisiteById(visiteId);
  const { data: visitorList = [], isLoading: isLoadingVisitors } = useGetVisitors();

  const getVisitorName = (visitor_id: number) => {
        const visitor = visitorList.find((v: Visitor) => v.id === visitor_id);
        return visitor ? `${visitor.name}` : "...";
    } 

    const getVisitor = (visitor_id: number | undefined) => {
          return visitorList.find((v: Visitor) => v.id === visitor_id);
      }

    const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Completed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDuration = () => {
    const start = new Date(visit!.start_time);
    const end = new Date(visit!.end_time);
    const diff = (end.getTime() - start.getTime()) / 1000 / 60;
    return `${diff} min`;
  };

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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/visits')}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Détail de la visite</h1>
        <div className="w-24"></div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header with visit info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Detenu Name - {getVisitorName(visit!.visitor_id)}
                  </h2>
                  <p className="text-gray-600">N° de visite: {visit!.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(visit!.status)}`}>
                  {visit!.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {new Date(visit!.visit_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Horaire</p>
                    <p className="font-medium">
                      {new Date(visit!.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Durée</p>
                    <p className="font-medium">{calculateDuration()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Lieu</p>
                    <p className="font-medium">Prison ...</p>
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Détenu</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nom complet</span>
                      <span className="font-medium">detenu name</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">N° d'écrou</span>
                      <span className="font-medium">1243</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Visiteur</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nom</span>
                      <span className="font-medium">{getVisitor(visit!.visitor_id)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Relation</span>
                      <span className="font-medium">Famille</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Téléphone</span>
                      <span className="font-medium">{getVisitor(visit!.visitor_id)?.phone_number}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Planification</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de visite</span>
                      <span className="font-medium">
                        {new Date(visit!.visit_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Heure de début</span>
                      <span className="font-medium">
                        {new Date(visit!.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Heure de fin</span>
                      <span className="font-medium">
                        {new Date(visit!.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Autorisation</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Autorisée par</span>
                      <span className="font-medium">{visit.authorized_by}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date d'autorisation</span>
                      <span className="font-medium">
                        {new Date(visit.authorization_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Raison</span>
                      <span className="font-medium">{visit.purpose}</span>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>

          {/* Notes Section */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes et observations</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">{visit!.purpose}</p>
              </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Imprimer le rapport
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler la visite
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Modifier la visite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}