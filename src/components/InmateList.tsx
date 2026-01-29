import React, { useState } from 'react';
import { Search, Filter, User, Eye, Edit, MoreVertical } from 'lucide-react';
import { useGetDetenus } from '../features/detenus/api/useGetDetenu';
import { Detenu } from '../entities/Detenu'; // Adjust path as needed

interface InmateListProps {
  onViewDetail: (inmateId: number) => void;
}

export const InmateList: React.FC<InmateListProps> = ({ onViewDetail }) => {
  const { data: detenus = [], isLoading, isError } = useGetDetenus();
    
  // Helper functions to calculate derived data
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

  const getPrisonName = (prisonId: number): string => {
    const prisons: Record<number, string> = {
      1: "Fresnes",
      2: "Marseille",
      3: "Lyon",
      4: "Bordeaux"
    };
    return prisons[prisonId] || `Prison #${prisonId}`;
  };

  const getEcrouNumber = (id: number): string => {
    return `EC-${String(id).padStart(3, '0')}`;
  };

  const getStatus = (detenu: Detenu): string => {
    // For now, all are Condamné. You can add logic based on your data
    return "Condamné";
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prisonFilter, setPrisonFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDetenu, setSelectedDetenu] = useState<Detenu | null>(null);

  // Filter detenus directly
  const filteredDetenus = detenus.filter((detenu: Detenu) => {
    const fullName = `${detenu.first_name} ${detenu.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         getEcrouNumber(detenu?.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getStatus(detenu) === statusFilter;
    const matchesPrison = prisonFilter === 'all' || getPrisonName(detenu.prison) === prisonFilter;
    return matchesSearch && matchesStatus && matchesPrison;
  });

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

  // Calculate statistics
  const statistics = {
    total: detenus.length,
    convicted: detenus.filter(d => getStatus(d) === 'Condamné').length,
    pretrial: detenus.filter(d => getStatus(d) === 'Prévenu').length,
    convictedPercentage: detenus.length > 0 
      ? Math.round((detenus.filter(d => getStatus(d) === 'Condamné').length / detenus.length) * 100)
      : 0
  };

  const handleEditClick = (detenu: Detenu) => {
    setSelectedDetenu(detenu);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedDetenu(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCloseModal();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  if (isError) {
    return <div className="text-red-600 text-center p-4">Erreur lors du chargement des données</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des détenus</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouveau détenu
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
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
              <option value="Condamné">Condamné</option>
              <option value="Prévenu">Prévenu</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={prisonFilter}
              onChange={(e) => setPrisonFilter(e.target.value)}
            >
              <option value="all">Toutes les prisons</option>
              <option value="Fresnes">Fresnes</option>
              <option value="Marseille">Marseille</option>
              <option value="Lyon">Lyon</option>
              <option value="Bordeaux">Bordeaux</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
            </button>
          </div>
        </div>

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
              {filteredDetenus.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Aucun détenu trouvé
                  </td>
                </tr>
              ) : (
                filteredDetenus.map((detenu: Detenu) => {
                  const status = getStatus(detenu);
                  const prisonName = getPrisonName(detenu.prison);
                  const ecrouNumber = getEcrouNumber(detenu.id);
                  const sentence = calculateSentence(detenu.incarceration_date.getDate().toString(), detenu.release_date.toDateString());
                  const timeServed = calculateTimeServed(detenu.incarceration_date.toDateString(), detenu.release_date.toDateString());
                  
                  return (
                    <tr key={`${detenu.id}-${ecrouNumber}`} className="hover:bg-gray-50">
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
                      <td className="px-4 py-3 text-sm text-gray-800">{ecrouNumber}</td>
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
                              style={{ width: timeServed }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{timeServed}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{prisonName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                          {status}
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
                            onClick={() => handleEditClick(detenu)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">Total détenus</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">{statistics.total}</div>
          <p className="text-sm text-gray-600">Dans le système</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-800">Condamnés</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">{statistics.convicted}</div>
          <p className="text-sm text-gray-600">{statistics.convictedPercentage}% du total</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-800">Prévenus</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">{statistics.pretrial}</div>
          <p className="text-sm text-gray-600">{100 - statistics.convictedPercentage}% du total</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-800">Libérations</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">142</div>
          <p className="text-sm text-gray-600">Ce mois-ci</p>
        </div>
      </div>

      {/* Add Detenu Modal - Update to match Detenu structure */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Ajouter un nouveau détenu</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input 
                    type="text" 
                    name="first_name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input 
                    type="text" 
                    name="last_name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                <input 
                  type="date" 
                  name="date_of_birth"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date d'incarcération</label>
                <input 
                  type="date" 
                  name="incarceration_date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de libération prévue</label>
                <input 
                  type="date" 
                  name="release_date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Établissement</label>
                <select name="prison" className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Choisir...</option>
                  <option value="1">Fresnes</option>
                  <option value="2">Marseille</option>
                  <option value="3">Lyon</option>
                  <option value="4">Bordeaux</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Detenu Modal */}
      {isEditModalOpen && selectedDetenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Modifier un détenu</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input 
                    type="text" 
                    name="first_name"
                    defaultValue={selectedDetenu.first_name}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input 
                    type="text" 
                    name="last_name"
                    defaultValue={selectedDetenu.last_name}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                <input 
                  type="date" 
                  name="date_of_birth"
                  defaultValue={selectedDetenu.date_of_birth.getDate().toString()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date d'incarcération</label>
                <input 
                  type="date" 
                  name="incarceration_date"
                  defaultValue={selectedDetenu.incarceration_date.toDateString()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de libération prévue</label>
                <input 
                  type="date" 
                  name="release_date"
                  defaultValue={selectedDetenu.release_date.toDateString()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Établissement</label>
                <select 
                  name="prison" 
                  defaultValue={selectedDetenu.prison}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="1">Fresnes</option>
                  <option value="2">Marseille</option>
                  <option value="3">Lyon</option>
                  <option value="4">Bordeaux</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};