// features/detenus/components/InmateTable.tsx
import React from 'react';
import { User, Eye, Edit, MoreVertical } from 'lucide-react';
import { Detenu } from '../../features/detenus/types/detenu';
import { InmateTableRow } from '../../features/detenus/types/detenu';

interface InmateTableProps {
  detenus: InmateTableRow[];
  onViewDetail: (id: number) => void;
  onEdit: (detenu: Detenu) => void;
  loading?: boolean;
}

export const InmateTable: React.FC<InmateTableProps> = ({
  detenus,
  onViewDetail,
  onEdit,
  loading = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Condamné':
        return 'bg-red-100 text-red-800';
      case 'Prévenu':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (detenus.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aucun détenu trouvé</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Détenu</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">N° Écrou</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date de naissance</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date d'incarcération</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date de libération</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Temps purgé</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Établissement</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {detenus.map((detenu) => (
            <tr key={`${detenu.id}-${detenu.ecrouNumber}`} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {detenu.first_name} {detenu.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Entrée: {new Date(detenu.incarceration_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">{detenu.ecrouNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {new Date(detenu.date_of_birth).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {new Date(detenu.incarceration_date).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {new Date(detenu.release_date).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: detenu.timeServed }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{detenu.timeServed}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">{detenu.prisonName}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(detenu.status)}`}>
                  {detenu.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewDetail(detenu.id)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Voir le détail"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => onEdit(detenu)}
                    className="p-1 text-gray-600 hover:text-gray-800" 
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-600 hover:text-gray-800" title="Plus d'options">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};