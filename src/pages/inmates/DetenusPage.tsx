// features/detenus/pages/InmateListPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetDetenus, useCreateDetenu, useUpdateDetenu } from '../../features/detenus/api/useGetDetenu';
import { Detenu, InmateTableRow } from '../../features/detenus/types/detenu';
import { InmateTable } from '../../components/inmates/InmateTable';
import { InmateFilters } from '../../components/inmates/InmateFilters';
import { InmateStats } from '../../components/inmates/InmateStats';
import { InmateFormModal } from '../../components/inmates/InmateFormModal';
import { useGetPrisons } from '../../features/prisons/api/useGetPrison';
import { Prison } from '../../features/prisons/types/prison'; // Import Prison type

export const InmateListPage: React.FC = () => {
  const navigate = useNavigate();
  
  // API Hooks
  const { data: detenus = [], isLoading, isError, refetch } = useGetDetenus();
  const createMutation = useCreateDetenu();
  const updateMutation = useUpdateDetenu();
  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons(); // Use the correct data property
  
  // UNIFIED STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDetenu, setSelectedDetenu] = useState<Detenu | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prisonFilter, setPrisonFilter] = useState('all');
  
  const [newDetenu, setNewDetenu] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    incarceration_date: '',
    release_date: '',
    prison: prisons.length > 0 ? prisons[0].id : 1, // Default to first prison if available
  });

  // HANDLERS
  const handleOpenAddModal = () => {
    setSelectedDetenu(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (detenu: Detenu) => {
    setSelectedDetenu(detenu);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Extract data from form
    const payload = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      incarceration_date: formData.get('incarceration_date') as string,
      release_date: formData.get('release_date') as string,
      prison: parseInt(formData.get('prison') as string),
    };

    try {
      if (selectedDetenu) {
        // EDITION MODE
        await updateMutation.mutateAsync({ ...payload, id: selectedDetenu.id });
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

  const handleViewDetail = (id: number) => {
    navigate(`/detenus/${id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDetenu(null);
    // Reset newDetenu form when closing modal
    setNewDetenu({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      incarceration_date: '',
      release_date: '',
      prison: prisons.length > 0 ? prisons[0].id : 1,
    });
  };

  // Handle input changes for add form (if you want to keep controlled inputs)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDetenu(prev => ({
      ...prev,
      [name]: name === 'prison' ? parseInt(value) : value
    }));
  };

  // Helper functions updated to use real prison data
  const getPrisonName = (prisonId: number): string => {
    const prison = prisons.find((p: Prison) => p.id === prisonId);
    return prison?.name || `Prison #${prisonId}`;
  };

  const getEcrouNumber = (id: number): string => {
    return `EC-${String(id).padStart(3, '0')}`;
  };

  const getStatus = (): string => {
    return "Condamné";
  };

  const calculateSentence = (incarcerationDate: string, releaseDate: string): string => {
    const start = new Date(incarcerationDate);
    const end = new Date(releaseDate);
    const years = (end.getFullYear() - start.getFullYear());
    return `${years} an${years > 1 ? 's' : ''}`;
  };

  const calculateTimeServed = (incarcerationDate: string, releaseDate: string): string => {
    const start = new Date(incarcerationDate);
    const end = new Date(releaseDate);
    const now = new Date();
    
    const totalTime = end.getTime() - start.getTime();
    const servedTime = now.getTime() - start.getTime();
    
    const percentage = Math.min(100, Math.max(0, (servedTime / totalTime) * 100));
    return `${Math.round(percentage)}%`;
  };

  // Transform data for table
  const tableRows: InmateTableRow[] = useMemo(() => {
    return detenus.map((detenu: Detenu) => ({
      ...detenu,
      ecrouNumber: getEcrouNumber(detenu.id),
      prisonName: getPrisonName(detenu.prison),
      status: getStatus(),
      timeServed: calculateTimeServed(detenu.incarceration_date, detenu.release_date),
      sentence: calculateSentence(detenu.incarceration_date, detenu.release_date),
    } as InmateTableRow));
  }, [detenus, prisons]);

  // Filter data
  const filteredDetenus = useMemo(() => {
    return tableRows.filter((detenu: InmateTableRow) => {
      const fullName = `${detenu.first_name} ${detenu.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                           detenu.ecrouNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || detenu.status === statusFilter;
      const matchesPrison = prisonFilter === 'all' || detenu.prisonName === prisonFilter;
      return matchesSearch && matchesStatus && matchesPrison;
    });
  }, [tableRows, searchTerm, statusFilter, prisonFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const convicted = tableRows.filter(d => d.status === 'Condamné').length;
    const total = tableRows.length;
    return {
      total,
      convicted,
      pretrial: total - convicted,
      convictedPercentage: total > 0 ? Math.round((convicted / total) * 100) : 0
    };
  }, [tableRows]);

  // Prepare prison options for filter dropdown
  const prisonOptions = useMemo(() => {
    return prisons.map((prison: Prison) => ({
      value: prison.name,
      label: prison.name
    }));
  }, [prisons]);

  // Error handling
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-red-800 font-medium mb-2">
          Erreur lors du chargement des détenus
        </h3>
        <p className="text-red-600 text-sm mb-4">
          Impossible de charger les données. Veuillez réessayer.
        </p>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des détenus</h2>
        <button 
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={createMutation.isPending || isLoadingPrisons}
        >
          {createMutation.isPending ? 'Création...' : 'Nouveau détenu'}
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <InmateFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          prisonFilter={prisonFilter}
          onPrisonFilterChange={setPrisonFilter}
          prisonOptions={prisonOptions} // Pass real prison options
        />
        <InmateTable
          detenus={filteredDetenus}
          onViewDetail={handleViewDetail}
          onEdit={handleOpenEditModal}
          loading={isLoading}
        />
      </div>

      <InmateStats {...statistics} />

      {/* UNIFIED MODAL */}
      <InmateFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedDetenu ? "Modifier le détenu" : "Ajouter un détenu"}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending || isLoadingPrisons}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input 
                type="text" 
                name="first_name"
                key={selectedDetenu?.id || 'new'}
                defaultValue={selectedDetenu?.first_name || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input 
                type="text" 
                name="last_name"
                key={selectedDetenu?.id ? `last-${selectedDetenu.id}` : 'new-last'}
                defaultValue={selectedDetenu?.last_name || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
            <input 
              type="date" 
              name="date_of_birth"
              defaultValue={selectedDetenu?.date_of_birth || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'incarcération *</label>
              <input 
                type="date" 
                name="incarceration_date"
                defaultValue={selectedDetenu?.incarceration_date || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de libération prévue *</label>
              <input 
                type="date" 
                name="release_date"
                defaultValue={selectedDetenu?.release_date || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Établissement *</label>
            <select 
              name="prison" 
              defaultValue={selectedDetenu?.prison || (prisons.length > 0 ? prisons[0].id : 1)}
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
      </InmateFormModal>
    </div>
  );
};