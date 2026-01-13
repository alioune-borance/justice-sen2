import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../sidebar/Sidebar'; 
  

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1">
          {/* <Header /> */}
          <main className="p-6">
            {children ? children : <Outlet />} {/* Support both layouts */}
          </main>
        </div>
      </div>
    </div>
  );
};