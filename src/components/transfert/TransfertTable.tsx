import React, { useState } from 'react';
import { TransfertTableRow } from '../../features/transferts/types/transfert';
import { Eye, Edit, LogOut, Calendar, ArrowRightLeft, AlertTriangle, Truck, Clock, MapPin, CheckCircle, Plus, Search } from 'lucide-react';
import { SortieTableRow } from '../../features/sorties/types/sortie';

// Les actions absentes (callback non fourni) ne sont pas affichées : la page les retire selon les
// permissions de l'utilisateur (GET auth/me/). Le backend vérifie de toute façon droits et périmètre.
interface TransfertTableProps {
  tranferts: TransfertTableRow[];
  sorties: SortieTableRow[];
  onViewDetail: (id: number) => void;
  onEdit: (transfert: TransfertTableRow) => void;
  onAddTransfert?: () => void;
  onEditTransfert?: (transfert: TransfertTableRow) => void;
  canEditTransfert?: (transfert: TransfertTableRow) => boolean;
  onDecideTransfert?: (transfert: TransfertTableRow, action: 'approve' | 'reject') => void;
  canDecideTransfert?: (transfert: TransfertTableRow) => boolean;
  decidingTransfertId?: number | null;
  // Arrivée d'un transfert validé, signalée par la prison de destination (AG, SP ou AP, D21)
  onCompleteTransfert?: (transfert: TransfertTableRow) => void;
  canCompleteTransfert?: (transfert: TransfertTableRow) => boolean;
  onAddSortie?: () => void;
  onEditSortie?: (sortie: SortieTableRow) => void;
  onDecideSortie?: (sortie: SortieTableRow, action: 'approve' | 'reject') => void;
  canDecideSortie?: (sortie: SortieTableRow) => boolean;
  loading?: boolean;
}

export const TransfertTable: React.FC<TransfertTableProps> = ({
  tranferts,
  sorties,
  onViewDetail,
  onAddTransfert,
  onEditTransfert,
  canEditTransfert = () => true,
  onDecideTransfert,
  canDecideTransfert = () => false,
  decidingTransfertId = null,
  onCompleteTransfert,
  canCompleteTransfert = () => false,
  onAddSortie,
  onEditSortie,
  onDecideSortie,
  canDecideSortie = () => true,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState('transfers');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortieSearchTerm, setSortieSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredTransferts = tranferts.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.detenu_name?.toLowerCase().includes(q) ||
      t.motif?.toLowerCase().includes(q) ||
      t.type_transfert?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q)
    );
  });

  const filteredSorties = sorties.filter((s) => {
    const q = sortieSearchTerm.toLowerCase();
    return (
      s.detenu_name?.toLowerCase().includes(q) ||
      s.destination?.toLowerCase().includes(q) ||
      s.authorized_by?.toLowerCase().includes(q) ||
      s.status?.toLowerCase().includes(q)
    );
  });

  const tabs = [
    { id: 'transfers', label: 'Transferts', icon: ArrowRightLeft },
    { id: 'releases', label: 'Sorties', icon: LogOut },
    // { id: 'planning', label: 'Planning', icon: Calendar },
    // { id: 'transport', label: 'Transport', icon: Truck },
  ];

  const getCountTransfertsToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tranferts.filter(t => {
      const d = new Date(t.transfer_date);
      return d >= today && d < tomorrow;
    }).length;
  };

  // Transferts que l'utilisateur peut valider (en attente, de sa prison, SP ou AP)
  const isAwaitingMyDecision = (t: TransfertTableRow) =>
    !!onDecideTransfert && t.status === 'PENDING' && canDecideTransfert(t);
  const awaitingMyDecision = tranferts.filter(isAwaitingMyDecision);
  // Transferts validés à destination de la prison de l'utilisateur : arrivée à enregistrer
  const isAwaitingMyReception = (t: TransfertTableRow) =>
    !!onCompleteTransfert && t.status === 'APPROVED' && canCompleteTransfert(t);
  const awaitingMyReception = tranferts.filter(isAwaitingMyReception);
  // Ordre d'affichage : à valider, puis à réceptionner, puis le reste
  const actionRank = (t: TransfertTableRow) => (isAwaitingMyDecision(t) ? 2 : isAwaitingMyReception(t) ? 1 : 0);

  const statistics = {
    total: tranferts.filter(t => t.status === 'PENDING').length,
    transfertsToDay: getCountTransfertsToday(),
    sorties: sorties.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
      case 'Terminée': return 'bg-gray-100 text-gray-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'URGENT': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTransfersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Gestion des transferts</h3>
        {onAddTransfert && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            onClick={onAddTransfert}
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau transfert</span>
          </button>
        )}
      </div>

      {awaitingMyDecision.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <p className="text-amber-900 font-medium">
            {awaitingMyDecision.length === 1
              ? '1 transfert attend votre validation'
              : `${awaitingMyDecision.length} transferts attendent votre validation`}
            <span className="font-normal text-amber-800"> : ils sont en tête de liste.</span>
          </p>
        </div>
      )}

      {awaitingMyReception.length > 0 && (
        <div className="bg-sky-50 border-2 border-sky-400 rounded-lg px-4 py-3 flex items-center gap-3">
          <Truck className="h-6 w-6 text-sky-600 flex-shrink-0" />
          <p className="text-sky-900 font-medium">
            {awaitingMyReception.length === 1
              ? '1 détenu transféré est attendu dans votre établissement'
              : `${awaitingMyReception.length} détenus transférés sont attendus dans votre établissement`}
            <span className="font-normal text-sky-800"> : réceptionnez-les à leur arrivée (en tête de liste).</span>
          </p>
        </div>
      )}

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
        {/* <div className="flex gap-2">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="En cours">En cours</option>
            <option value="COMPLETED">Terminé</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">Toutes priorités</option>
            <option value="CRITICAL">Critique</option>
            <option value="URGENT">Urgente</option>
            <option value="NORMAL">Normale</option>
          </select>
        </div> */}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full min-w-full">
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
            {filteredTransferts.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">Aucun transfert trouvé</td></tr>
            ) : [...filteredTransferts]
                // Ceux qui attendent une action de l'utilisateur d'abord (validation, puis réception)
                .sort((a, b) => actionRank(b) - actionRank(a))
                .map((transfert) => (
              <tr
                key={`${transfert.id}-${transfert.detenu_name}`}
                className={isAwaitingMyDecision(transfert)
                  ? 'bg-amber-50 hover:bg-amber-100'
                  : isAwaitingMyReception(transfert) ? 'bg-sky-50 hover:bg-sky-100' : 'hover:bg-gray-50'}
              >
                <td className="px-4 py-3">{transfert.detenu_name}</td>
                <td className="px-4 py-3">{transfert.type_transfert}</td>
                <td className="px-4 py-3">{transfert.motif}</td>
                <td className="px-4 py-3">{new Date(transfert.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(transfert.priorite)}`}>{transfert.priorite}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transfert.status)}`}>{transfert.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    {isAwaitingMyDecision(transfert) && onDecideTransfert && (
                      <>
                        <button
                          onClick={() => onDecideTransfert(transfert, 'approve')}
                          disabled={decidingTransfertId === transfert.id}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Valider
                        </button>
                        <button
                          onClick={() => onDecideTransfert(transfert, 'reject')}
                          disabled={decidingTransfertId === transfert.id}
                          className="px-3 py-1.5 border border-red-400 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    {isAwaitingMyReception(transfert) && onCompleteTransfert && (
                      <button
                        onClick={() => onCompleteTransfert(transfert)}
                        disabled={decidingTransfertId === transfert.id}
                        className="px-3 py-1.5 bg-sky-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-sky-700 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                      >
                        <Truck className="h-4 w-4" />
                        Réceptionner le détenu
                      </button>
                    )}
                    <button
                      onClick={() => onViewDetail(transfert.id)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Voir le détail"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {onEditTransfert && canEditTransfert(transfert) && (
                      <button
                        onClick={() => onEditTransfert(transfert)}
                        className="p-1 text-gray-500 hover:text-gray-800"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
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
        {onAddSortie && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            onClick={onAddSortie}
          >
            <Plus className="h-4 w-4" />
            <span>Programmer une sortie</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, destination, autorisé par, statut..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={sortieSearchTerm}
          onChange={(e) => setSortieSearchTerm(e.target.value)}
        />
      </div>

      {filteredSorties.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-6">Aucune sortie trouvée</p>
      )}

      <div className="space-y-4">
        {filteredSorties.map((release) => (
          <div key={release.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <LogOut className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{release.detenu_name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(release.status)}`}>
                      {release.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">Date prévue</p>
                <p className="text-lg font-bold text-blue-600">{new Date(release.due_return_date).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Destination :</h5>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">{release.destination}</span>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Autorisée par :</h5>
                <p className="text-sm text-gray-600">{release.authorized_by}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Date de retour prévue : {new Date(release.due_return_date).toLocaleDateString('fr-FR')}
                </h5>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Date de retour réelle : {release.actual_return_date ? new Date(release.actual_return_date).toLocaleDateString('fr-FR') : 'Non retourné'}
                </h5>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Notes :</h5>
                <p className="text-sm text-gray-600">{release.notes}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                {onEditSortie && (
                  <button
                    onClick={() => onEditSortie(release)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Modifier</span>
                  </button>
                )}
                {onDecideSortie && release.status === 'PENDING' && canDecideSortie(release) && (
                  <>
                    <button
                      onClick={() => onDecideSortie(release, 'approve')}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Valider</span>
                    </button>
                    <button
                      onClick={() => onDecideSortie(release, 'reject')}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Refuser
                    </button>
                  </>
                )}
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transfers': return renderTransfersTab();
      case 'releases': return renderReleasesTab();
      case 'planning': return renderPlanningTab();
      case 'transport': return renderTransportTab();
      default: return renderTransfersTab();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transferts en attente</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{statistics.total}</p>
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
              <p className="text-3xl font-bold text-slate-800 mt-2">{statistics.sorties}</p>
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
              <p className="text-3xl font-bold text-slate-800 mt-2">{statistics.transfertsToDay}</p>
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

      <br />

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
