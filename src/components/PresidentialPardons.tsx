import React, { useState } from 'react';
import { Award, Search, Filter, User, Clock, FileText } from 'lucide-react';

const candidates = [
  {
    id: 1,
    name: 'Martin Dubois',
    crime: 'Vol avec violence',
    sentence: '5 ans',
    served: '60%',
    timeRemaining: '2 ans',
    behavior: 'Exemplaire',
    health: 'Bon',
    region: 'Île-de-France',
    prison: 'Fresnes',
    eligibleCriteria: 4
  },
  {
    id: 2,
    name: 'Sophie Laurent',
    crime: 'Trafic de stupéfiants',
    sentence: '3 ans',
    served: '75%',
    timeRemaining: '9 mois',
    behavior: 'Très bon',
    health: 'Fragile',
    region: 'PACA',
    prison: 'Marseille',
    eligibleCriteria: 5
  },
  {
    id: 3,
    name: 'Pierre Moreau',
    crime: 'Fraude fiscale',
    sentence: '4 ans',
    served: '55%',
    timeRemaining: '1 an 8 mois',
    behavior: 'Bon',
    health: 'Bon',
    region: 'Rhône-Alpes',
    prison: 'Lyon',
    eligibleCriteria: 3
  }
];

export const PresidentialPardons: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [crimeFilter, setCrimeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [justification, setJustification] = useState('');

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrime = crimeFilter === 'all' || candidate.crime.includes(crimeFilter);
    const matchesRegion = regionFilter === 'all' || candidate.region === regionFilter;
    return matchesSearch && matchesCrime && matchesRegion;
  });

  const getBehaviorColor = (behavior: string) => {
    switch (behavior) {
      case 'Exemplaire':
        return 'bg-green-100 text-green-800';
      case 'Très bon':
        return 'bg-blue-100 text-blue-800';
      case 'Bon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Bon':
        return 'bg-green-100 text-green-800';
      case 'Fragile':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePropose = (candidateId: number) => {
    setSelectedCandidate(candidateId);
  };

  const submitProposal = () => {
    if (selectedCandidate && justification.trim()) {
      alert('Proposition de grâce envoyée avec succès!');
      setSelectedCandidate(null);
      setJustification('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Panel Présidence - Grâces présidentielles</h2>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Award className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Accès Présidence</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom de détenu..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={crimeFilter}
              onChange={(e) => setCrimeFilter(e.target.value)}
            >
              <option value="all">Tous les crimes</option>
              <option value="Vol">Vol</option>
              <option value="Trafic">Trafic</option>
              <option value="Fraude">Fraude</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="all">Toutes les régions</option>
              <option value="Île-de-France">Île-de-France</option>
              <option value="PACA">PACA</option>
              <option value="Rhône-Alpes">Rhône-Alpes</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{candidate.name}</h3>
                  <p className="text-sm text-gray-600">{candidate.prison}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Critères:</span>
                  <span className="text-xs font-medium text-blue-600">{candidate.eligibleCriteria}/5</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Crime:</span>
                  <span className="text-sm font-medium text-slate-800">{candidate.crime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peine:</span>
                  <span className="text-sm font-medium text-slate-800">{candidate.sentence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Temps purgé:</span>
                  <span className="text-sm font-medium text-green-600">{candidate.served}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Temps restant:</span>
                  <span className="text-sm font-medium text-slate-800">{candidate.timeRemaining}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Comportement:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getBehaviorColor(candidate.behavior)}`}>
                    {candidate.behavior}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Santé:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getHealthColor(candidate.health)}`}>
                    {candidate.health}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => handlePropose(candidate.id)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Proposer pour grâce
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Proposer {candidates.find(c => c.id === selectedCandidate)?.name} pour grâce présidentielle
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justification de la proposition
              </label>
              <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Veuillez détailler les raisons de cette proposition de grâce..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={submitProposal}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!justification.trim()}
              >
                Envoyer proposition
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">Candidats éligibles</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">324</div>
          <p className="text-sm text-gray-600">Détenus répondant aux critères</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-800">En cours d'examen</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">42</div>
          <p className="text-sm text-gray-600">Dossiers en attente</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-800">Grâces accordées</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">18</div>
          <p className="text-sm text-gray-600">Cette année</p>
        </div>
      </div>
    </div>
  );
};