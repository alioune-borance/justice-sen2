import React from "react";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { RelativeRequestsPanel } from "../../features/proches/components/RelativeRequestsPanel";

interface MeLink {
  id: number;
  type: "relative" | "judicial";
  prisoner_id: number | null;
  prisoner_name: string | null;
  status?: string;
  function_label?: string;
  case_reference?: string;
}

const UPCOMING: Record<string, string[]> = {
  PROCHE_REFERENT: [
    "Déposer une demande de visite avec ses pièces justificatives",
    "Télécharger vos permis de visite",
  ],
  ACTEUR_JUDICIAIRE: [
    "Traiter les demandes de visite de vos prévenus",
    "Générer et publier les permis de visite",
    "Saisir les décisions de justice",
  ],
};

// Accueil des proches référents et des acteurs judiciaires (portails complets à venir)
export const WelcomePage: React.FC = () => {
  const { user, role } = usePermissions();
  const items = (role && UPCOMING[role]) || [];
  const links = ((user?.links ?? []) as MeLink[]).filter((l) => l.prisoner_id !== null);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Bienvenue{user?.first_name ? `, ${user.first_name}` : ""}
        </h2>
        <p className="text-gray-600 mb-4">{user?.role_label ?? "Espace personnel"}</p>

        {links.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-700 font-medium mb-2">
              {role === "ACTEUR_JUDICIAIRE" ? "Vos détenus affectés" : "Vos proches détenus"}
            </p>
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {links.map((link) => (
                <li key={`${link.type}-${link.id}`} className="p-3 text-sm flex justify-between">
                  <span className="font-medium text-gray-800">{link.prisoner_name}</span>
                  <span className="text-gray-500">
                    {link.type === "judicial"
                      ? `${link.function_label}${link.case_reference ? ` — dossier ${link.case_reference}` : ""}`
                      : "Lien validé"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {items.length > 0 && (
          <>
            <p className="text-gray-700 mb-2">Votre espace proposera prochainement :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </>
        )}
      </div>

      {role === "PROCHE_REFERENT" && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <RelativeRequestsPanel />
        </div>
      )}
    </div>
  );
};
