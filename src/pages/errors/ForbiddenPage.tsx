import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useRole } from "../../features/auth/hooks/useRole";

// Page 403 : écran demandé hors des droits du rôle connecté
export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { label } = useRole();
  const from = (location.state as { from?: string } | null)?.from;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-sm font-semibold text-red-600 mb-1">Erreur 403</p>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
      <p className="text-gray-600">Votre rôle ({label}) ne donne pas accès à cette page.</p>
      {from && <p className="text-sm text-gray-500 mt-1">Page demandée : {from}</p>}
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur.
      </p>
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
