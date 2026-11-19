import React from 'react';
import { Outlet } from 'react-router-dom';
import { LogOut, UserCircle } from 'lucide-react';
import { Sidebar } from '../sidebar/Sidebar';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { useLogout } from '../../features/auth/hooks/useLogout';
import { NoticeBanner } from '../../shared/notifications/NoticeBanner';
import { NotificationBell } from '../../features/notifications/components/NotificationBell';


interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const { logoutUser, loading } = useLogout();
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1">
          <header className="flex items-center justify-end gap-4 border-b border-gray-200 bg-white px-6 py-3">
            {/* Notifications in-app : nombre de non lues et dernières notifications */}
            <NotificationBell />
            {displayName && (
              <span className="flex items-center gap-2 text-sm text-gray-700">
                <UserCircle className="h-5 w-5 text-gray-500" />
                <span>
                  {displayName}
                  {user?.role_label && (
                    <span className="block text-xs text-gray-500">
                      {user.role_label}
                      {user.prison ? ` — ${user.prison.name}` : ''}
                    </span>
                  )}
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={logoutUser}
              disabled={loading}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </header>
          <main className="p-6">
            {/* Messages globaux de l'intercepteur API (403, etc.) */}
            <NoticeBanner />
            {children ? children : <Outlet />} {/* Support both layouts */}
          </main>
        </div>
      </div>
    </div>
  );
};
