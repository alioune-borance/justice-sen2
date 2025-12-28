import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Building, Calendar, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

 const prisons = [
    { name: 'Prison de Fleury-Mérogis', occupancy: 150, capacity: 120 },
    { name: 'Prison de la Santé', occupancy: 130, capacity: 100 },
    { name: 'Prison de Fresnes', occupancy: 80, capacity: 110 },
    { name: 'Prison de Villepinte', occupancy: 125, capacity: 100 }
  ];

 const getTotalInmates = () => {
    return prisons.reduce((total, prison) => total + prison.occupancy, 0);
  }

  const getAvgOccupancyRate = () => {
    const totalOccupancy = prisons.reduce((total, prison) => total + prison.occupancy, 0);
    const totalCapacity = prisons.reduce((total, prison) => total + prison.capacity, 0);
    return ((totalOccupancy / totalCapacity) * 100).toFixed(1);
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

const PrisonList = () => {
  

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Taux d'occupation des prisons</h3>
      <div className="space-y-4">
        {prisons.map((prison, index) => {
          const occupancyRate = (prison.occupancy / prison.capacity) * 100;
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{prison.name}</span>
                <span className="text-sm font-medium text-gray-600">{occupancyRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${occupancyRate > 100 ? 'bg-orange-500' : 'bg-blue-500'}`}
                  style={{ width: `${occupancyRate > 100 ? '100' : occupancyRate}%` }}
                ></div>
              </div>
            </div>
          );
        }
        )}
      </div>
    </div>
  );
}

const RecidivismByRegionChart = () => {
  const regionData = [
    { region: 'Île-de-France', rate: 45, color: 'bg-blue-500' },  
    { region: 'Provence-Alpes-Côte d\'Azur', rate: 38, color: 'bg-red-500' },
    { region: 'Auvergne-Rhône-Alpes', rate: 30, color: 'bg-green-500' },
    { region: 'Nouvelle-Aquitaine', rate: 25, color: 'bg-yellow-500' },
    { region: 'Occitanie', rate: 20, color: 'bg-purple-500' }
  ];
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Taux de récidive par région</h3>
      <div className="space-y-4"> 
        {regionData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
              <span className="text-sm font-medium text-gray-700">{item.region}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${item.rate}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600">{item.rate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



const crimeData = [
  { type: 'Vol', percentage: 35, color: '#3b82f6' }, // blue-500
  { type: 'Trafic de drogue', percentage: 28, color: '#ef4444' }, // red-500
  { type: 'Violence', percentage: 20, color: '#f59e42' }, // yellow-500
  { type: 'Fraude', percentage: 12, color: '#22c55e' }, // green-500
  { type: 'Autres', percentage: 5, color: '#a855f7' } // purple-500
];

const CrimeChart = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Répartition des types de crimes</h3>
      <div className="flex flex-col md:flex-row items-center justify-center">
        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <Pie
              data={crimeData}
              dataKey="percentage"
              nameKey="type"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={40}
              // label={({ percent }: { percent?: number }) => percent !== undefined ? `${(percent * 100).toFixed(0)}%` : ''}
            >
              {crimeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="ml-8 mt-6 md:mt-0">
          <ul>
            {crimeData.map((item) => (
              <li key={item.type} className="flex items-center mb-2">
                <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                <span className="text-sm text-gray-700 font-medium">{item.type}</span>
                <span className="ml-2 text-sm text-gray-500">{item.percentage}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};


export const GenericDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-2 gap-6">
        <PrisonList 
        
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Nombre de prisons sous gestion" 
          value={prisons.length.toString()}
          icon={Building}
          trend="stable"
        />
        <StatsCard 
          title="Nombre de détenus actifs" 
          value={getTotalInmates().toString()}
          icon={Users}
          trend="up"
          trendValue="+2.5%"
        />
        <StatsCard 
          title="Taux d'occupation moyenne des prisons" 
          value={`${getAvgOccupancyRate()}%`} 
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

        <StatsCard 
          title="Nombre de libérations ce mois-ci" 
          value="120" 
          icon={Users}
          trend="down"
          trendValue="-3.1%"
        />
        <StatsCard
          title="Nouveaux détenus cette semaine" 
          value="45" 
          icon={Users}
          trend="up"
          trendValue="+10.0%"
        />
        
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CrimeChart />
         <RecidivismByRegionChart />
      </div>

      <div className="grid grid-cols-1 rg:grid-cols-2 gap-6">
       
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