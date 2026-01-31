import React, { useState } from 'react';
import { Transfert, TransfertTableRow } from '../../features/transferts/types/transfert';
import { Eye, Edit, MoreVertical, LogOut, Calendar, ArrowRightLeft, AlertTriangle, Truck, Clock, MapPin, Phone, CheckCircle, Plus, Search } from 'lucide-react';
import { Release } from '../../entities/Release';
import { Sortie, SortieTableRow } from '../../features/sorties/types/sortie';
import { TransfertFormModal } from './TransfertFormModal';
import { SortieFormModal } from './SortieFormModal';
import { useCreateTransfert, useUpdateTransfert } from '../../features/transferts/api/useGetTransfert';
import { Prison } from '../../features/prisons/types/prison';
import { Detenu } from '../../features/detenus/types/detenu';
import { useGetPrisons } from '../../features/prisons/api/useGetPrison';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { useCreateSortie, useUpdateSortie } from '../../features/sorties/api/useGetSortie';

// mock
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

interface TransfertTableProps {
  tranferts: TransfertTableRow[];
  sorties: SortieTableRow[];
  onViewDetail: (id: number) => void;
  onEdit: (transfert: TransfertTableRow) => void;
  loading?: boolean;
}


export const TransfertTable: React.FC<TransfertTableProps> = ({
  tranferts,
  sorties,
  onViewDetail,
  onEdit,
  loading = false,
}) => {

  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons();
  const { data: detenusList = [], isLoading: isLoadingDetenus } = useGetDetenus();
  
  const [activeTab, setActiveTab] = useState('transfers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const tabs = [
    { id: 'transfers', label: 'Transferts', icon: ArrowRightLeft },
    { id: 'releases', label: 'Sorties', icon: LogOut },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'transport', label: 'Transport', icon: Truck },
  ];

  const createMutation = useCreateTransfert();
  const updateMutation = useUpdateTransfert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfert, setSelectedTransfert] = useState<Transfert | null>(null);

  const createMutationSortie = useCreateSortie();
  const updateMutationSortie = useUpdateSortie();

  const [isModalOpenSortie, setIsModalOpenSortie] = useState(false);
  const [selectedSortie, setSelectedSortie] = useState<Sortie | null>(null);
  

  const [newTransfert, setNewTransfert] = useState({
    detenu_name: '',
    type_transfert: '',
    motif: '',
    date_prevue: '',
    priorite: '',
    status: '',
    actions: '',
    from_prison: '',
    to_prison: '',
    transfer_date: ''
  });

  const [newSortie, setNewSortie] = useState({
    detenu_name: '',
    date_prevue: '',
    destination: '',
    due_return_date: '',
    is_returned: '',
    actual_return_date: '',
    date: '',
    purpose: '',
    authorized_by: '',
    notes: '',
    status: '',
  })




  const getCountTransfertsToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(tranferts)
    
    return tranferts.filter(transfsert => {
      const transferDate = new Date(transfsert.transfer_date);
      return transferDate >= today && transferDate < tomorrow;
    }).length;
  }

  const statistics = {
    total: tranferts.length,
    transfertsToDay : getCountTransfertsToday(),
    sorties: sorties.length,
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

  const handleOpenAddModal = () => {
    setSelectedTransfert(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransfert(null);
    // Reset newDetenu form when closing modal
    setNewTransfert({
    detenu_name: '',
    type_transfert: '',
    motif: '',
    date_prevue: '',
    priorite: '',
    status: '',
    actions: '',
    from_prison: '',
    to_prison: '',
    transfer_date: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      console.log(formData.get('date'))
      // Extract data from form
      const payload = {
        prisoner: parseInt(formData.get('prisoner') as string),
        transfer_date: new Date(formData.get('transfert_date') as string).toISOString(),
        from_prison: parseInt(formData.get('from_prison') as string),
        to_prison: parseInt(formData.get('to_prison') as string),
        //transfert_date: new Date(formData.get('transfert_date') as string).toISOString(),
        purpose: formData.get('purpose') as string,
        authorized_by: formData.get('authorized_by') as string,
        notes: formData.get('notes') as string,
        priority: 'NORMAL',
        status: 'PENDING',
      };

      console.log(payload)
  
      try {
        if (selectedTransfert) {
          // EDITION MODE
          await updateMutation.mutateAsync({ ...payload, id: selectedTransfert.id });
          console.log('Modifié !');
        } else {
          // ADDITION MODE
          await createMutation.mutateAsync(payload);
          console.log('Créé !');
        }
        handleCloseModal();
      } catch (error) {
        console.error('Submission error:', error);
      }
    };

    const handleSubmitSortie = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      console.log(formData.get('date'))
      // Extract data from form
      const payload = {
        prisoner: parseInt(formData.get('prisoner') as string),
        due_return_date: new Date(formData.get('due_return_date') as string).toISOString(),
        destination: formData.get('destination') as string,
        is_returned: false,
        actual_return_date: new Date(formData.get('due_return_date') as string).toISOString(),
        purpose: formData.get('purpose') as string,
        authorized_by: formData.get('authorized_by') as string,
        notes: formData.get('notes') as string,
        status: 'PENDING',
        date: new Date().toISOString()
      };

      console.log(payload)
  
      try {
        if (selectedSortie) {
          // EDITION MODE
          await updateMutationSortie.mutateAsync({ ...payload, id: selectedSortie.id });
          console.log('Modifié !');
        } else {
          // ADDITION MODE
          await createMutationSortie.mutateAsync(payload);
          console.log('Créé !');
        }
        handleCloseModal();
      } catch (error) {
        console.error('Submission error:', error);
      }
    };

    const handleOpenAddModalSortie = () => {
      setSelectedSortie(null);
      setIsModalOpenSortie(true);
    };

    const handleCloseModalSortie = () => {
      setIsModalOpenSortie(false);
      setSelectedSortie(null);
      // Reset newDetenu form when closing modal
      setNewSortie({
      detenu_name: '',
      date_prevue: '',
      destination: '',
      due_return_date: '',
      is_returned: '',
      actual_return_date: '',
      date: '',
      purpose: '',
      authorized_by: '',
      notes: '',
      status: '',
      });
    };

  const renderTransfersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Gestion des transferts</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        onClick={handleOpenAddModal}>
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
          {tranferts.map((transfert) => (
            <tr key={`${transfert.id}-${transfert.detenu_name}`} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                {transfert.detenu_name}
              </td>
              <td className="px-4 py-3">
                {transfert.type_transfert}
              </td>
              <td className="px-4 py-3">
                { transfert.motif }
              </td>
              <td className="px-4 py-3">
                {new Date(transfert.transfer_date).toLocaleDateString('fr-FR')}
              </td>
              <td className={`px-4 py-3`}>
                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(transfert.priorite)}`}>{ transfert.priorite }</span>
              </td>
              <td className={`px-4 py-3`}>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transfert.status)}`}>{ transfert.status }</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewDetail(transfert.id)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                    </button>
                </div>
               </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <TransfertFormModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              title={selectedTransfert ? "Modifier le transfert" : "Ajouter un transfert"}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Établissement de départ</label>
                    <select 
                      name="from_prison" 
                      defaultValue={selectedTransfert?.from_prison || (prisons.length > 0 ? prisons[0].id : 1)}
                      disabled={isLoadingPrisons}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">Sélectionner un établissement</option>
                      {isLoadingPrisons ? (
                        <option value="" disabled>Chargement des prisons...</option>
                      ) : (
                        prisons.map((prison: Prison) => (
                          <option key={prison.id} value={prison.id}>
                            {prison.name} {prison.location ? `- ${prison.location}` : ''}
                          </option>
                        ))
                      )}
                    </select>
                    {isLoadingPrisons && (
                      <p className="text-xs text-gray-500 mt-1">Chargement des prisons...</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Établissement d'arrivée</label>
                    <select 
                      name="to_prison" 
                      defaultValue={selectedTransfert?.to_prison || (prisons.length > 0 ? prisons[0].id : 1)}
                      disabled={isLoadingPrisons}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">Sélectionner un établissement</option>
                      {isLoadingPrisons ? (
                        <option value="" disabled>Chargement des prisons...</option>
                      ) : (
                        prisons.map((prison: Prison) => (
                          <option key={prison.id} value={prison.id}>
                            {prison.name} {prison.location ? `- ${prison.location}` : ''}
                          </option>
                        ))
                      )}
                    </select>
                    {isLoadingPrisons && (
                      <p className="text-xs text-gray-500 mt-1">Chargement des prisons...</p>
                    )}
                  </div>
                </div>
      
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prisonnier</label>
                  <select 
                      name="prisoner" 
                      defaultValue={selectedTransfert?.prisoner || (detenusList.length > 0 ? detenusList[0].id : 1)}
                      disabled={isLoadingDetenus}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">Sélectionner un détenu</option>
                      {isLoadingDetenus ? (
                        <option value="" disabled>Chargement des détenus...</option>
                      ) : (
                        detenusList.map((detenu: Detenu) => (
                          <option key={detenu.id} value={detenu.id}>
                            {detenu.first_name} {detenu.last_name}
                          </option>
                        ))
                      )}
                    </select>
                    {isLoadingDetenus && (
                      <p className="text-xs text-gray-500 mt-1">Chargement des prisons...</p>
                    )}
                </div>
      
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de transfert</label>
                    <input 
                      type="date" 
                      name="transfert_date"
                      defaultValue={selectedTransfert?.transfer_date || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <input 
                      type="text" 
                      name="purpose"
                      defaultValue={selectedTransfert?.purpose || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
      
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Autorisée par *</label>
                  <input 
                      type="text" 
                      name="authorized_by"
                      defaultValue={selectedTransfert?.authorized_by || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes *</label>
                  <input 
                      type="text" 
                      name="notes"
                      defaultValue={selectedTransfert?.authorized_by || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité *</label>
                  <input 
                      type="text" 
                      name="priority"
                      defaultValue={selectedTransfert?.priority || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                  <input 
                      type="text" 
                      name="status"
                      defaultValue={selectedTransfert?.status || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>
              </div>
            </TransfertFormModal>
    </div>

    
  );

  const renderReleasesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Gestion des sorties</h3>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        onClick={handleOpenAddModalSortie}>
          <Plus className="h-4 w-4" />
          <span>Programmer une sortie</span>
        </button>
      </div>

      <div className="space-y-4">
        {sorties.map((release) => (
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
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">{release.destination}</span>
                    </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Autorisée par :</h5>
                <p className="text-sm text-gray-600">{release.authorized_by}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Date de retour prévue : {new Date(release.due_return_date).toLocaleDateString('fr-FR')}</h5>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Date de retour réelle : {release.actual_return_date ? new Date(release.actual_return_date).toLocaleDateString('fr-FR') : 'Non retourné'}</h5>
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

      <SortieFormModal
              isOpen={isModalOpenSortie}
              onClose={handleCloseModalSortie}
              title={selectedTransfert ? "Modifier le transfert" : "Ajouter un transfert"}
              onSubmit={handleSubmitSortie}
              isLoading={createMutation.isPending || updateMutation.isPending }
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prisonnier</label>
                  <select 
                      name="prisoner" 
                      defaultValue={selectedSortie?.prisoner || (detenusList.length > 0 ? detenusList[0].id : 1)}
                      disabled={isLoadingDetenus}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">Sélectionner un détenu</option>
                      {isLoadingDetenus ? (
                        <option value="" disabled>Chargement des détenus...</option>
                      ) : (
                        detenusList.map((detenu: Detenu) => (
                          <option key={detenu.id} value={detenu.id}>
                            {detenu.first_name} {detenu.last_name}
                          </option>
                        ))
                      )}
                    </select>
                    {isLoadingDetenus && (
                      <p className="text-xs text-gray-500 mt-1">Chargement des detenus...</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour prévue</label>
                    <input 
                      type="date" 
                      name="transfert_date"
                      defaultValue={selectedSortie?.due_return_date || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <input 
                      type="text" 
                      name="destination"
                      defaultValue={selectedSortie?.destination || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <input 
                      type="text" 
                      name="purpose"
                      defaultValue={selectedSortie?.purpose || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sortie autorisée par</label>
                    <input 
                      type="text" 
                      name="authorized_by"
                      defaultValue={selectedSortie?.authorized_by || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input 
                      type="text" 
                      name="notes"
                      defaultValue={selectedSortie?.notes || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>
              </div>
            </SortieFormModal>
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
      case 'transfers':
        return renderTransfersTab();
      case 'releases':
        return renderReleasesTab();
      case 'planning':
        return renderPlanningTab();
      case 'transport':
        return renderTransportTab();
      default:
        return renderTransfersTab();
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

  if (tranferts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aucune transfert trouvée</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des sorties et transferts</h2>
        <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-lg">
          <ArrowRightLeft className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-mediusm text-orange-800">Module Mouvements</span>
        </div>
      </div> */}

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
              <p className="text-3xl font-bold text-slate-800 mt-2">{ statistics.sorties }</p>
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
      </div><br></br>

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
}