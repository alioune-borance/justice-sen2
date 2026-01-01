import React from 'react';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  PieChart, 
  Shield, 
  UserCheck,
  GraduationCap,
  Settings,
  Home,
  ArrowRightLeft
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'genericDashboard', label: 'Tableau de bord générique', icon: PieChart},
  { id: 'dashboard', label: 'Tableau de bord', icon: Home },
  { id: 'inmates', label: 'Détenus', icon: Users },
  { id: 'visits', label: 'Visites', icon: Calendar },
  { id: 'transfers', label: 'Gestion transfert/sortie', icon: ArrowRightLeft },
  { id: 'pardons', label: 'Demandes de grâce', icon: UserCheck },
  { id: 'reinsertion', label: 'Réinsertion', icon: GraduationCap },
  { id: 'reports', label: 'Rapports', icon: PieChart },
  { id: 'security', label: 'Sécurité & Analytique', icon: Shield },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'settings', label: 'Paramètres', icon: Settings }
];

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  return (
    <nav className="w-64 bg-slate-800 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-lg font-bold">SGP National</h1>
            <p className="text-sm text-slate-400">Système de Gestion Pénitentiaire</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-slate-700 transition-colors ${
                currentPage === item.id ? 'bg-slate-700 border-r-4 border-blue-400' : ''
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="p-6 border-t border-slate-700">
        <div className="text-sm text-slate-400">
          <p>Ministère de la Justice</p>
          <p>République Française</p>
        </div>
      </div>
    </nav>
  );
};