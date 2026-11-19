import { usePermissions } from "../../auth/hooks/usePermissions";
import { useRole } from "../../auth/hooks/useRole";

// L'utilisateur peut-il appliquer ou écarter l'effet d'une décision ? AP / SP de la prison ACTUELLE du détenu.
// Pas de test sur decision.prison (prison au moment de la saisie) : après un transfert, l'effet revient à la
// nouvelle prison, la seule à qui le backend renvoie la décision. Le backend reste seul juge (403 / 404).
export const useCanApplyDecisionEffect = () => {
  const { can } = usePermissions();
  const { is } = useRole();
  return can("court_decisions:validate") && is("ADMIN_PRISON", "SUPERVISEUR_PRISON");
};
