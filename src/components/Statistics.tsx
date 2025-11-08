import React from 'react';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';

export const Statistics: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Statistiques</h2>
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Statistiques détaillées</h3>
            <p className="text-gray-600">Module de statistiques en cours de développement</p>
          </div>
        </div>
      </div>
    </div>
  );
};