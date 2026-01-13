// components/inmates/InmateFilters.tsx
import React from 'react';
import { Search, Filter } from 'lucide-react';

interface PrisonOption {
  value: string;
  label: string;
}

interface InmateFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  prisonFilter: string;
  onPrisonFilterChange: (value: string) => void;
  prisonOptions?: PrisonOption[]; // Add this prop
}

export const InmateFilters: React.FC<InmateFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  prisonFilter,
  onPrisonFilterChange,
  prisonOptions = [], // Default empty array
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou numéro d'écrou..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="Condamné">Condamné</option>
          <option value="Prévenu">Prévenu</option>
        </select>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={prisonFilter}
          onChange={(e) => onPrisonFilterChange(e.target.value)}
        >
          <option value="all">Toutes les prisons</option>
          {prisonOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
        </button>
      </div>
    </div>
  );
};