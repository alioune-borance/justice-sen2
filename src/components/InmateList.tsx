import React, { useState } from 'react';
import { Search, Filter, User, Eye, Edit, MoreVertical } from 'lucide-react';

const inmates: any[] = [
  {
    id: 1,
    name: 'Martin Dubois',
    number: 'ECR-2021-003457',
    crime: 'Vol avec violence',
    sentence: '5 ans',
    served: '60%',
    prison: 'Fresnes',
    status: 'Condamné',
    entryDate: '12/08/2021',
    releaseDate: '12/08/2026'
  },
  {
    id: 2,
    name: 'Sophie Laurent',
    number: 'ECR-2022-001234',
    crime: 'Trafic de stupéfiants',
    sentence: '3 ans',
    served: '75%',
    prison: 'Marseille',
    status: 'Condamné',
    entryDate: '15/01/2022',
    releaseDate: '15/01/2025'
  },
  {
    id: 3,
    name: 'Pierre Moreau',
    number: 'ECR-2023-005678',
    crime: 'Fraude fiscale',
    sentence: '4 ans',
    served: '25%',
    prison: 'Lyon',
    status: 'Prévenu',
    entryDate: '20/03/2023',
    releaseDate: '20/03/2027'
  }
];

interface InmateListProps {
  onViewDetail: (inmateId: number) => void;
}

export const InmateList: React.FC<InmateListProps> = ({ onViewDetail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prisonFilter, setPrisonFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedInmate, setSelectedInmate] = useState<any | null>(null);

  const filteredInmates = inmates.filter(inmate => {
    const matchesSearch = inmate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inmate.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inmate.status === statusFilter;
    const matchesPrison = prisonFilter === 'all' || inmate.prison === prisonFilter;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des détenus</h2>
        <button onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Détenu</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">N° Écrou</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Crime</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Peine</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Temps purgé</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Établissement</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInmates.map((inmate) => (
                <tr key={inmate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{inmate.name}</p>
                        <p className="text-xs text-gray-500">Entrée: {inmate.entryDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{inmate.number}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{inmate.crime}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{inmate.sentence}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: inmate.served }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{inmate.served}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{inmate.prison}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(inmate.status)}`}>
                      {inmate.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onViewDetail(inmate.id)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Voir le détail"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:text-gray-800" title="Modifier">
                        <Edit onClick={() => {
                              setSelectedInmate(inmate);
                              setIsEditModalOpen(true);
                            }}
                        className="h-4 w-4" />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">Total détenus</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">68,432</div>
          <p className="text-sm text-gray-600">Dans le système</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-800">Condamnés</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">52,180</div>
          <p className="text-sm text-gray-600">76% du total</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-800">Prévenus</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">16,252</div>
          <p className="text-sm text-gray-600">24% du total</p>
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

      {isModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6 relative">

          {/* Bouton fermer */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>

          <h2 className="text-xl font-bold mb-4">Ajouter un nouveau détenu</h2>

              {/* Formulaire Ajout détenu*/}
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">N° Écrou</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Crime</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Peine</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Établissement</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">Choisir...</option>
                    <option value="Fresnes">Fresnes</option>
                    <option value="Marseille">Marseille</option>
                    <option value="Lyon">Lyon</option>
                  </select>
                </div>

                <div className="flex justify-end">
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

        {isEditModalOpen && selectedInmate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6 relative">

            {/* Bouton fermer */}
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-4">Modifier un détenu</h2>

            {/* Formulaire pré-rempli */}
            <form className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  defaultValue={selectedInmate.name}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">N° Écrou</label>
                <input
                  type="text"
                  defaultValue={selectedInmate.number}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Crime</label>
                <input
                  type="text"
                  defaultValue={selectedInmate.crime}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Peine</label>
                <input
                  type="text"
                  defaultValue={selectedInmate.sentence}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Établissement</label>
                <select
                  defaultValue={selectedInmate.prison}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Fresnes">Fresnes</option>
                  <option value="Marseille">Marseille</option>
                  <option value="Lyon">Lyon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <select
                  defaultValue={selectedInmate.status}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Condamné">Condamné</option>
                  <option value="Prévenu">Prévenu</option>
                </select>
              </div>

              <div className="flex justify-end">
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