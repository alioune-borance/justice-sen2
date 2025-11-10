import React from 'react';
import { Users, Building, Calendar, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendValue }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center mt-2 ${getTrendColor()}`}>
              <TrendIcon className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div className="bg-blue-50 p-3 rounded-full">
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

const CrimeChart = () => {
  const crimeData = [
    { type: 'Vol', percentage: 35, color: 'bg-blue-500' },
    { type: 'Trafic de drogue', percentage: 28, color: 'bg-red-500' },
    { type: 'Violence', percentage: 20, color: 'bg-yellow-500' },
    { type: 'Fraude', percentage: 12, color: 'bg-green-500' },
    { type: 'Autres', percentage: 5, color: 'bg-purple-500' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Répartition des types de crimes</h3>
      <div className="space-y-4">
        {crimeData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
              <span className="text-sm font-medium text-gray-700">{item.type}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecidivismChart = () => {
  const regions = [
    { name: 'Île-de-France', rate: 32, color: 'bg-red-500' },
    { name: 'Provence-Alpes-Côte d\'Azur', rate: 28, color: 'bg-orange-500' },
    { name: 'Rhône-Alpes', rate: 24, color: 'bg-yellow-500' },
    { name: 'Nord-Pas-de-Calais', rate: 22, color: 'bg-blue-500' },
    { name: 'Aquitaine', rate: 18, color: 'bg-green-500' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Taux de récidive par région</h3>
      <div className="space-y-4">
        {regions.map((region, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 w-32">{region.name}</span>
            <div className="flex items-center space-x-2 flex-1">
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div 
                  className={`h-6 rounded-full ${region.color} flex items-center justify-end pr-2`}
                  style={{ width: `${region.rate}%` }}
                >
                  <span className="text-white text-xs font-medium">{region.rate}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Détenus total" 
          value="68,432" 
          icon={Users}
          trend="up"
          trendValue="+2.5%"
        />
        <StatsCard 
          title="Taux d'occupation de la prison" 
          value="130%" 
          icon={Building}
          trend="stable"
        />
        <StatsCard 
          title="Visites de la semaine" 
          value="500" 
          icon={Calendar}
          trend="down"
          trendValue="-8.2%"
        />
        <StatsCard 
          title="Candidats à la grâce" 
          value="324" 
          icon={UserCheck}
          trend="up"
          trendValue="+15.3%"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CrimeChart />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Alertes récentes</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-red-800">Incident sécuritaire - Prison de Fresnes</p>
              <p className="text-xs text-red-600">Il y a 2 heures</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-yellow-800">Surpopulation détectée - Prison de Fleury-Mérogis</p>
              <p className="text-xs text-yellow-600">Il y a 4 heures</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-blue-800">Nouvelle demande de grâce présidentielle</p>
              <p className="text-xs text-blue-600">Il y a 6 heures</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};