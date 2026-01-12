// features/detenus/components/InmateStats.tsx
import React from 'react';
import { User } from 'lucide-react';

interface InmateStatsProps {
  total: number;
  convicted: number;
  pretrial: number;
  convictedPercentage: number;
}

export const InmateStats: React.FC<InmateStatsProps> = ({
  total,
  convicted,
  pretrial,
  convictedPercentage,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-800">Total détenus</h3>
        </div>
        <div className="text-3xl font-bold text-slate-800 mb-2">{total}</div>
        <p className="text-sm text-gray-600">Dans le système</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-semibold text-slate-800">Condamnés</h3>
        </div>
        <div className="text-3xl font-bold text-slate-800 mb-2">{convicted}</div>
        <p className="text-sm text-gray-600">{convictedPercentage}% du total</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-6 w-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-slate-800">Prévenus</h3>
        </div>
        <div className="text-3xl font-bold text-slate-800 mb-2">{pretrial}</div>
        <p className="text-sm text-gray-600">{100 - convictedPercentage}% du total</p>
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
  );
};