import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { endLocalSession, establishSession, initSessionSync, refreshSession } from "../session";

// Au chargement de page, l'access token (en mémoire) est perdu : on le récupère via le cookie de refresh.
export const AuthBootstrap = () => {
  const [loading, setLoading] = useState(() => !useAuthStore.getState().accessToken);

  useEffect(() => {
    initSessionSync();

    if (useAuthStore.getState().accessToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const bootstrapAuth = async () => {
      try {
        const token = await refreshSession();
        await establishSession(token);
      } catch {
        endLocalSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span>Initialisation de la session...</span>
      </div>
    );
  }

  return <Outlet />;
};
