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
  // ... other icons
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Tableau de bord', icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: '/detenus', label: 'Gestion des détenus', icon: <Users className="h-5 w-5" /> },
    { path: '/visits', label: 'Visites', icon: <Calendar className="h-5 w-5" /> },
    { path: '/transfers', label: 'Transferts', icon: <FileText className="h-5 w-5" /> },
    { path: '/security', label: 'Sécurité', icon: <Shield className="h-5 w-5" /> },
    { path: '/settings', label: 'Paramètres', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-800 text-white min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold">Prison Management</h1>
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