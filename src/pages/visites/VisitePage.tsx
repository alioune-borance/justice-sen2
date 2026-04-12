// features/visites/pages/visites/VisitePage.tsx
import React, { useMemo } from 'react';
import { VisitTable } from '../../components/visite/VisitTable';
import { VisiteTableRow, visitorName } from '../../features/visites/types/visite';
import { useNavigate } from 'react-router-dom';
import { useGetVisites } from '../../features/visites/api/useGetVisite';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { Detenu } from '../../features/detenus/types/detenu';

export const VisiteListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: visites = [], isLoading } = useGetVisites();
  const { data: detenusList = [] } = useGetDetenus();

  const getVisitorName = (visitor: visitorName) => visitor.name;

  const getDetenuName = (prisoner: number) => {
    const detenu = detenusList.find((d: Detenu) => d.id === prisoner);
    return detenu ? `${detenu.first_name} ${detenu.last_name}` : '';
  };

  const handleViewDetail = (id: number) => navigate(`/visits/${id}`);
  const handleEdit = (visite: VisiteTableRow) => navigate(`/visits/update/${visite.id}`);

  const tableRows: VisiteTableRow[] = useMemo(() => {
    return visites.map((visite) => ({
      ...visite,
      detenu_name: getDetenuName(visite.prisoner),
      visitor: getVisitorName(visite.visitor_name),
      visit_date: visite.visit_date,
      purpose: visite.purpose,
      status: visite.status,
    } as VisiteTableRow));
  }, [visites, detenusList]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des visites</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => navigate('/visits/new')}
        >
          Nouvelle visite
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <VisitTable
          visites={tableRows}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
          loading={isLoading}
        />
      </div>
    </div>
  );
};