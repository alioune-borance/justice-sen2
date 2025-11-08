import React from 'react';
import { Settings as SettingsIcon, Cog } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Paramètres</h2>
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Paramètres système</h3>
            <p className="text-gray-600">Module de paramètres en cours de développement</p>
          </div>
        </div>
      </div>
    </div>
  );
};