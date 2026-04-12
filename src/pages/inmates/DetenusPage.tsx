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
  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons(); // Use the correct data property
  
  // UNIFIED STATE

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prisonFilter, setPrisonFilter] = useState('all');
  

  const handleViewDetail = (id: number) => {
    navigate(`/detenus/${id}`);
  };

  const openFormDetenu = () => {
    navigate('/detenus/new');
  }

  const handleOpenEditModal = (id: number) => {
    navigate(`/detenus/update/${id}`)
  }


  // Helper functions updated to use real prison data
  const getPrisonName = (prisonId: number): string => {
    const prison = prisons.find((p: Prison) => p.id === prisonId);
    return prison?.name || `Prison #${prisonId}`;
  };

  const getEcrouNumber = (id: number): string => {
    return `EC-${String(id).padStart(3, '0')}`;
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
    const now = new Date()
  // Libérations ce mois : status Libéré + release_date dans le mois courant
  const liberationsThisMonth = detenus.filter((d: Detenu) => {
    if (d.status !== 'Libéré') return false;
    const r = new Date(d.release_date);
    return r.getFullYear() === now.getFullYear() && r.getMonth() === now.getMonth();
  }).length;
    return {
      total,
      convicted,
      pretrial: total - convicted,
      convictedPercentage: total > 0 ? Math.round((convicted / total) * 100) : 0,
      liberationsThisMonth
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
          onClick={openFormDetenu}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={createMutation.isPending || isLoadingPrisons}
        >
          {createMutation.isPending ? 'Création...' : 'Ajouter un nouveau détenu'}
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

    </div>
  );
};