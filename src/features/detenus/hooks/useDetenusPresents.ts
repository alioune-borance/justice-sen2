import { useMemo } from 'react';
import { useGetDetenus } from '../api/useGetDetenu';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { Detenu, isInCustody } from '../types/detenu';

// Détenus présents en ce moment dans la prison de l'utilisateur (toutes les prisons pour un compte national) :
// prévenus, accusés ou condamnés, jamais libérés, évadés ou décédés. Seuls sélectionnables pour une action
// (visite, incident, infirmerie) ; le backend applique la même règle. La liste complète reçue contient aussi,
// en lecture seule, les anciens détenus de la prison et les transferts entrants.
export const useDetenusPresents = () => {
  const query = useGetDetenus();
  const { isMyPrisonAlways } = usePermissions();
  const data = useMemo(
    () => (query.data ?? []).filter((d: Detenu) => isInCustody(d) && isMyPrisonAlways(d.prison)),
    [query.data, isMyPrisonAlways]
  );
  return { ...query, data };
};
