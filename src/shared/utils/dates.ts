// Formats de date affichés (fr-FR)
export const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("fr-FR") : "—";

export const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";

// Date du jour au format AAAA-MM-JJ (champs <input type="date">)
export const todayIso = () => new Date().toISOString().slice(0, 10);
