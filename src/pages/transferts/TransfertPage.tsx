import React, { useMemo } from 'react';
import { TransfertTable } from '../../components/transfert/TransfertTable';
import { TransfertTableRow } from '../../features/transferts/types/transfert';
import { useNavigate } from 'react-router-dom';
import { useGetTransferts } from '../../features/transferts/api/useGetTransfert';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { Detenu } from '../../features/detenus/types/detenu';
import { useGetPrisons } from '../../features/prisons/api/useGetPrison';
import { Prison } from '../../features/prisons/types/prison';
import { useGetSorties } from '../../features/sorties/api/useGetSortie';
import { SortieTableRow } from '../../features/sorties/types/sortie';

export const TransfertListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: transferts = [], isLoading } = useGetTransferts();
  const { data: sorties = [] } = useGetSorties();
  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons();
  const { data: detenusList = [], isLoading: isLoadingDetenus } = useGetDetenus();

  const getDetenuName = (detenuId: number): string => {
    const detenu = detenusList.find((d: Detenu) => d.id === detenuId);
    return detenu ? `${detenu.first_name} ${detenu.last_name}` : '...';
  };

  const getTransfert = (from: number, to: number): string => {
    const f = prisons.find((p: Prison) => p.id === Number(from));
    const t = prisons.find((p: Prison) => p.id === Number(to));
    return `${f?.name || '...'} => ${t?.name || '...'}`;
  };

  const handleViewDetail = (id: number) => navigate(`/transfers/${id}`);

  const tableRows: TransfertTableRow[] = useMemo(() => {
    if (isLoadingDetenus || isLoadingPrisons) return [];
    return transferts.map((transfert) => ({
      ...transfert,
      detenu_name: getDetenuName(transfert.prisoner),
      type_transfert: getTransfert(transfert.from_prison, transfert.to_prison),
      motif: transfert.purpose,
      transfer_date: transfert.transfer_date,
      priorite: transfert.priority,
      status: transfert.status,
    } as TransfertTableRow));
  }, [transferts, detenusList, prisons]);

  const tableRowsSorties: SortieTableRow[] = useMemo(() => {
    return sorties.map((sortie) => ({
      ...sortie,
      detenu_name: getDetenuName(sortie.prisoner),
      date_prevue: sortie.date,
      due_return_date: sortie.due_return_date,
      is_returned: sortie.is_returned,
      actual_return_date: sortie.actual_return_date,
    } as SortieTableRow));
  }, [sorties, detenusList]);

  if (isLoadingDetenus || isLoadingPrisons) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des transferts et sorties</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <TransfertTable
          tranferts={tableRows}
          sorties={tableRowsSorties}
          onViewDetail={handleViewDetail}
          onEdit={() => {}}
          onAddTransfert={() => navigate('/transfers/new')}
          onEditTransfert={(t) => navigate(`/transfers/update/${t.id}`)}
          onAddSortie={() => navigate('/transfers/sorties/new')}
          onEditSortie={(s) => navigate(`/transfers/sorties/update/${s.id}`)}
          loading={isLoading}
        />
      </div>
    </div>
  );
};
