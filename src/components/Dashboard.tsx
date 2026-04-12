import React, { useMemo, useCallback } from 'react';
import {
  Users,
  Building,
  Calendar,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Gavel,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useGetDetenus } from '../features/detenus/api/useGetDetenu';
import { useGetPrisons } from '../features/prisons/api/useGetPrison';
import { useGetVisites } from '../features/visites/api/useGetVisite';
import { Detenu } from '../features/detenus/types/detenu';
import { Prison } from '../features/prisons/types/prison';
import { Visite } from '../features/visites/types/visite';

// ─── Stat card ───────────────────────────────────────────────────────────────

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  highlight?: boolean;
  urgent?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  highlight,
  urgent,
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  const cardBg = urgent
    ? 'bg-red-50 border-red-400'
    : highlight
    ? 'bg-amber-50 border-amber-300'
    : 'bg-white border-gray-200';

  const titleColor = urgent ? 'text-red-700' : highlight ? 'text-amber-700' : 'text-gray-600';
  const valueColor = urgent ? 'text-red-900' : highlight ? 'text-amber-800' : 'text-slate-800';
  const iconBg = urgent ? 'bg-red-100' : highlight ? 'bg-amber-100' : 'bg-blue-50';
  const iconColor = urgent ? 'text-red-600' : highlight ? 'text-amber-600' : 'text-blue-600';

  return (
    <div className={`rounded-lg shadow-md p-6 border ${cardBg}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${titleColor}`}>{title}</p>
          <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
          {urgent && (
            <div className="flex items-center mt-2 text-red-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm font-semibold">Urgence</span>
            </div>
          )}
          {!urgent && trend && trendValue && (
            <div className={`flex items-center mt-2 ${getTrendColor()}`}>
              <TrendIcon className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconBg}`}>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const daysSince = (dateStr: string): number => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const formatDuration = (days: number): string => {
  if (days < 30) return `${days} j`;
  const months = Math.floor(days / 30);
  const rem = days % 30;
  if (months < 12) return rem > 0 ? `${months} mois ${rem} j` : `${months} mois`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years} an${years > 1 ? 's' : ''} ${remMonths} mois` : `${years} an${years > 1 ? 's' : ''}`;
};

const urgencyBadge = (days: number): { label: string; className: string } => {
  if (days >= 365) return { label: 'Critique', className: 'bg-red-100 text-red-700' };
  if (days >= 180) return { label: 'Urgent', className: 'bg-orange-100 text-orange-700' };
  if (days >= 90) return { label: 'Élevé', className: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Normal', className: 'bg-green-100 text-green-700' };
};

// ─── Static charts (unchanged) ───────────────────────────────────────────────

const CrimeChart = () => {
  const crimeData = [
    { type: 'Vol', percentage: 35, color: 'bg-blue-500' },
    { type: 'Trafic de drogue', percentage: 28, color: 'bg-red-500' },
    { type: 'Violence', percentage: 20, color: 'bg-yellow-500' },
    { type: 'Fraude', percentage: 12, color: 'bg-green-500' },
    { type: 'Autres', percentage: 5, color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Répartition des types de crimes</h3>
      <div className="space-y-4">
        {crimeData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${item.color}`} />
              <span className="text-sm font-medium text-gray-700">{item.type}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-600">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const { data: detenus = [], isLoading } = useGetDetenus();
  const { data: prisons = [] } = useGetPrisons();
  const { data: visites = [] } = useGetVisites();

  const now = new Date();

  // Visites de la semaine courante (lundi → dimanche)
  const visitesThisWeek = useMemo(() => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // lundi
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // dimanche
    endOfWeek.setHours(23, 59, 59, 999);
    return visites.filter((v: Visite) => {
      const d = new Date(v.visit_date);
      return d >= startOfWeek && d <= endOfWeek;
    }).length;
  }, [visites, now]);

  // Prisonniers en attente de jugement (Prévenu)
  const prevenus: Detenu[] = useMemo(
    () => detenus.filter((d: Detenu) => d.status === 'Prévenu'),
    [detenus]
  );


  // Top 10 : triés par durée d'attente décroissante
  const top10: (Detenu & { waitDays: number })[] = useMemo(() => {
    return prevenus
      .map((d: Detenu) => ({ ...d, waitDays: daysSince(d.incarceration_date) }))
      .sort((a, b) => b.waitDays - a.waitDays)
      .slice(0, 10);
  }, [prevenus]);


  const getPrisonName = (prisonId: number): string => {
    const prison = prisons.find((p: Prison) => p.id === prisonId);
    return prison?.name ?? `Prison #${prisonId}`;
  };

  const totalDetenus = detenus.length;
  const condamnes = detenus.filter((d: Detenu) => d.status === 'Condamné').length;
  const liberes = detenus.filter((d: Detenu) => d.status === 'Libéré').length;

  // Libérations ce mois
  // const now = new Date();
  // const liberationsThisMonth = detenus.filter((d: Detenu) => {
  //   const r = new Date(d.release_date);
  //   return r.getFullYear() === now.getFullYear() && r.getMonth() === now.getMonth();
  // }).length;


  // Admissions ce mois
  const admissionsThisMonth = detenus.filter((d: Detenu) => {
    const i = new Date(d.incarceration_date);
    return i.getFullYear() === now.getFullYear() && i.getMonth() === now.getMonth();
  }).length;

  const prison = prisons.filter((p: Prison) => p.name === 'Reubeuss');
  //let capacity = prison[0]!.capacity;
  let capacity = 34
  const tauxOccupation = Math.round((totalDetenus / capacity) * 100);

  const generateReport = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    // En-tête
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de Tableau de Bord', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Administration Pénitentiaire du Sénégal  —  Généré le ${date}`, 14, 22);

    // Statistiques générales
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques générales', 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Détenus total', String(totalDetenus)],
        ['Condamnés', String(condamnes)],
        ['En attente de jugement', String(prevenus.length)],
        ["Taux d'occupation", `${tauxOccupation}%`],
        ['Libérations', String(liberes)],
        ['Admissions ce mois', String(admissionsThisMonth)],
        ['Visites cette semaine', String(visitesThisWeek)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'center' } },
      margin: { left: 14, right: 14 },
    });

    // Top 10 prévenus
    const afterStats = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Top 10 — Prévenus prioritaires (détention provisoire)', 14, afterStats);

    autoTable(doc, {
      startY: afterStats + 4,
      head: [['#', 'Nom complet', 'Matricule', 'Établissement', 'Incarcéré le', 'Durée', 'Priorité']],
      body: top10.map((d, i) => [
        i + 1,
        `${d.first_name} ${d.last_name}`,
        d.matricule_number ?? '—',
        getPrisonName(d.prison),
        new Date(d.incarceration_date).toLocaleDateString('fr-FR'),
        formatDuration(d.waitDays),
        urgencyBadge(d.waitDays).label,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const val = data.cell.raw as string;
          if (val === 'Critique') data.cell.styles.textColor = [185, 28, 28];
          else if (val === 'Urgent') data.cell.styles.textColor = [194, 65, 12];
          else if (val === 'Élevé') data.cell.styles.textColor = [146, 64, 14];
          else data.cell.styles.textColor = [22, 101, 52];
        }
      },
      margin: { left: 14, right: 14 },
    });

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Document confidentiel — Ne pas diffuser sans autorisation', 14, 290);
      doc.text(`Page ${p} / ${pageCount}`, 196, 290, { align: 'right' });
    }

    doc.save(`rapport-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [totalDetenus, condamnes, prevenus, tauxOccupation, liberes, admissionsThisMonth, visitesThisWeek, top10, getPrisonName]);

  return (
    <div className="space-y-6">
      {/* ── En-tête + bouton rapport ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Tableau de bord</h2>
        <button
          onClick={generateReport}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileText className="h-4 w-4" />
          <span>Générer le rapport PDF</span>
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Détenus total"
          value={isLoading ? '...' : totalDetenus}
          icon={Users}
        />
        <StatsCard
          title="Condamnés"
          value={isLoading ? '...' : condamnes}
          icon={UserCheck}
        />
        <StatsCard
          title="En attente de jugement"
          value={isLoading ? '...' : prevenus.length}
          icon={AlertTriangle}
          urgent
        />
        <StatsCard
          title="Taux d'occupation"
          value={isLoading ? '—' : `${tauxOccupation}%`}
          icon={Building}
          trend={tauxOccupation > 100 ? 'down' : 'stable'}
          trendValue={tauxOccupation > 100 ? 'Suroccupé' : undefined}
        />
        <StatsCard
          title="Nombre de libérations"
          value={isLoading ? '...' : liberes}
          icon={UserCheck}
        />
        <StatsCard
          title="Admissions ce mois"
          value={isLoading ? '...' : admissionsThisMonth}
          icon={Users}
        />
        <StatsCard
          title="Visites de la semaine"
          value={isLoading ? '...' : visitesThisWeek}
          icon={Calendar}
        />
      </div>

      {/* ── En attente de jugement — bannière ── */}
      {!isLoading && prevenus.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 flex items-start gap-4">
          <div className="bg-amber-100 rounded-lg p-2 shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-800 text-base">
              {prevenus.length} prisonnier{prevenus.length > 1 ? 's' : ''} en attente de jugement
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Dont {top10.filter(d => d.waitDays >= 365).length} en situation critique (≥ 1 an de détention provisoire).
              Durée moyenne d'attente&nbsp;:&nbsp;
              <strong>
                {formatDuration(
                  Math.round(
                    prevenus
                      .map((d: Detenu) => daysSince(d.incarceration_date))
                      .reduce((a, b) => a + b, 0) / prevenus.length
                  )
                )}
              </strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Top 10 prioritaires ── */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-gray-200">
          <div className="bg-amber-100 rounded-lg p-2">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Top 10 — Prisonniers prioritaires pour jugement
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Classés par durée de détention provisoire décroissante
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : top10.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Gavel className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Aucun prévenu en attente de jugement</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-gray-500 w-10">#</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Détenu</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Matricule</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Établissement</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Incarcéré le</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Durée d'attente</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Priorité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {top10.map((detenu, index) => {
                  const badge = urgencyBadge(detenu.waitDays);
                  return (
                    <tr
                      key={detenu.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index === 0 ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            index === 0
                              ? 'bg-red-600 text-white'
                              : index < 3
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {detenu.first_name} {detenu.last_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {detenu.matricule_number}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getPrisonName(detenu.prison)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(detenu.incarceration_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {formatDuration(detenu.waitDays)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Charts + Alertes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CrimeChart />

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Alertes récentes</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Incident sécuritaire — Prison de Reubeuss</p>
                <p className="text-xs text-red-600">Il y a 2 heures</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Surpopulation détectée — Prison de Reubeuss</p>
                <p className="text-xs text-yellow-600">Il y a 4 heures</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Nouvelle demande de grâce présidentielle</p>
                <p className="text-xs text-blue-600">Il y a 6 heures</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
