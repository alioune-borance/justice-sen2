import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  Bell,
  Timer,
  UserX,
  Edit,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetIncidents } from '../../features/incidents/api/useGetIncident';
import { Incident, DisciplinaryRecord } from '../../features/incidents/types/incident';

// ─── Page ────────────────────────────────────────────────────────────────────

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: allIncidents = [], isLoading } = useGetIncidents();

  const [searchTerm, setSearchTerm] = useState('');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Garder uniquement les détenus ayant au moins un enregistrement disciplinaire
  const incidents: Incident[] = useMemo(
    () => allIncidents.filter((i: Incident) => Array.isArray(i.disciplinary_records) && i.disciplinary_records.length > 0),
    [allIncidents]
  );

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisWeek = incidents.filter((i: Incident) =>
      i.disciplinary_records.some((r: DisciplinaryRecord) => {
        const days = (now.getTime() - new Date(r.date_of_infraction).getTime()) / (1000 * 60 * 60 * 24);
        return days <= 7;
      })
    ).length;
    return { total: incidents.length, thisWeek };
  }, [incidents]);

  // Filtered list
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return incidents;
    const q = searchTerm.toLowerCase();
    return incidents.filter((inc: Incident) => {
      const name = `${inc.first_name} ${inc.last_name}`.toLowerCase();
      const matchesRecord = inc.disciplinary_records.some(
        (r: DisciplinaryRecord) =>
          r.infraction.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
      return name.includes(q) || matchesRecord;
    });
  }, [incidents, searchTerm]);

  // ── Alertes ──────────────────────────────────────────────────────────────
  type AlertLevel = 'critique' | 'grave' | 'info';
  interface AlertItem { id: string; level: AlertLevel; title: string; message: string; icon: React.ReactNode; }

  const alerts: AlertItem[] = useMemo(() => {
    const now = new Date();
    const result: AlertItem[] = [];

    // Incidents récents (≤ 7 jours)
    if (stats.thisWeek >= 3) {
      result.push({
        id: 'pic-semaine',
        level: 'info',
        title: "Pic d'incidents cette semaine",
        message: `${stats.thisWeek} détenus ont eu un incident disciplinaire au cours des 7 derniers jours.`,
        icon: <Bell className="h-5 w-5" />,
      });
    }

    // Dossiers anciens (> 30 jours sans activité récente)
    const anciens = incidents.filter((i: Incident) =>
      i.disciplinary_records.every((r: DisciplinaryRecord) => {
        const days = (now.getTime() - new Date(r.date_of_infraction).getTime()) / (1000 * 60 * 60 * 24);
        return days > 30;
      })
    );
    if (anciens.length > 0) {
      result.push({
        id: 'anciens',
        level: 'grave',
        title: 'Dossiers disciplinaires anciens',
        message: `${anciens.length} dossier${anciens.length > 1 ? 's' : ''} sans activité depuis plus de 30 jours.`,
        icon: <Timer className="h-5 w-5" />,
      });
    }

    // Récidivistes (≥ 3 enregistrements)
    const recidivistes = incidents.filter((i: Incident) => i.disciplinary_records.length >= 3);
    if (recidivistes.length > 0) {
      const names = recidivistes
        .slice(0, 3)
        .map((i: Incident) => `${i.first_name} ${i.last_name}`)
        .join(', ');
      result.push({
        id: 'recidivistes',
        level: 'critique',
        title: 'Détenus à profil disciplinaire élevé',
        message: `${recidivistes.length} détenu${recidivistes.length > 1 ? 's ont' : ' a'} 3 enregistrements ou plus : ${names}${recidivistes.length > 3 ? '…' : ''}.`,
        icon: <UserX className="h-5 w-5" />,
      });
    }

    return result.filter((a) => !dismissedAlerts.has(a.id));
  }, [incidents, stats.thisWeek, dismissedAlerts]);

  const dismissAlert = (id: string) =>
    setDismissedAlerts((prev) => new Set([...prev, id]));

  const alertStyles: Record<AlertLevel, { container: string; icon: string; title: string; text: string }> = {
    critique: { container: 'bg-red-50 border-red-300',    icon: 'text-red-600 bg-red-100',    title: 'text-red-800',    text: 'text-red-700'    },
    grave:    { container: 'bg-orange-50 border-orange-300', icon: 'text-orange-600 bg-orange-100', title: 'text-orange-800', text: 'text-orange-700' },
    info:     { container: 'bg-blue-50 border-blue-300',   icon: 'text-blue-600 bg-blue-100',   title: 'text-blue-800',   text: 'text-blue-700'   },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 rounded-lg p-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
            <h2 className="text-2xl font-bold text-slate-800">Incidents disciplinaires</h2>
        </div>
        <button
          onClick={() => navigate('/incidents/new')}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <AlertTriangle className="h-4 w-4" />
          Signaler un incident
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Détenus avec dossier disciplinaire</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Incidents cette semaine</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{stats.thisWeek}</p>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, infraction ou description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Aucun dossier disciplinaire trouvé</p>
            <p className="text-sm mt-1">Modifiez votre recherche ou attendez de nouvelles données.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 pr-4 font-medium text-gray-500">Détenu</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">Matricule</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">Nb. infractions</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">Dernière infraction</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">Description</th>
                  <th className="pb-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inc: Incident) => {
                  // Trier par date décroissante pour afficher la plus récente
                  const sorted = [...inc.disciplinary_records].sort(
                    (a, b) => new Date(b.date_of_infraction).getTime() - new Date(a.date_of_infraction).getTime()
                  );
                  const latest = sorted[0];
                  return (
                    <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {inc.first_name} {inc.last_name}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 font-mono text-xs">
                        {inc.matricule_number}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {inc.disciplinary_records.length}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        <div className="font-medium text-gray-800">{latest.infraction}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(latest.date_of_infraction).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-xs truncate" title={latest.description}>
                        {latest.description}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => navigate(`/incidents/update/${inc.id}`)}
                          className="p-1 text-gray-500 hover:text-gray-800"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-600" />
            <h3 className="text-base font-semibold text-slate-700">Alertes ({alerts.length})</h3>
          </div>
          {alerts.map((alert) => {
            const s = alertStyles[alert.level];
            return (
              <div key={alert.id} className={`flex items-start gap-4 border rounded-lg p-4 ${s.container}`}>
                <div className={`rounded-lg p-2 shrink-0 ${s.icon}`}>{alert.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${s.title}`}>{alert.title}</p>
                  <p className={`text-sm mt-0.5 ${s.text}`}>{alert.message}</p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  title="Ignorer cette alerte"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};