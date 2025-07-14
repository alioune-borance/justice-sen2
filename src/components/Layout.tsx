import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Navigation } from './Navigation';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = "Système National de Gestion Pénitentiaire",
  currentPage,
  onPageChange 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navigation currentPage={currentPage} onPageChange={onPageChange} />
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};