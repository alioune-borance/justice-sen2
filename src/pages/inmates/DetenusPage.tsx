// features/detenus/pages/InmateListPage.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useGetDetenus, useCreateDetenu, useUpdateDetenu } from '../../features/detenus/api/useGetDetenu';
import { Detenu, InmateTableRow, isJudicialStage, isSentenced, matchesStatusFilter, prisonerStatusLabel, STATUS_FAMILY_FILTERS, PRISONER_STATUSES } from '../../features/detenus/types/detenu';
import { InmateTable } from '../../components/inmates/InmateTable';
import { InmateFilters } from '../../components/inmates/InmateFilters';
import { InmateStats } from '../../components/inmates/InmateStats';
import { InmateFormModal } from '../../components/inmates/InmateFormModal';
import { useGetPrisons } from '../../features/prisons/api/useGetPrison';
import { Prison } from '../../features/prisons/types/prison'; // Import Prison type
import { usePermissions } from '../../features/auth/hooks/usePermissions';
import { Can } from '../../features/auth/components/Can';
import { PendingDecisionEffects } from '../../features/decisions/components/PendingDecisionEffects';

export const InmateListPage: React.FC = () => {
  const navigate = useNavigate();
  const { can, isMyPrison } = usePermissions();

  // API Hooks
  const { data: detenus = [], isLoading, isError, refetch } = useGetDetenus();
  const createMutation = useCreateDetenu();
  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons(); // Use the correct data property
  
  // UNIFIED STATE
  const [showFilterModal, setShowFilterModal] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prisonFilter, setPrisonFilter] = useState('all');

  const selectFilter = (filter: string) => {
    setStatusFilter(filter);
    setShowFilterModal(false);
  };
  

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
      const matchesStatus = matchesStatusFilter(detenu.status, statusFilter);
      const matchesPrison = prisonFilter === 'all' || detenu.prisonName === prisonFilter;
      return matchesSearch && matchesStatus && matchesPrison;
    });
  }, [tableRows, searchTerm, statusFilter, prisonFilter]);

  
  // Calculate statistics
  const statistics = useMemo(() => {
    const convicted = tableRows.filter(d => isSentenced(d)).length;
    const pretrial = tableRows.filter(d => isJudicialStage(d)).length;
    const total = tableRows.length;
    const now = new Date()
  // Libérations ce mois : statut LIBERE + release_date dans le mois courant
  const liberationsThisMonth = detenus.filter((d: Detenu) => {
    if (d.status !== 'LIBERE') return false;
    const r = new Date(d.release_date);
    return r.getFullYear() === now.getFullYear() && r.getMonth() === now.getMonth();
  }).length;
    return {
      total,
      convicted,
      pretrial,
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

  const filterLabel =
    STATUS_FAMILY_FILTERS.find((f) => f.value === statusFilter)?.label ??
    PRISONER_STATUSES.find((st) => st.value === statusFilter)?.plural ??
    'Tous les détenus';

  const generateReport = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const { total, convicted, pretrial, convictedPercentage, liberationsThisMonth } = statistics;

    // ── En-tête ──
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport — Gestion des détenus', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Administration Pénitentiaire du Sénégal  —  Généré le ${date}`, 14, 22);

    // ── Statistiques générales ──
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques générales', 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [['Indicateur', 'Valeur', 'Détail']],
      body: [
        ['Total détenus (système)', String(total), 'Ensemble des détenus enregistrés'],
        ['Condamnés', String(convicted), `${convictedPercentage}% du total`],
        ['Prévenus et accusés', String(pretrial), `${total > 0 ? Math.round((pretrial / total) * 100) : 0}% du total`],
        ['Libérations ce mois', String(liberationsThisMonth), new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'center', cellWidth: 20 } },
      margin: { left: 14, right: 14 },
    });

    // ── Contexte du filtre ──
    const afterStats = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Liste filtrée : ${filterLabel}`, 14, afterStats);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const subtitle = searchTerm
      ? `Recherche : "${searchTerm}"  —  ${filteredDetenus.length} résultat(s)`
      : `${filteredDetenus.length} détenu(s) dans cette catégorie`;
    doc.text(subtitle, 14, afterStats + 6);

    // ── Tableau des détenus filtrés ──
    autoTable(doc, {
      startY: afterStats + 10,
      head: [['#', 'Nom complet', 'N° Écrou', 'Naissance', 'Incarcéré le', 'Libération', 'Établissement', 'Statut', 'Purgé']],
      body: filteredDetenus.map((d, i) => [
        i + 1,
        `${d.first_name} ${d.last_name}`,
        d.matricule_number ?? d.ecrouNumber ?? '—',
        new Date(d.date_of_birth).toLocaleDateString('fr-FR'),
        new Date(d.incarceration_date).toLocaleDateString('fr-FR'),
        d.release_date ? new Date(d.release_date).toLocaleDateString('fr-FR') : '—',
        d.prisonName,
        prisonerStatusLabel(d.status),
        d.timeServed,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.section === 'body') {
          const val = data.cell.raw as string;
          if (val.startsWith('Condamné')) data.cell.styles.textColor = [185, 28, 28];
          else if (val === 'Prévenu' || val === 'Accusé') data.cell.styles.textColor = [180, 83, 9];
        }
      },
      margin: { left: 8, right: 8 },
      styles: { overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 8 }, 7: { fontStyle: 'bold' } },
    });

    // ── Pied de page ──
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Document confidentiel — Ne pas diffuser sans autorisation', 8, 290);
      doc.text(`Page ${p} / ${pageCount}`, 202, 290, { align: 'right' });
    }

    doc.save(`detenus-${statusFilter === 'all' ? 'tous' : statusFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [filteredDetenus, filterLabel, statusFilter, searchTerm, statistics]);


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

      {/* ── Modal de filtre rapide ── */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">
              Afficher les détenus
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Sélectionnez une catégorie pour filtrer la liste
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => selectFilter('all')}
                className="w-full py-3 px-5 rounded-xl bg-slate-700 text-white font-semibold text-base hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Tous les détenus</span>
                <span className="text-sm font-normal opacity-70">{tableRows.length} détenus</span>
              </button>
              <button
                onClick={() => selectFilter('CONDAMNES')}
                className="w-full py-3 px-5 rounded-xl bg-red-600 text-white font-semibold text-base hover:bg-red-700 transition-colors flex items-center justify-between"
              >
                <span>Condamnés</span>
                <span className="text-sm font-normal opacity-70">
                  {tableRows.filter(d => isSentenced(d)).length} détenus
                </span>
              </button>
              <button
                onClick={() => selectFilter('JUDICIAIRE')}
                className="w-full py-3 px-5 rounded-xl bg-amber-500 text-white font-semibold text-base hover:bg-amber-600 transition-colors flex items-center justify-between"
              >
                <span>Prévenus et accusés</span>
                <span className="text-sm font-normal opacity-70">
                  {tableRows.filter(d => isJudicialStage(d)).length} détenus
                </span>
              </button>
            </div>
            <button
              onClick={() => setShowFilterModal(false)}
              className="mt-5 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Ignorer et afficher tout
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des détenus</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={generateReport}
            disabled={isLoading || filteredDetenus.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Générer Rapport PDF
          </button>
          <Can perm="prisoners:create">
            <button
              onClick={openFormDetenu}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={createMutation.isPending || isLoadingPrisons}
            >
              {createMutation.isPending ? 'Création...' : 'Ajouter un nouveau détenu'}
            </button>
          </Can>
        </div>
      </div>

      {/* AP / SP : décisions de justice dont l'effet sur le statut attend leur validation */}
      <PendingDecisionEffects />

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
          onEdit={can('prisoners:update') ? handleOpenEditModal : undefined}
          // Ancien détenu ou transfert entrant : lecture seule
          canEdit={(d) => isMyPrison(d.prison)}
          loading={isLoading}
        />
      </div>

      <InmateStats {...statistics} />

    </div>
  );
};