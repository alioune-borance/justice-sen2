import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Search, Stethoscope } from "lucide-react";
import { useGetHealthActivity } from "../../features/infirmerie/api/useGetInfirmerie";
import { HealthActivity } from "../../features/infirmerie/types/infirmerie";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { prisonerStatusLabel } from "../../features/detenus/types/detenu";
import { formatDate } from "../../shared/utils/dates";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const DAY = 24 * 60 * 60 * 1000;

interface PatientRow {
  prisoner: number;
  name: string;
  matricule: string | null;
  status: string;
  count: number;
  last: string;
}

// Infirmerie vue par l'administrateur et le superviseur de prison : qui est suivi et quand, jamais le contenu
// médical (pathologie, description), réservé au personnel de santé. Données : GET health-activity/.
export const InfirmerieActivitePage: React.FC = () => {
  const { can } = usePermissions();
  const { data: activity = [], isLoading, isError, error } = useGetHealthActivity(can("health_activity:read"));
  const [search, setSearch] = useState("");

  const patients: PatientRow[] = useMemo(() => {
    const byPrisoner = new Map<number, PatientRow>();
    activity.forEach((a: HealthActivity) => {
      const row = byPrisoner.get(a.prisoner);
      if (!row) {
        byPrisoner.set(a.prisoner, {
          prisoner: a.prisoner,
          name: a.prisoner_name,
          matricule: a.matricule_number,
          status: a.prisoner_status,
          count: 1,
          last: a.date_of_diagnosis,
        });
      } else {
        row.count += 1;
        if (a.date_of_diagnosis > row.last) row.last = a.date_of_diagnosis;
      }
    });
    return [...byPrisoner.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [activity]);

  const stats = useMemo(() => {
    const now = Date.now();
    const within = (days: number) =>
      activity.filter((a) => now - new Date(a.date_of_diagnosis).getTime() <= days * DAY).length;
    return { patients: patients.length, week: within(7), month: within(30) };
  }, [activity, patients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q) || (p.matricule ?? "").toLowerCase().includes(q));
  }, [patients, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-teal-100 rounded-lg p-2">
          <Stethoscope className="h-6 w-6 text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Infirmerie</h2>
      </div>

      <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <Lock className="h-4 w-4 shrink-0" />
        Secret médical : seuls les détenus suivis et les dates de prise en charge sont affichés. Les informations
        médicales sont réservées au personnel de santé.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Détenus suivis</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">{stats.patients}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Prises en charge (7 derniers jours)</p>
          <p className="mt-1 text-3xl font-bold text-teal-600">{stats.week}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Prises en charge (30 derniers jours)</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">{stats.month}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou matricule…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red-600">{getApiErrorMessages(error).join(" ")}</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Aucun détenu suivi par l'infirmerie.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Détenu</th>
                  <th className="pb-3 pr-4 font-medium">Matricule</th>
                  <th className="pb-3 pr-4 font-medium">Statut</th>
                  <th className="pb-3 pr-4 font-medium">Prises en charge</th>
                  <th className="pb-3 font-medium">Dernière prise en charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.prisoner} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">
                      <Link to={`/detenus/${p.prisoner}`} className="text-blue-700 hover:underline">{p.name}</Link>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">{p.matricule ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-700">{prisonerStatusLabel(p.status)}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                        {p.count}
                      </span>
                    </td>
                    <td className="py-3 text-gray-700">{formatDate(p.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
