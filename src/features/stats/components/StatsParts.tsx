import React, { useEffect, useRef, useState } from "react";
import { BarChart3, Building2, ChevronDown, Eye, Info, Table2 } from "lucide-react";
import { StatsFilters, StatsPrison } from "../types/stats";
import { formatDay, formatPeriod, matchingPreset, PERIOD_PRESETS, presetRange } from "../utils/periods";
import { formatNumber, formatRatio } from "../utils/chartTheme";

// ── En-tête ────────────────────────────────────────────────────────────────────────────────────
export const StatsHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
      <Eye className="h-4 w-4" /> Lecture seule
    </span>
  </div>
);

// ── Filtres (une ligne, appliqués à tout le tableau de bord) ──────────────────────────────────
interface FiltersBarProps {
  filters: StatsFilters;
  prisons: StatsPrison[];
  onChange: (filters: StatsFilters) => void;
  fetching?: boolean;
}

export const StatsFiltersBar: React.FC<FiltersBarProps> = ({ filters, prisons, onChange, fetching }) => {
  const preset = matchingPreset(filters);
  const [from, setFrom] = useState(filters.date_from);
  const [to, setTo] = useState(filters.date_to);

  // Resynchronise les champs quand les filtres changent ailleurs (préréglage, URL)
  useEffect(() => {
    setFrom(filters.date_from);
    setTo(filters.date_to);
  }, [filters.date_from, filters.date_to]);

  const invalidRange = !!from && !!to && from > to;
  const applyDates = (nextFrom: string, nextTo: string) => {
    if (nextFrom && nextTo && nextFrom <= nextTo) onChange({ ...filters, date_from: nextFrom, date_to: nextTo });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <PrisonPicker
        prisons={prisons}
        selected={filters.prisons}
        onChange={(ids) => onChange({ ...filters, prisons: ids })}
      />

      <div className="flex flex-wrap gap-1" role="group" aria-label="Période">
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={preset === p.value}
            onClick={() => onChange({ ...filters, ...presetRange(p.value) })}
            className={`rounded-full px-3 py-1.5 text-sm ${
              preset === p.value ? "bg-slate-800 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Du</span>
        <input type="date" value={from} max={to || undefined}
          onChange={(e) => { setFrom(e.target.value); applyDates(e.target.value, to); }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Au</span>
        <input type="date" value={to} min={from || undefined}
          onChange={(e) => { setTo(e.target.value); applyDates(from, e.target.value); }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
      </label>

      <p className="ml-auto text-xs text-gray-500" aria-live="polite">
        {invalidRange ? (
          <span className="text-red-600">La date de début est postérieure à la date de fin.</span>
        ) : fetching ? (
          "Mise à jour…"
        ) : (
          `Période ${formatPeriod(filters.date_from, filters.date_to)}`
        )}
      </p>
    </div>
  );
};

const PrisonPicker: React.FC<{ prisons: StatsPrison[]; selected: number[]; onChange: (ids: number[]) => void }> = ({
  prisons,
  selected,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const summary =
    selected.length === 0
      ? "Toutes les prisons"
      : selected.length === 1
        ? prisons.find((p) => p.id === selected[0])?.nom ?? "1 prison"
        : `${selected.length} prisons`;

  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id].sort((a, b) => a - b));

  return (
    <div className="relative" ref={ref}>
      <span className="mb-1 block text-xs font-medium text-gray-600">Établissements</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex min-w-[14rem] items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50">
        <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" />{summary}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-72 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg" role="listbox" aria-multiselectable>
          <button type="button" onClick={() => onChange([])}
            className="mb-1 w-full rounded px-2 py-1.5 text-left text-sm text-blue-700 hover:bg-gray-50">
            Toutes les prisons
          </button>
          {prisons.length === 0 && <p className="px-2 py-1.5 text-sm text-gray-500">Aucune prison.</p>}
          {prisons.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50">
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
              <span className="text-gray-800">{p.nom}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Chiffres clés ──────────────────────────────────────────────────────────────────────────────
interface KpiTileProps {
  title: string;
  value: string;
  hint?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  // Stock : valeur à la date du jour, la période ne s'applique pas
  stock?: boolean;
  alert?: React.ReactNode;
}

export const KpiTile: React.FC<KpiTileProps> = ({ title, value, hint, icon: Icon, stock, alert }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <Icon className="h-5 w-5 flex-shrink-0 text-gray-400" />
    </div>
    <p className="mt-2 text-3xl font-bold tabular-nums text-slate-800">{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    {alert && <p className="mt-1 text-xs font-medium text-red-700">{alert}</p>}
    <p className="mt-2 text-[11px] uppercase tracking-wide text-gray-400">{stock ? "À ce jour" : "Sur la période"}</p>
  </div>
);

// ── Carte de graphique : titre, définition, graphique ou tableau ──────────────────────────────
interface ChartCardProps {
  title: string;
  subtitle?: string;
  definition?: string;
  legend?: { label: string; color: string }[];
  table: React.ReactNode;
  children: React.ReactNode;
  empty?: boolean;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, definition, legend, table, children, empty, className }) => {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${className ?? ""}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 font-semibold text-slate-800">
            {title}
            {definition && (
              <span title={definition} aria-label={definition} className="cursor-help text-gray-400">
                <Info className="h-4 w-4" />
              </span>
            )}
          </h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <button type="button" onClick={() => setAsTable((t) => !t)} aria-pressed={asTable}
          className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">
          {asTable ? <><BarChart3 className="h-3.5 w-3.5" /> Graphique</> : <><Table2 className="h-3.5 w-3.5" /> Tableau</>}
        </button>
      </div>
      {empty ? (
        <p className="py-8 text-center text-sm text-gray-500">Aucune donnée pour ces filtres.</p>
      ) : asTable ? (
        <div className="overflow-x-auto">{table}</div>
      ) : (
        <>
          {legend && legend.length > 1 && <SeriesLegend items={legend} />}
          {children}
        </>
      )}
    </section>
  );
};

export const SeriesLegend: React.FC<{ items: { label: string; color: string }[] }> = ({ items }) => (
  <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-700">
    {items.map((item) => (
      <li key={item.label} className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
        {item.label}
      </li>
    ))}
  </ul>
);

// ── Info-bulle des graphiques ──────────────────────────────────────────────────────────────────
interface TooltipEntry {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  format?: (value: number) => string;
  // Ligne d'en-tête lue dans la donnée (ex. nom de la prison en barres horizontales)
  titleKey?: string;
  footer?: (row: Record<string, unknown>) => React.ReactNode;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, label, payload, format, titleKey, footer }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload ?? {};
  const title = titleKey ? String(row[titleKey] ?? label ?? "") : String(label ?? "");
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-gray-900">{title}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-2 text-gray-700">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums text-gray-900">
            {typeof entry.value === "number" ? (format ? format(entry.value) : entry.value.toLocaleString("fr-FR")) : "—"}
          </span>
        </p>
      ))}
      {footer && <div className="mt-1 text-xs text-gray-500">{footer(row)}</div>}
    </div>
  );
};

// ── Tableau simple (vue tableau des graphiques) ────────────────────────────────────────────────
export interface Column<T> {
  label: string;
  value: (row: T) => React.ReactNode;
  numeric?: boolean;
}

export function DataTable<T>({ columns, rows, rowKey, footer }: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  footer?: React.ReactNode[];
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-500">
          {columns.map((c) => (
            <th key={c.label} className={`pb-2 pr-4 font-medium ${c.numeric ? "text-right" : ""}`}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((c) => (
              <td key={c.label} className={`py-2 pr-4 ${c.numeric ? "text-right tabular-nums" : "text-gray-900"}`}>{c.value(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer && (
        <tfoot>
          <tr className="border-t border-gray-300 font-medium">
            {footer.map((cell, i) => (
              <td key={i} className={`py-2 pr-4 ${columns[i]?.numeric ? "text-right tabular-nums" : ""}`}>{cell}</td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );
}

// ── États de chargement ────────────────────────────────────────────────────────────────────────
export const StatsMessage: React.FC<{ tone?: "info" | "error"; children: React.ReactNode }> = ({ tone = "info", children }) => (
  <div className={`rounded-lg border p-4 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-500"}`}>
    {children}
  </div>
);

// Courbes d'évolution : chargement et erreur propres (un appel par tranche)
export const SeriesState: React.FC<{ loading: boolean; error: boolean; children: React.ReactNode }> = ({ loading, error, children }) =>
  error ? (
    <p className="py-8 text-center text-sm text-red-600">Impossible de charger l'évolution.</p>
  ) : loading ? (
    <p className="py-8 text-center text-sm text-gray-500">Chargement de l'évolution…</p>
  ) : (
    <>{children}</>
  );

// Vue tableau d'une répartition (catégorie, nombre, part)
export const RepartitionTable: React.FC<{ items: { label: string; total: number }[]; total: number }> = ({ items, total }) => (
  <DataTable rows={items} rowKey={(r) => r.label}
    columns={[
      { label: "Catégorie", value: (r) => r.label },
      { label: "Nombre", numeric: true, value: (r) => formatNumber(r.total) },
      { label: "Part", numeric: true, value: (r) => (total ? formatRatio(r.total / total) : "—") },
    ]}
    footer={["Total", formatNumber(total), total ? "100 %" : "—"]} />
);

// Vue tableau d'une évolution : une ligne par tranche (lignes avec `du` et `au`)
export const EvolutionTable: React.FC<{
  rows: Record<string, string | number>[];
  series: { key: string; label: string; color?: string }[];
}> = ({ rows, series }) => (
  <DataTable rows={rows} rowKey={(r) => String(r.du)}
    columns={[
      { label: "Période", value: (r) => `${formatDay(String(r.du))} – ${formatDay(String(r.au))}` },
      ...series.map((s) => ({ label: s.label, numeric: true, value: (r: Record<string, string | number>) => formatNumber(Number(r[s.key])) })),
    ]}
    footer={["Total", ...series.map((s) => formatNumber(rows.reduce((sum, r) => sum + Number(r[s.key] ?? 0), 0)))]} />
);
