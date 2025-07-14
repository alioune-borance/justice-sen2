import React from 'react';
import { AlertTriangle, Shield, TrendingUp, MapPin, BarChart3 } from 'lucide-react';

const crimeData = [
  { month: 'Jan', crimes: 1250 },
  { month: 'Fév', crimes: 1180 },
  { month: 'Mar', crimes: 1320 },
  { month: 'Avr', crimes: 1450 },
  { month: 'Mai', crimes: 1380 },
  { month: 'Jun', crimes: 1520 }
];

const riskZones = [
  { region: 'Seine-Saint-Denis', level: 'Élevé', incidents: 47, trend: 'up' },
  { region: 'Bouches-du-Rhône', level: 'Élevé', incidents: 42, trend: 'up' },
  { region: 'Nord', level: 'Modéré', incidents: 28, trend: 'down' },
  { region: 'Rhône', level: 'Modéré', incidents: 25, trend: 'stable' },
  { region: 'Pas-de-Calais', level: 'Faible', incidents: 15, trend: 'down' }
];

const RegionalMap = () => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Carte des tendances criminelles</h3>
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Carte interactive des régions</p>
          <p className="text-sm text-gray-500">Visualisation des zones à risque</p>
        </div>
      </div>
    </div>
  );
};

const CrimeChart = () => {
  const maxCrime = Math.max(...crimeData.map(d => d.crimes));
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Évolution des crimes par mois</h3>
      <div className="h-64">
        <div className="flex items-end justify-between h-full space-x-2">
          {crimeData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 rounded-t-lg flex items-end" style={{ height: '200px' }}>
                <div
                  className="w-full bg-blue-600 rounded-t-lg flex items-end justify-center"
                  style={{ height: `${(data.crimes / maxCrime) * 100}%` }}
                >
                  <span className="text-white text-xs font-medium mb-1">{data.crimes}</span>
                </div>
              </div>
              <span className="text-sm text-gray-600 mt-2">{data.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RiskZonesList = () => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Élevé':
        return 'bg-red-100 text-red-800';
      case 'Modéré':
        return 'bg-yellow-100 text-yellow-800';
      case 'Faible':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Zones à risque détectées</h3>
      <div className="space-y-3">
        {riskZones.map((zone, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-slate-800">{zone.region}</p>
                <p className="text-sm text-gray-600">{zone.incidents} incidents ce mois</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs ${getLevelColor(zone.level)}`}>
                {zone.level}
              </span>
              {getTrendIcon(zone.trend)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SecurityDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Sécurité & Analytique</h2>
        <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg">
          <Shield className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-red-800">Ministère de l'Intérieur</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Incidents ce mois</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">247</p>
              <div className="flex items-center mt-2 text-red-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Zones à risque</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">15</p>
              <div className="flex items-center mt-2 text-yellow-600">
                <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                <span className="text-sm font-medium">-5%</span>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <MapPin className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes actives</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">8</p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                <span className="text-sm font-medium">-20%</span>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Analyses générées</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">42</p>
              <div className="flex items-center mt-2 text-blue-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+8%</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RegionalMap />
        <RiskZonesList />
      </div>

      <CrimeChart />

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Alertes récentes</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Augmentation des vols à main armée - Seine-Saint-Denis</p>
              <p className="text-xs text-red-600">Détecté automatiquement - Il y a 1 heure</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Concentration d'incidents - Marseille Centre</p>
              <p className="text-xs text-yellow-600">Seuil d'alerte atteint - Il y a 3 heures</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">Pic de criminalité nocturne - Lyon 3ème</p>
              <p className="text-xs text-orange-600">Analyse prédictive - Il y a 5 heures</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};