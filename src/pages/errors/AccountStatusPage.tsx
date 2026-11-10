import React from "react";
import { Navigate } from "react-router-dom";
import { LogOut, UserX } from "lucide-react";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { useLogout } from "../../features/auth/hooks/useLogout";
import { ACCESS_MESSAGES } from "../../features/auth/config/rbac";
import { RelativeRequestsPanel } from "../../features/proches/components/RelativeRequestsPanel";

// Compte en attente / refusé / désactivé / sans rôle : explication + déconnexion
export const AccountStatusPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { logoutUser, loading } = useLogout();

  if (!user || user.access === "granted") {
    return <Navigate to="/" replace />;
  }

  const message = ACCESS_MESSAGES[user.access] ?? ACCESS_MESSAGES.not_configured;
  const followsRequests = user.role === "PROCHE_REFERENT" && (user.access === "pending" || user.access === "rejected");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className={`bg-white rounded-2xl shadow-lg p-8 w-full text-center ${followsRequests ? "max-w-3xl" : "max-w-md"}`}>
        <UserX className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">{message.title}</h1>
        <p className="text-gray-600 mb-2">{message.text}</p>
        <p className="text-sm text-gray-400 mb-6">Connecté en tant que {user.username}</p>
        {/* Proche en attente ou refusé : il suit ses demandes et complète ses pièces (D4) */}
        {followsRequests && (
          <div className="mb-6">
            <RelativeRequestsPanel />
          </div>
        )}
        <button
          type="button"
          onClick={logoutUser}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
};
