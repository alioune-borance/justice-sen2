
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, MapPin, Scale, Clock, Truck } from 'lucide-react';
import { useGetTransfertById, useGetTransferts } from '../../features/transferts/api/useGetTransfert';
import { useGetPrisons } from '../../features/prisons/api/useGetPrison';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { Prison } from '../../features/prisons/types/prison';
import { Detenu } from '../../features/detenus/types/detenu';

export const TransfertDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const transfertId = parseInt(id || '0');


  //const { data: transfert, isLoading, isError } = useGetTransfertById(transfertId);
  const { data: transferts = [] } = useGetTransferts(); 

  console.log(transferts)
  const transfert = transferts.find(t => t.id === transfertId);
  console.log(transfert)
  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons();
  const { data: detenusList = [], isLoading: isLoadingDetenus } = useGetDetenus();

  const getDetenuName = (detenuId: number): string => {
    const detenu = detenusList.find((d: Detenu) => d.id === detenuId);
    return detenu ? `${detenu.first_name} ${detenu.last_name}` : "...";
  }

  const getTransfertFrom = (from: number): string => {
    const f = prisons.find((p: Prison) => p.id === Number(from));
    return `${f?.name || "..."}`;
  }

  const getTransfertTo = (to: number): string => {
    const f = prisons.find((p: Prison) => p.id === Number(to));
    return `${f?.name || "..."}`;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'En cours':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
      case 'Terminée':
        return 'bg-gray-100 text-gray-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'URGENT':
        return 'bg-orange-100 text-orange-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/transfers')}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Détail du transfert</h1>
        <div className="w-24"></div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header with transfer info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="h-10 w-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Transfert - {getDetenuName(transfert?.prisoner || 0)}
                  </h2>
                  <p className="text-gray-600">N° de transfert: {transfert?.id}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(transfert!.status)}`}>
                    {transfert!.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(transfert!.priority)}`}>
                    {transfert!.priority}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date prévue</p>
                    <p className="font-medium">
                      {new Date(transfert!.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Heure</p>
                    <p className="font-medium">
                      {new Date(transfert!.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Détenu concerné</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nom complet</span>
                      <span className="font-medium">{getDetenuName(transfert?.prisoner || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">N° d'écrou</span>
                      <span className="font-medium">145</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Niveau de sécurité</span>
                      <span className="font-medium">Normal</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Établissements</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 block mb-1">Établissement de départ</span>
                      <span className="font-medium">{getTransfertFrom(transfert?.from_prison || 0)}</span>
                    </div>
                    <div className="flex items-center justify-center py-2">
                      <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Établissement d'arrivée</span>
                      <span className="font-medium">{getTransfertTo(transfert?.to_prison || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Détails du transfert</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type</span>
                      <span className="font-medium"></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Motif</span>
                      <span className="font-medium"></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aptitude médicale</span>
                      {/* <span className={`font-medium ${transfert!.medical_clearance ? 'text-green-600' : 'text-red-600'}`}>
                        {transfert!.medical_clearance ? '✓ Validée' : '✗ Non validée'}
                      </span> */}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Logistique</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Escorte</span>
                      <span className="font-medium"></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type de véhicule</span>
                      <span className="font-medium"></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">N° véhicule</span>
                      <span className="font-medium"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Authorization Section */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Autorisation</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Approuvé par</span>
                  <span className="font-medium">{transfert!.authorized_by}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes et observations</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">{transfert!.notes}</p>
              </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Imprimer l'ordre de transfert
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler le transfert
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Modifier le transfert
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}