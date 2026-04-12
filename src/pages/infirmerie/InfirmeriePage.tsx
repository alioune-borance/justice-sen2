import React, { useState, useMemo, useCallback } from 'react';
import {
  Stethoscope,
  Search,
  Bell,
  Timer,
  Edit,
  X,
  HeartPulse,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { useGetInfirmeriePatients } from '../../features/infirmerie/api/useGetInfirmerie';
import { InfirmeriePatient, HealthRecord } from '../../features/infirmerie/types/infirmerie';

export const InfirmeriePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: allPatients = [], isLoading } = useGetInfirmeriePatients();

  const [searchTerm, setSearchTerm] = useState('');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Garder uniquement les détenus ayant au moins un dossier médical
  const patients: InfirmeriePatient[] = useMemo(
    () => allPatients.filter((p: InfirmeriePatient) => Array.isArray(p.health_records) && p.health_records.length > 0),
    [allPatients]
  );

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisWeek = patients.filter((p: InfirmeriePatient) =>
      p.health_records.some((r: HealthRecord) => {
        const days = (now.getTime() - new Date(r.date_diagnosis).getTime()) / (1000 * 60 * 60 * 24);
        return days <= 7;
      })
    ).length;
    return { total: patients.length, thisWeek };
  }, [patients]);

  // Filtered list
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const q = searchTerm.toLowerCase();
    return patients.filter((p: InfirmeriePatient) => {
      const name = `${p.first_name} ${p.last_name}`.toLowerCase();
      const matchesRecord = p.health_records.some(
        (r: HealthRecord) =>
          r.condition_medical.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
      return name.includes(q) || matchesRecord;
    });
  }, [patients, searchTerm]);

  // Alertes
  type AlertLevel = 'critique' | 'grave' | 'info';
  interface AlertItem { id: string; level: AlertLevel; title: string; message: string; icon: React.ReactNode; }

  const alerts: AlertItem[] = useMemo(() => {
    const now = new Date();
    const result: AlertItem[] = [];

    if (stats.thisWeek >= 3) {
      result.push({
        id: 'pic-semaine',
        level: 'info',
        title: 'Nouveaux cas cette semaine',
        message: `${stats.thisWeek} détenus ont été pris en charge médicalement au cours des 7 derniers jours.`,
        icon: <Bell className="h-5 w-5" />,
      });
    }

    const anciens = patients.filter((p: InfirmeriePatient) =>
      p.health_records.every((r: HealthRecord) => {
        const days = (now.getTime() - new Date(r.date_diagnosis).getTime()) / (1000 * 60 * 60 * 24);
        return days > 30;
      })
    );
    if (anciens.length > 0) {
      result.push({
        id: 'anciens',
        level: 'grave',
        title: 'Dossiers médicaux anciens',
        message: `${anciens.length} dossier${anciens.length > 1 ? 's' : ''} sans activité depuis plus de 30 jours.`,
        icon: <Timer className="h-5 w-5" />,
      });
    }

    const chronicPatients = patients.filter((p: InfirmeriePatient) => p.health_records.length >= 3);
    if (chronicPatients.length > 0) {
      const names = chronicPatients
        .slice(0, 3)
        .map((p: InfirmeriePatient) => `${p.first_name} ${p.last_name}`)
        .join(', ');
      result.push({
        id: 'chroniques',
        level: 'critique',
        title: 'Détenus à suivi médical intensif',
        message: `${chronicPatients.length} détenu${chronicPatients.length > 1 ? 's ont' : ' a'} 3 dossiers ou plus : ${names}${chronicPatients.length > 3 ? '…' : ''}.`,
        icon: <HeartPulse className="h-5 w-5" />,
      });
    }

    return result.filter((a) => !dismissedAlerts.has(a.id));
  }, [patients, stats.thisWeek, dismissedAlerts]);

  const dismissAlert = (id: string) =>
    setDismissedAlerts((prev) => new Set([...prev, id]));

  const generateReport = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Rapport — Infirmerie', 14, 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Administration Pénitentiaire du Sénégal  —  Généré le ${date}`, 14, 22);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Statistiques médicales', 14, 38);

    const chronicCount = patients.filter(p => p.health_records.length >= 3).length;
    autoTable(doc, {
      startY: 42,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Détenus avec dossier médical', String(stats.total)],
        ['Nouveaux cas cette semaine', String(stats.thisWeek)],
        ['Détenus à suivi intensif (≥ 3 dossiers)', String(chronicCount)],
        ['Résultats du filtre actif', String(filtered.length)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'center', cellWidth: 25 } },
      margin: { left: 14, right: 14 },
    });

    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(`Dossiers médicaux (${filtered.length})`, 14, y1);

    const rows: (string | number)[][] = [];
    filtered.forEach(p => {
      const sorted = [...p.health_records].sort(
        (a, b) => new Date(b.date_diagnosis).getTime() - new Date(a.date_diagnosis).getTime()
      );
      sorted.forEach((r, ri) => {
        rows.push([
          ri === 0 ? `${p.first_name} ${p.last_name}` : '',
          ri === 0 ? (p.matricule_number ?? '—') : '',
          r.condition_medical,
          new Date(r.date_diagnosis).toLocaleDateString('fr-FR'),
          r.description,
        ]);
      });
    });

    autoTable(doc, {
      startY: y1 + 4,
      head: [['Détenu', 'Matricule', 'Condition médicale', 'Date diagnostic', 'Description']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold' }, 4: { cellWidth: 60 } },
      margin: { left: 8, right: 8 },
      styles: { overflow: 'linebreak' },
    });

    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
      doc.text('Document confidentiel — Ne pas diffuser sans autorisation', 8, 290);
      doc.text(`Page ${p} / ${pageCount}`, 202, 290, { align: 'right' });
    }
    doc.save(`infirmerie-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [patients, filtered, stats]);

  const alertStyles: Record<AlertLevel, { container: string; icon: string; title: string; text: string }> = {
    critique: { container: 'bg-red-50 border-red-300',       icon: 'text-red-600 bg-red-100',       title: 'text-red-800',    text: 'text-red-700'    },
    grave:    { container: 'bg-orange-50 border-orange-300', icon: 'text-orange-600 bg-orange-100', title: 'text-orange-800', text: 'text-orange-700' },
    info:     { container: 'bg-teal-50 border-teal-300',     icon: 'text-teal-600 bg-teal-100',     title: 'text-teal-800',   text: 'text-teal-700'   },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 rounded-lg p-2">
            <Stethoscope className="h-6 w-6 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Infirmerie</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generateReport}
            disabled={isLoading || patients.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Rapport PDF
          </button>
          <button
            onClick={() => navigate('/infirmerie/new')}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            <Stethoscope className="h-4 w-4" />
            Nouveau dossier médical
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Détenus avec dossier médical</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Nouveaux cas cette semaine</p>
          <p className="text-3xl font-bold text-teal-600 mt-1">{stats.thisWeek}</p>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, condition médicale ou description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Stethoscope className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Aucun dossier médical trouvé</p>
            <p className="text-sm mt-1">Modifiez votre recherche ou attendez de nouvelles données.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 pr-4 font-medium text-gray-500">Détenu</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">Matricule</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">Nb. dossiers</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">Dernier diagnostic</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">Description</th>
                  <th className="pb-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((patient: InfirmeriePatient) => {
                  const sorted = [...patient.health_records].sort(
                    (a, b) => new Date(b.date_diagnosis).getTime() - new Date(a.date_diagnosis).getTime()
                  );
                  const latest = sorted[0];
                  return (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 font-mono text-xs">
                        {patient.matricule_number}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          {patient.health_records.length}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        <div className="font-medium text-gray-800">{latest.condition_medical}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(latest.date_diagnosis).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-xs truncate" title={latest.description}>
                        {latest.description}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => navigate(`/infirmerie/update/${patient.id}`)}
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
