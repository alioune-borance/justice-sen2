import { StatsFilters } from "../types/stats";

// Dates locales au format AAAA-MM-JJ (le backend raisonne en jours calendaires)
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseIso = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const isValidIso = (value: string | null): value is string =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseIso(value).getTime());

// Préréglages de période : mois entiers jusqu'à aujourd'hui
export type PeriodPreset = "3M" | "12M" | "YTD";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "3M", label: "3 derniers mois" },
  { value: "12M", label: "12 derniers mois" },
  { value: "YTD", label: "Année en cours" },
];

export const presetRange = (preset: PeriodPreset, today = new Date()) => {
  const start =
    preset === "YTD"
      ? new Date(today.getFullYear(), 0, 1)
      : new Date(today.getFullYear(), today.getMonth() - (preset === "3M" ? 2 : 11), 1);
  return { date_from: isoDate(start), date_to: isoDate(today) };
};

// Filtres lus dans l'URL (?prison=1,2&du=&au=) : partageables et conservés au rechargement
export const filtersFromSearch = (params: URLSearchParams): StatsFilters => {
  const fallback = presetRange("12M");
  const prisons = (params.get("prison") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  const du = params.get("du");
  const au = params.get("au");
  return {
    prisons,
    date_from: isValidIso(du) ? du : fallback.date_from,
    date_to: isValidIso(au) ? au : fallback.date_to,
  };
};

export const filtersToSearch = (filters: StatsFilters): Record<string, string> => {
  const out: Record<string, string> = { du: filters.date_from, au: filters.date_to };
  if (filters.prisons.length) out.prison = filters.prisons.join(",");
  return out;
};

export const matchingPreset = (filters: StatsFilters): PeriodPreset | null =>
  PERIOD_PRESETS.find(({ value }) => {
    const range = presetRange(value);
    return range.date_from === filters.date_from && range.date_to === filters.date_to;
  })?.value ?? null;

// Découpage de la période pour les courbes d'évolution : par mois jusqu'à 24 mois, puis par trimestre
// (jusqu'à 6 ans), puis par année : au plus 24 appels au backend.
// Chaque tranche est bornée par la période demandée (premier et dernier mois partiels).
export interface PeriodBucket {
  key: string;
  label: string;
  date_from: string;
  date_to: string;
}

export const MAX_MONTHLY_BUCKETS = 24;

const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });

export const periodBuckets = (date_from: string, date_to: string): PeriodBucket[] => {
  const from = parseIso(date_from);
  const to = parseIso(date_to);
  if (from > to) return [];
  const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1;
  const step = months <= MAX_MONTHLY_BUCKETS ? 1 : months <= 72 ? 3 : 12;
  // Tranches calendaires : on part du début du trimestre (ou de l'année) de la date de début
  let cursor = new Date(from.getFullYear(), from.getMonth() - (from.getMonth() % step), 1);
  const buckets: PeriodBucket[] = [];
  while (cursor <= to) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + step, 1);
    const start = cursor < from ? from : cursor;
    const lastDay = new Date(next.getFullYear(), next.getMonth(), 0);
    const end = lastDay > to ? to : lastDay;
    buckets.push({
      key: isoDate(cursor),
      label:
        step === 12
          ? String(cursor.getFullYear())
          : step === 3
            ? `T${Math.floor(cursor.getMonth() / 3) + 1} ${cursor.getFullYear()}`
            : MONTH.format(cursor),
      date_from: isoDate(start),
      date_to: isoDate(end),
    });
    cursor = next;
  }
  return buckets;
};

// Jour AAAA-MM-JJ affiché en date locale (sans décalage de fuseau)
export const formatDay = (value: string) => parseIso(value).toLocaleDateString("fr-FR");

export const formatPeriod = (date_from: string, date_to: string) => `du ${formatDay(date_from)} au ${formatDay(date_to)}`;

// Libellé de la granularité des courbes : « par mois », « par trimestre » ou « par année »
export const bucketUnitLabel = (date_from: string, date_to: string) => {
  const from = parseIso(date_from);
  const to = parseIso(date_to);
  const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1;
  return months <= MAX_MONTHLY_BUCKETS ? "par mois" : months <= 72 ? "par trimestre" : "par année";
};
