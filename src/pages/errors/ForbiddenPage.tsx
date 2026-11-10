import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
      <p className="text-gray-600 mb-6">Vous n'avez pas les droits pour accéder à cette page.</p>
      <button
        type="button"
        onClick={() => navigate("/", { replace: true })}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Retour à l'accueil
      </button>
    </div>
  );
};
