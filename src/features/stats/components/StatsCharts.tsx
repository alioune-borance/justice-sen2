import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./StatsParts";
import { barChartHeight, CHART, SERIES_COLORS, TICK } from "../utils/chartTheme";

export interface Series {
  key: string;
  label: string;
  color: string;
}

const integerTicks = { allowDecimals: false, tick: TICK, axisLine: false, tickLine: false } as const;

// Répartition d'un total par catégorie : barres horizontales d'une seule couleur, triées
export const CategoryBars: React.FC<{
  data: { label: string; value: number }[];
  name: string;
  format?: (value: number) => string;
}> = ({ data, name, format }) => {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return (
    <div style={{ height: barChartHeight(sorted.length) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" {...integerTicks} tickFormatter={format} />
          <YAxis type="category" dataKey="label" width={190} tick={TICK} axisLine={{ stroke: CHART.axis }} tickLine={false} />
          <Tooltip cursor={{ fill: CHART.hover }} content={<ChartTooltip format={format} titleKey="label" />} />
          <Bar dataKey="value" name={name} fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Comparaison entre prisons : barres horizontales, empilées (parts d'un même total) ou groupées
export const PrisonBars: React.FC<{
  rows: object[];
  series: Series[];
  stacked?: boolean;
  format?: (value: number) => string;
  domainMax?: number;
  reference?: { value: number; label: string };
}> = ({ rows, series, stacked, format, domainMax, reference }) => {
  const perRow = stacked || series.length === 1 ? 36 : 22 * series.length + 12;
  return (
    <div style={{ height: barChartHeight(rows.length, perRow) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 8 }} barCategoryGap={8} barGap={2}>
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" {...integerTicks} tickFormatter={format}
            domain={domainMax !== undefined ? [0, (max: number) => Math.max(max, domainMax)] : undefined} />
          <YAxis type="category" dataKey="prison_nom" width={170} tick={TICK} axisLine={{ stroke: CHART.axis }} tickLine={false} />
          <Tooltip cursor={{ fill: CHART.hover }} content={<ChartTooltip format={format} titleKey="prison_nom" />} />
          {reference && (
            <ReferenceLine x={reference.value} stroke={CHART.critical} strokeDasharray="4 3"
              label={{ value: reference.label, position: "top", fill: CHART.tick, fontSize: 11 }} />
          )}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={stacked ? "total" : undefined}
              // 2 px de surface entre segments empilés ; bout arrondi sur le dernier segment seulement
              stroke={stacked ? CHART.surface : undefined} strokeWidth={stacked ? 1 : 0}
              radius={!stacked || i === series.length - 1 ? [0, 4, 4, 0] : 0}
              maxBarSize={stacked ? 22 : 16} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Évolution dans le temps (une tranche = un mois, un trimestre ou une année)
export const TimeLines: React.FC<{ rows: Record<string, string | number>[]; series: Series[] }> = ({ rows, series }) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="periode" tick={TICK} axisLine={{ stroke: CHART.axis }} tickLine={false} interval="preserveStartEnd" />
        <YAxis {...integerTicks} width={40} />
        <Tooltip cursor={{ stroke: CHART.axis }} content={<ChartTooltip />} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2}
            dot={rows.length <= 12 ? { r: 4, strokeWidth: 2, stroke: CHART.surface, fill: s.color } : false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: CHART.surface }} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Évolution des parts d'un total (colonnes empilées)
export const TimeStack: React.FC<{ rows: Record<string, string | number>[]; series: Series[] }> = ({ rows, series }) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="periode" tick={TICK} axisLine={{ stroke: CHART.axis }} tickLine={false} interval="preserveStartEnd" />
        <YAxis {...integerTicks} width={40} />
        <Tooltip cursor={{ fill: CHART.hover }} content={<ChartTooltip />} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId="total"
            stroke={CHART.surface} strokeWidth={1} radius={i === series.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={36} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </div>
);
