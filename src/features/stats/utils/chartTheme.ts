// Palette des graphiques (palette de référence validée, mode clair) : séries dans un ordre fixe,
// textes en encre neutre, jamais dans la couleur d'une série. Les couleurs d'état (bon, alerte…)
// ne servent jamais de couleur de série.
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"] as const;
export const CHART = {
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  tick: "#52514e",
  muted: "#898781",
  surface: "#ffffff",
  critical: "#d03b3b",
  hover: "rgba(42,120,214,0.08)",
} as const;

export const TICK = { fill: CHART.tick, fontSize: 12 } as const;

const NUMBER = new Intl.NumberFormat("fr-FR");
const DECIMAL = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export const formatNumber = (value: number | null | undefined) => (value == null ? "—" : NUMBER.format(value));

// Ratio du backend (0,85) → « 85 % »
export const formatRatio = (value: number | null | undefined) =>
  value == null ? "—" : `${DECIMAL.format(value * 100)} %`;

export const formatDays = (value: number | null | undefined) =>
  value == null ? "—" : `${DECIMAL.format(value)} j`;

// Hauteur d'un graphique en barres horizontales selon le nombre de catégories
export const barChartHeight = (rows: number, perRow = 36) => Math.max(200, rows * perRow + 40);
