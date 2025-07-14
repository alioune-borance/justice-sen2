import React, { useState } from 'react';
import { Calendar, Clock, User, Search, Filter, Check, X } from 'lucide-react';

const visits = [
  {
    id: 1,
    date: '20/01/2024',
    time: '14:00',
    inmate: 'Martin Dubois',
    visitor: 'Marie Dubois',
    relation: 'Épouse',
    status: 'En attente',
    duration: '45 min'
  },
  {
    id: 2,
    date: '20/01/2024',
    time: '15:30',
    inmate: 'Pierre Moreau',
    visitor: 'Jean Moreau',
    relation: 'Père',
    status: 'Approuvée',
    duration: '30 min'
  },
  {
    id: 3,
    date: '21/01/2024',
    time: '10:00',
    inmate: 'Sophie Laurent',
    visitor: 'Paul Laurent',
    relation: 'Frère',
    status: 'En attente',
    duration: '60 min'
  }
];

export const VisitManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.inmate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.visitor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approuvée':
        return 'bg-green-100 text-green-800';
      case 'Refusée':
        return 'bg-red-100 text-red-800';
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des visites</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Nouvelle visite
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par détenu ou visiteur..."
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
              <option value="En attente">En attente</option>
              <option value="Approuvée">Approuvée</option>
              <option value="Refusée">Refusée</option>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Heure</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Détenu</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Visiteur</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Relation</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Durée</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVisits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">{visit.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{visit.time}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{visit.inmate}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{visit.visitor}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{visit.relation}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{visit.duration}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(visit.status)}`}>
                      {visit.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {visit.status === 'En attente' && (
                      <div className="flex space-x-2">
                        <button className="p-1 text-green-600 hover:text-green-800">
                          <Check className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:text-red-800">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">Aujourd'hui</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">12</div>
          <p className="text-sm text-gray-600">Visites programmées</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-800">En attente</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">5</div>
          <p className="text-sm text-gray-600">Demandes à traiter</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-800">Cette semaine</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">47</div>
          <p className="text-sm text-gray-600">Visites réalisées</p>
        </div>
      </div>
    </div>
  );
};