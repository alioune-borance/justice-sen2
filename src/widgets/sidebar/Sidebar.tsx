// components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Shield,
  Settings,
  AlertTriangle,
  Stethoscope,
  HeartHandshake,
  UserCog,
  Gavel,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileBadge,
  Scale,
} from 'lucide-react';
import { usePermissions } from '../../features/auth/hooks/usePermissions';
import { useRole } from '../../features/auth/hooks/useRole';
import { PRISONER_LINKED_ROLES, ROUTE_ACCESS, RoutePath } from '../../features/auth/config/rbac';
import { Role } from '../../features/auth/types/user.types';

interface NavItem {
  // '/' : accueil, ouvert à tous ; sinon un chemin de ROUTE_ACCESS (même règle que la route)
  path: '/' | RoutePath;
  label: string;
  icon: React.ReactNode;
  // Rôles pour qui l'entrée ferait doublon avec leur accueil (affichage seulement)
  hideFor?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Tableau de bord', icon: <LayoutDashboard className="h-5 w-5" /> },
  { path: '/detenus', label: 'Gestion des détenus', icon: <Users className="h-5 w-5" />, hideFor: PRISONER_LINKED_ROLES },
  { path: '/visits', label: 'Visites', icon: <Calendar className="h-5 w-5" /> },
  { path: '/transfers', label: 'Transferts', icon: <FileText className="h-5 w-5" /> },
  { path: '/incidents', label: 'Incidents', icon: <AlertTriangle className="h-5 w-5" /> },
  { path: '/infirmerie', label: 'Infirmerie', icon: <Stethoscope className="h-5 w-5" /> },
  { path: '/mes-demandes', label: 'Mes demandes de visite', icon: <CalendarCheck className="h-5 w-5" /> },
  { path: '/demandes', label: 'Demandes de visite', icon: <ClipboardList className="h-5 w-5" /> },
  { path: '/permis', label: 'Permis de visite', icon: <FileBadge className="h-5 w-5" /> },
  { path: '/decisions', label: 'Décisions de justice', icon: <Scale className="h-5 w-5" /> },
  { path: '/proches', label: 'Proches à valider', icon: <HeartHandshake className="h-5 w-5" /> },
  { path: '/users', label: 'Utilisateurs', icon: <UserCog className="h-5 w-5" /> },
  { path: '/affectations', label: 'Affectations judiciaires', icon: <Gavel className="h-5 w-5" /> },
  { path: '/etablissements', label: 'Établissements', icon: <Building2 className="h-5 w-5" /> },
  { path: '/security', label: 'Sécurité', icon: <Shield className="h-5 w-5" /> },
  { path: '/settings', label: 'Paramètres', icon: <Settings className="h-5 w-5" /> },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, allows } = usePermissions();
  const { role, isNationalReadOnly, isRelative, isJudicialActor } = useRole();

  // Libellé de l'accueil selon ce qu'il affiche (voir pages/home/HomePage.tsx)
  const homeLabel = isNationalReadOnly ? 'Vue nationale' : isRelative || isJudicialActor ? 'Mes détenus' : 'Tableau de bord';

  // Masquage d'affichage seulement : le backend filtre les données et refuse les actions
  const navItems = NAV_ITEMS
    .filter((item) => !(role && item.hideFor?.includes(role)))
    .filter((item) => item.path === '/' || allows(ROUTE_ACCESS[item.path]))
    .map((item) => (item.path === '/' ? { ...item, label: homeLabel } : item));
  const title = user?.prison?.name ?? (user?.scope.type === 'national' ? 'Niveau national' : 'Gestion pénitentiaire');

  return (
    <aside className="w-64 bg-slate-800 text-white min-h-screen">
      <div className="p-4 flex items-center space-x-3">
        {/* Drapeau du Sénégal */}
        <div className="flex-shrink-0 w-10 h-7 rounded overflow-hidden shadow flex">
          <div className="flex-1 bg-green-600" />
          <div className="flex-1 bg-yellow-400 flex items-center justify-center">
            {/* Étoile verte centrale */}
            <svg viewBox="0 0 10 10" className="w-3 h-3" fill="#1a7a1a">
              <polygon points="5,1 6.18,3.82 9.26,3.82 6.82,5.68 7.64,8.61 5,6.9 2.36,8.61 3.18,5.68 0.74,3.82 3.82,3.82" />
            </svg>
          </div>
          <div className="flex-1 bg-red-600" />
        </div>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 hover:bg-slate-700 transition-colors ${
              location.pathname === item.path ? 'bg-slate-700 border-r-4 border-blue-500' : ''
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};