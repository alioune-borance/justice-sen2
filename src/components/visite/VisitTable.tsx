// features/visites/components/VisitTable.tsx
import React from 'react';
import { VisiteTableRow } from '../../features/visites/types/visite';
import { Eye, Edit, MoreVertical, Calendar, Clock, User } from 'lucide-react';
import { useGetVisitors } from '../../features/visites/api/useGetVisite';
import { Visitor } from '../../features/visites/types/visitor';

interface VisitTableProps {
  visites: VisiteTableRow[];
  onViewDetail: (id: number) => void;
  onEdit: (visite: VisiteTableRow) => void;
  loading?: boolean;
}

export const VisitTable: React.FC<VisitTableProps> = ({
  visites,
  onViewDetail,
  onEdit,
  loading = false,
}) => {
  const { data: visitorList = [], isLoading: isLoadingVisitors } = useGetVisitors();
  
  const getVisitsProgrammedToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return visites.filter(visit => {
    const visitDate = new Date(visit.visit_date);
    return visit.status === "scheduled" && 
           visitDate >= today && 
           visitDate < tomorrow;
  }).length;
}
const getVisitsProgrammed = () => {
  return visites.filter(visit => {
    return visit.status === "scheduled"
  }).length;
}

const getVisitorName = (visitor_id: number) => {
      const visitor = visitorList.find((v: Visitor) => v.id === visitor_id);
      return visitor ? `${visitor.name}` : "...";
  }  


  const statistics = {
    totalVisit : visites.length,
    totalProgrammed: getVisitsProgrammed(),
    totalProgrammedToday: getVisitsProgrammedToday(),
  }

  
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

  if (visites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aucune visite trouvée</p>
      </div>
    );
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

  return (
    <div className="overflow-x-auto">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Détenu</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Visiteur</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Début Visite</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fin Visite</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Raison</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visites.map((visite) => (
              <tr key={`${visite.id}-${getVisitorName(visite.visitor_id)}`} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {visite.detenu_name}
                </td>
                <td className="px-4 py-3">
                  { getVisitorName(visite.visitor_id) }
                </td>
                <td className="px-4 py-3">
                  {new Date(visite.visit_date).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3">
                  {new Date(visite.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  {new Date(visite.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  {visite.purpose}
                </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(visite.status)}`}>
                      { visite.status }
                    </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewDetail(visite.id)}
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
          <br /><br />
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-800">Aujourd'hui</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-2">{ statistics.totalProgrammedToday }</div>
              <p className="text-sm text-gray-600">Visites programmées</p>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="h-6 w-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-slate-800">Total Visites</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-2">{ statistics.totalVisit }</div>
              <p className="text-sm text-gray-600">total des visites</p>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-slate-800">Visites programmées</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-2">{ statistics.totalProgrammed }</div>
              <p className="text-sm text-gray-600">programmées</p>
            </div>
          </div>
        </div>
    </div>
  );
}