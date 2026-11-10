import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, Eye, Gavel, Scale, Users } from "lucide-react";
import { useGetDetenus } from "../../features/detenus/api/useGetDetenu";
import { useGetPrisons } from "../../features/prisons/api/useGetPrison";
import { useRole } from "../../features/auth/hooks/useRole";
import { Detenu } from "../../features/detenus/types/detenu";
import { Prison } from "../../features/prisons/types/prison";

// Statuts « présents » : le détenu occupe une place dans l'établissement
const PRESENT_STATUSES = ["Prévenu", "Condamné"];

// Couleur de série unique (palette de référence, emplacement 1) ; textes en encre neutre
const SERIES_COLOR = "#2a78d6";
const GRID_COLOR = "#e5e7eb";
const AXIS_TEXT = "#52514e";

interface PrisonRow {
  id: number;
  name: string;
  present: number;
  capacity: number | null;
}

// Vue nationale en lecture seule des représentants des ministères (Justice, Intérieur).
// Aucune action : uniquement des agrégats calculés à partir des listes que le backend autorise.
export const NationalDashboard: React.FC = () => {
  const { label } = useRole();
  const { data: detenus = [], isLoading: loadingDetenus, isError: errorDetenus } = useGetDetenus();
  const { data: prisons = [], isLoading: loadingPrisons } = useGetPrisons();

  const stats = useMemo(() => {
    const list = detenus as Detenu[];
    const count = (status: string) => list.filter((d) => d.status === status).length;
    return {
      present: list.filter((d) => PRESENT_STATUSES.includes(d.status)).length,
      prevenus: count("Prévenu"),
      condamnes: count("Condamné"),
    };
  }, [detenus]);

  const rows: PrisonRow[] = useMemo(() => {
    const byPrison = new Map<number, number>();
    (detenus as Detenu[])
      .filter((d) => PRESENT_STATUSES.includes(d.status))
      .forEach((d) => byPrison.set(d.prison, (byPrison.get(d.prison) ?? 0) + 1));
    return (prisons as Prison[])
      .map((p) => ({ id: p.id, name: p.name, present: byPrison.get(p.id) ?? 0, capacity: p.capacity ?? null }))
      .sort((a, b) => b.present - a.present);
  }, [detenus, prisons]);

  const totalCapacity = rows.reduce((sum, r) => sum + (r.capacity ?? 0), 0);
  const occupancy = totalCapacity > 0 ? Math.round((stats.present / totalCapacity) * 100) : null;

  if (loadingDetenus || loadingPrisons) {
    return <p className="text-gray-500">Chargement des données nationales…</p>;
  }
  if (errorDetenus) {
    return <p className="text-red-600">Impossible de charger les données nationales.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vue nationale</h2>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
          <Eye className="h-4 w-4" /> Lecture seule
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={Building2} title="Établissements" value={rows.length} />
        <KpiTile icon={Users} title="Détenus présents" value={stats.present}
          hint={occupancy !== null ? `Taux d'occupation : ${occupancy} %` : undefined} />
        <KpiTile icon={Scale} title="Prévenus" value={stats.prevenus} />
        <KpiTile icon={Gavel} title="Condamnés" value={stats.condamnes} />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800">Détenus présents par établissement</h3>
        <p className="mb-4 text-sm text-gray-500">Prévenus et condamnés, tous établissements</p>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun établissement.</p>
        ) : (
          <div style={{ height: Math.max(220, rows.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barCategoryGap={10}>
                <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fill: AXIS_TEXT, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(42,120,214,0.08)" }} content={<PrisonTooltip />} />
                <Bar dataKey="present" name="Détenus présents" fill={SERIES_COLOR} radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Vue tableau : mêmes données, lisible sans le graphique */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Détail par établissement</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 pr-4 font-medium">Établissement</th>
              <th className="pb-2 pr-4 text-right font-medium">Présents</th>
              <th className="pb-2 pr-4 text-right font-medium">Capacité</th>
              <th className="pb-2 text-right font-medium">Occupation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-2 pr-4 text-gray-900">{r.name}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.present}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.capacity ?? "—"}</td>
                <td className="py-2 text-right tabular-nums">
                  {r.capacity ? `${Math.round((r.present / r.capacity) * 100)} %` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

const KpiTile: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; value: number; hint?: string }> = ({
  icon: Icon,
  title,
  value,
  hint,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <p className="mt-2 text-3xl font-bold tabular-nums text-slate-800">{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

interface TooltipProps {
  active?: boolean;
  payload?: { payload: PrisonRow }[];
}

const PrisonTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-gray-900">{row.name}</p>
      <p className="text-gray-700">
        <span className="mr-2 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SERIES_COLOR }} />
        {row.present} présents
      </p>
      {row.capacity ? <p className="text-gray-500">Capacité : {row.capacity}</p> : null}
    </div>
  );
};
