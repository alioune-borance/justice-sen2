import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../auth/store/auth.store";
import { RelativeMeLink } from "../../auth/types/user.types";

export interface DetenuLie {
  id: number;
  nom: string;
  lien: string;
}

// Proche référent : détenus de ses liens ACTIF (/me) et détenu choisi, gardé dans l'URL (?detenu=)
// pour passer du compte à la cantine et aux commandes sans le rechoisir.
export const useDetenuChoisi = () => {
  const user = useAuthStore((s) => s.user);
  const [params, setParams] = useSearchParams();

  const detenus: DetenuLie[] = useMemo(
    () =>
      (user?.links ?? [])
        .filter((l): l is RelativeMeLink => l.type === "relative" && l.status === "ACTIF" && l.prisoner_id !== null)
        .map((l) => ({ id: l.prisoner_id as number, nom: l.prisoner_name ?? l.requested_name, lien: l.relationship_label })),
    [user]
  );

  const wanted = Number(params.get("detenu"));
  // Un seul détenu : choisi d'office ; sinon celui de l'URL s'il fait partie des liens
  const detenu = detenus.find((d) => d.id === wanted) ?? (detenus.length === 1 ? detenus[0] : undefined);

  const choisir = useCallback(
    (id: number | null) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set("detenu", String(id));
        else next.delete("detenu");
        return next;
      }, { replace: true }),
    [setParams]
  );

  return { detenus, detenu, choisir };
};
