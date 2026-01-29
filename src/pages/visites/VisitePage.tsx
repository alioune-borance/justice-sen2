// features/visites/pages/visites/VisitePage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { VisitTable } from '../../components/visite/VisitTable';
import { Visite, VisiteTableRow } from '../../features/visites/types/visite';
import { useNavigate } from 'react-router-dom';
import { useCreateVisite, useCreateVisitor, useGetVisites, useGetVisitors, useUpdateVisite } from '../../features/visites/api/useGetVisite';
import { VisiteFormModal } from '../../components/visite/VisiteFormModal';
import { Visitor } from '../../features/visites/types/visitor';

export const VisiteListPage: React.FC = () => {
   const navigate = useNavigate();
  
  // API Hooks
  const { data: visites = [], isLoading, isError, refetch } = useGetVisites();
  const { data: visitorList = [], isLoading: isLoadingVisitors } = useGetVisitors();
  
  const createMutation = useCreateVisite();
  const updateMutation = useUpdateVisite();
  //sconst { data: detenusList = [], isLoading: isLoadingDetenus } = useGetDetenus();
  const createVisitor = useCreateVisitor();

  const [isModsalOpen, setIsModalOpen] = useState(false);
  const [selectedVisite, setSelectedVisite] = useState<Visite | null>(null);
  
  const [newVisite, setNewVisite] = useState({
        detenu_name: '',
        visitor_name: null,
        visit_date: '',
        purpose: '',
        start_time: '',
        end_time: '',
        status: '',
    });

  const handleOpenAddModal = () => {
    setSelectedVisite(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVisite(null);
    // Reset newDetenu form when closing modal
    setNewVisite({
        detenu_name: '',
        visitor_name: null,
        visit_date: '',
        purpose: '',
        start_time: '',
        end_time: '',
        status: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const payload_visitor = {
            name: formData.get('visitor_name') as string,
            email: formData.get('visitor_email') as string,
            phone_number: formData.get('visitor_phone_number') as string,
            national_id: formData.get('visitor_national_id') as string
          }

          try {
            const createdVisitor = await createVisitor.mutateAsync(payload_visitor);
            
            // Extract data from form
            const payload = {
              //detenu: parseInt(formData.get('detenu') as string),
              visitor_id: createdVisitor.id,
              visit_date: new Date(formData.get('visit_date') as string).toISOString(),
              purpose: formData.get('purpose') as string,
              start_time: new Date(formData.get('start_time') as string).toISOString(),
              end_time: new Date(formData.get('end_time') as string).toISOString(),
              status: 'Scheduled',
            };
      
        
            try {
              if (selectedVisite) {
                // EDITION MODE
                await updateMutation.mutateAsync({ ...payload, id: selectedVisite.id });
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
            // Utilisez createdVisitor pour la suite
            // Par exemple: createdVisitor.id, createdVisitor.name, etc.
            
          } catch (error) {
            console.error('Erreur:', error);
          }

        
      };

  const getVisitor = (visitor_id: number | undefined) => {
      return visitorList.find((v: Visitor) => v.id === visitor_id);
  }

  const getVisitorName = (visitor_id: number) => {
      const visitor = visitorList.find((v: Visitor) => v.id === visitor_id);
      return visitor ? `${visitor.name}` : "...";
  }  

  const handleViewDetail = (id: number) => {
    navigate(`/visits/${id}`);
  };

  const tableRows: VisiteTableRow[] = useMemo(() => {
    return visites.map((visite) => ({
      ...visite,
      detenu_name: `Ali BA`, 
      visitor_name: getVisitorName(visite.visitor_id), 
      visit_date: visite.visit_date,
      purpose: visite.purpose,
      //start_time: new Date(visite.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      //end_time: new Date(visite.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: visite.status
    } as VisiteTableRow));
    }, [visites]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des visites</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        onClick={handleOpenAddModal}>
          Nouvelle visite
        </button>
      </div>

      <div className='bg-white rounded-lg shadow-md border border-gray-200 p-6'>
        <VisitTable
          visites={tableRows}
          onViewDetail={handleViewDetail}
          onEdit={() => {}}
          loading={isLoading}
        />
      </div>

      <VisiteFormModal
                    isOpen={isModsalOpen}
                    onClose={handleCloseModal}
                    title={selectedVisite ? "Modifier la visite" : "Ajouter une visite"}
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending }
                  >
                    <div className="space-y-4">
                                    {/* <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Prisonnier</label>
                                      <select 
                                          name="prisoner" 
                                          defaultValue={selectedVisite?.detenu || (detenusList.length > 0 ? detenusList[0].id : 1)}
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
                                    </div> */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du visiteur</label>
                                        <input 
                                          type="text" 
                                          name="visitor_name"
                                          defaultValue={getVisitor(selectedVisite?.visitor_id)?.name || ''}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email du visiteur</label>
                                        <input 
                                          type="text" 
                                          name="visitor_email"
                                          defaultValue={getVisitor(selectedVisite?.visitor_id)?.email || ''}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Num. Téléphone du visiteur</label>
                                        <input 
                                          type="text" 
                                          name="visitor_phone_number"
                                          defaultValue={getVisitor(selectedVisite?.visitor_id)?.phone_number || ''}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CNI du visiteur</label>
                                        <input 
                                          type="text" 
                                          name="visitor_national_id"
                                          defaultValue={getVisitor(selectedVisite?.visitor_id)?.national_id || ''}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          required
                                        />
                                    </div>
                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                                        <input 
                                          type="text" 
                                          name="purpose"
                                          defaultValue={selectedVisite?.purpose || ''}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          required
                                        />
                                    </div>    
                                  </div>
              </VisiteFormModal>
    </div>
    );
};