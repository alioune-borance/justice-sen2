import React, { useState } from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  Heart, 
  Calendar, 
  Search, 
  Filter, 
  Plus,
  Users,
  BookOpen,
  Building,
  Bell,
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Award
} from 'lucide-react';

interface Program {
  id: number;
  name: string;
  type: 'formation' | 'education' | 'psychosocial';
  duration: string;
  participants: number;
  maxParticipants: number;
  status: 'active' | 'full' | 'upcoming';
  description: string;
  instructor: string;
  startDate: string;
}

interface JobOffer {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'CDI' | 'CDD' | 'Stage' | 'Formation';
  salary: string;
  requirements: string[];
  postedDate: string;
  expiryDate: string;
  contactEmail: string;
}

interface Participant {
  id: number;
  name: string;
  inmateNumber: string;
  programs: string[];
  progress: number;
  releaseDate: string;
  status: 'En formation' | 'Terminé' | 'Abandonné';
  lastActivity: string;
}

const programs: Program[] = [
  {
    id: 1,
    name: 'Formation Menuiserie',
    type: 'formation',
    duration: '6 mois',
    participants: 15,
    maxParticipants: 20,
    status: 'active',
    description: 'Formation complète en menuiserie avec certification professionnelle',
    instructor: 'Jean Martin',
    startDate: '01/02/2024'
  },
  {
    id: 2,
    name: 'Alphabétisation',
    type: 'education',
    duration: '3 mois',
    participants: 25,
    maxParticipants: 25,
    status: 'full',
    description: 'Programme d\'alphabétisation pour adultes',
    instructor: 'Marie Dubois',
    startDate: '15/01/2024'
  },
  {
    id: 3,
    name: 'Soutien Psychologique',
    type: 'psychosocial',
    duration: 'Permanent',
    participants: 45,
    maxParticipants: 50,
    status: 'active',
    description: 'Séances de soutien psychologique individuel et de groupe',
    instructor: 'Dr. Sophie Laurent',
    startDate: 'Permanent'
  }
];

const jobOffers: JobOffer[] = [
  {
    id: 1,
    title: 'Ouvrier Menuisier',
    company: 'Menuiserie Moderne SARL',
    location: 'Paris 12ème',
    type: 'CDI',
    salary: '1800-2200€',
    requirements: ['Formation menuiserie', 'Motivation'],
    postedDate: '10/01/2024',
    expiryDate: '10/03/2024',
    contactEmail: 'rh@menuiserie-moderne.fr'
  },
  {
    id: 2,
    title: 'Agent d\'entretien',
    company: 'Services Plus',
    location: 'Marseille',
    type: 'CDD',
    salary: '1600€',
    requirements: ['Aucune expérience requise', 'Ponctualité'],
    postedDate: '15/01/2024',
    expiryDate: '15/02/2024',
    contactEmail: 'contact@services-plus.com'
  }
];

const participants: Participant[] = [
  {
    id: 1,
    name: 'Martin Dubois',
    inmateNumber: 'ECR-2021-003457',
    programs: ['Formation Menuiserie', 'Soutien Psychologique'],
    progress: 75,
    releaseDate: '12/08/2026',
    status: 'En formation',
    lastActivity: '18/01/2024'
  },
  {
    id: 2,
    name: 'Sophie Laurent',
    inmateNumber: 'ECR-2022-001234',
    programs: ['Alphabétisation'],
    progress: 100,
    releaseDate: '15/01/2025',
    status: 'Terminé',
    lastActivity: '20/01/2024'
  }
];

export const ReinsertionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('programs');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const tabs = [
    { id: 'programs', label: 'Programmes', icon: GraduationCap },
    { id: 'jobs', label: 'Emploi', icon: Briefcase },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'partnerships', label: 'Partenariats', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'formation':
        return 'bg-blue-100 text-blue-800';
      case 'education':
        return 'bg-green-100 text-green-800';
      case 'psychosocial':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'full':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'CDI':
        return 'bg-green-100 text-green-800';
      case 'CDD':
        return 'bg-blue-100 text-blue-800';
      case 'Stage':
        return 'bg-yellow-100 text-yellow-800';
      case 'Formation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderProgramsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Base de données des programmes</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nouveau programme</span>
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un programme..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">Tous les types</option>
          <option value="formation">Formation professionnelle</option>
          <option value="education">Éducation</option>
          <option value="psychosocial">Soutien psychosocial</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {programs.map((program) => (
          <div key={program.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">{program.name}</h4>
                <p className="text-sm text-gray-600">{program.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(program.type)}`}>
                {program.type === 'formation' ? 'Formation' : 
                 program.type === 'education' ? 'Éducation' : 'Psychosocial'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Durée:</span>
                <span className="font-medium">{program.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Instructeur:</span>
                <span className="font-medium">{program.instructor}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Participants:</span>
                <span className="font-medium">{program.participants}/{program.maxParticipants}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Capacité</span>
                <span className="text-gray-600">{Math.round((program.participants / program.maxParticipants) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(program.participants / program.maxParticipants) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(program.status)}`}>
                {program.status === 'active' ? 'Actif' : 
                 program.status === 'full' ? 'Complet' : 'À venir'}
              </span>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Voir détails
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Portail d'emploi</h3>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nouvelle offre</span>
        </button>
      </div>

      <div className="space-y-4">
        {jobOffers.map((job) => (
          <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-slate-800">{job.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getJobTypeColor(job.type)}`}>
                    {job.type}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">Salaire: {job.salary}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {job.requirements.map((req, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Publié le {job.postedDate}</p>
                <p>Expire le {job.expiryDate}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{job.contactEmail}</span>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Postuler
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderParticipantsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Suivi des participants</h3>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Participant</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Programmes</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Progrès</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Libération</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {participants.map((participant) => (
              <tr key={participant.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{participant.name}</p>
                    <p className="text-xs text-gray-500">{participant.inmateNumber}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {participant.programs.map((program, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1">
                        {program}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${participant.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{participant.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">{participant.releaseDate}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    participant.status === 'En formation' ? 'bg-blue-100 text-blue-800' :
                    participant.status === 'Terminé' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {participant.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Voir détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPartnershipsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Partenariats ONG et Institutions</h3>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nouveau partenariat</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Pôle Emploi</h4>
              <p className="text-sm text-gray-600">Agence nationale</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Partenariat pour l'accompagnement à l'emploi et la formation professionnelle
          </p>
          <div className="flex items-center justify-between">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Actif</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm">Gérer</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Croix-Rouge</h4>
              <p className="text-sm text-gray-600">ONG humanitaire</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Soutien psychosocial et accompagnement à la réinsertion
          </p>
          <div className="flex items-center justify-between">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Actif</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm">Gérer</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">AFPA</h4>
              <p className="text-sm text-gray-600">Formation professionnelle</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Programmes de formation et certification professionnelle
          </p>
          <div className="flex items-center justify-between">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Actif</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm">Gérer</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Notifications et rappels</h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800">Formation Menuiserie - Session 2</h4>
              <p className="text-sm text-blue-700 mt-1">
                Début de la nouvelle session le 01/03/2024. 5 participants inscrits.
              </p>
              <p className="text-xs text-blue-600 mt-2">Il y a 2 heures</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800">Programme terminé</h4>
              <p className="text-sm text-green-700 mt-1">
                Sophie Laurent a terminé avec succès le programme d'alphabétisation.
              </p>
              <p className="text-xs text-green-600 mt-2">Il y a 1 jour</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800">Suivi post-carcéral</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Rendez-vous de suivi prévu pour Pierre Moreau le 25/01/2024.
              </p>
              <p className="text-xs text-yellow-600 mt-2">Il y a 3 jours</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Briefcase className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-purple-800">Nouvelle offre d'emploi</h4>
              <p className="text-sm text-purple-700 mt-1">
                Menuiserie Moderne SARL recherche un ouvrier menuisier.
              </p>
              <p className="text-xs text-purple-600 mt-2">Il y a 1 semaine</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'programs':
        return renderProgramsTab();
      case 'jobs':
        return renderJobsTab();
      case 'participants':
        return renderParticipantsTab();
      case 'partnerships':
        return renderPartnershipsTab();
      case 'notifications':
        return renderNotificationsTab();
      default:
        return renderProgramsTab();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion de la réinsertion</h2>
        <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg">
          <GraduationCap className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">Module Réinsertion</span>
        </div>
      </div>

      {/* Statistiques de réinsertion */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Programmes actifs</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">24</p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+15%</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Participants actifs</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">342</p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+8%</span>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offres d'emploi</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">67</p>
              <div className="flex items-center mt-2 text-blue-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+22%</span>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <Briefcase className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de réussite</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">78%</p>
              <div className="flex items-center mt-2 text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+5%</span>
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};