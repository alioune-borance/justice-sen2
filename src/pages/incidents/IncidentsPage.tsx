import React, { useState, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AlertTriangle,
  Search,
  Bell,
  Timer,
  UserX,
  Edit,
  X,
  Zap,
  Users,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetIncidents, useAddDisciplinaryRecord, useDecideSanction } from '../../features/incidents/api/useGetIncident';
import { Incident, DisciplinaryRecord } from '../../features/incidents/types/incident';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { Detenu } from '../../features/detenus/types/detenu';
import { usePermissions } from '../../features/auth/hooks/usePermissions';
import { Can } from '../../features/auth/components/Can';
import { getApiErrorMessage } from '../../shared/api/errorMessages';

// ─── Types d'incidents rapides ────────────────────────────────────────────────
const QUICK_TYPES = [
  {
    id: 'mutinerie',
    label: 'Mutinerie',
    description: 'Rébellion collective contre l\'autorité pénitentiaire',
    color: 'bg-red-600 hover:bg-red-700',
    badge: 'bg-red-100 text-red-800',
    icon: '⚠️',
  },
  {
    id: 'bagarre',
    label: 'Bagarre générale',
    description: 'Affrontement physique impliquant plusieurs détenus',
    color: 'bg-orange-500 hover:bg-orange-600',
    badge: 'bg-orange-100 text-orange-800',
    icon: '👊',
  },
  {
    id: 'evasion',
    label: 'Évasion',
    description: 'Tentative ou réalisation d\'une évasion',
    color: 'bg-purple-600 hover:bg-purple-700',
    badge: 'bg-purple-100 text-purple-800',
    icon: '🚨',
  },
] as const;
type QuickTypeId = typeof QUICK_TYPES[number]['id'];

// ─── Page ────────────────────────────────────────────────────────────────────

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: allIncidents = [], isLoading } = useGetIncidents();
  const { data: detenus = [] } = useGetDetenus();
  const addRecord = useAddDisciplinaryRecord();
  const { can, isMyPrison } = usePermissions();
  const decideSanction = useDecideSanction();

  // Sanctions proposées en attente de validation, dans le périmètre d'écriture de l'utilisateur
  const pendingSanctions = useMemo(
    () =>
      can('disciplinary_records:validate')
        ? (allIncidents as Incident[]).flatMap((inc) =>
            isMyPrison(inc.prison)
              ? (inc.disciplinary_records ?? [])
                  .filter((r) => r.sanction_status === 'PROPOSED' && r.id != null)
                  .map((r) => ({ incident: inc, record: r }))
              : []
          )
        : [],
    [allIncidents, can, isMyPrison]
  );

  const handleDecideSanction = (prisonerId: number, recordId: number, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? window.prompt('Motif du refus (facultatif) :') : undefined;
    if (reason === null) return; // annulé
    decideSanction.mutate(
      { prisonerId, recordId, action, reason: reason || undefined },
      { onError: (error) => window.alert(getApiErrorMessage(error)) }
    );
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // ── Modal déclaration rapide ──
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'prisoners'>('type');
  const [selectedType, setSelectedType] = useState<QuickTypeId | null>(null);
  const [prisonerSearch, setPrisonerSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const openModal = () => {
    setStep('type');
    setSelectedType(null);
    setPrisonerSearch('');
    setSelectedIds(new Set());
    setModalOpen(true);
  };

  const chooseType = (id: QuickTypeId) => {
    setSelectedType(id);
    setStep('prisoners');
  };

  const togglePrisoner = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filteredDetenus = useMemo(() => {
    const q = prisonerSearch.toLowerCase();
    return (detenus as Detenu[]).filter(
      (d) =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
        d.matricule_number?.toLowerCase().includes(q)
    );
  }, [detenus, prisonerSearch]);

  const handleQuickSubmit = async () => {
    if (!selectedType || selectedIds.size === 0) return;
    const type = QUICK_TYPES.find((t) => t.id === selectedType)!;
    const today = new Date().toISOString().slice(0, 10);
    setSubmitting(true);
    try {
      await Promise.all(
        [...selectedIds].map((prisonerId) =>
          addRecord.mutateAsync({
            prisonerId,
            record: {
              infraction: type.label,
              description: `Incident de type "${type.label}" déclaré le ${new Date().toLocaleDateString('fr-FR')}.`,
              date_of_infraction: today,
            },
          })
        )
      );
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

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

  const generateReport = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Rapport — Incidents disciplinaires', 14, 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Administration Pénitentiaire du Sénégal  —  Généré le ${date}`, 14, 22);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Statistiques', 14, 38);

    const recidivistes = incidents.filter(i => i.disciplinary_records.length >= 3).length;
    autoTable(doc, {
      startY: 42,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Détenus avec dossier disciplinaire', String(stats.total)],
        ['Incidents cette semaine', String(stats.thisWeek)],
        ['Détenus récidivistes (≥ 3 infractions)', String(recidivistes)],
        ['Résultats du filtre actif', String(filtered.length)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'center', cellWidth: 25 } },
      margin: { left: 14, right: 14 },
    });

    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(`Dossiers disciplinaires (${filtered.length})`, 14, y1);

    const rows: (string | number)[][] = [];
    filtered.forEach(inc => {
      const sorted = [...inc.disciplinary_records].sort(
        (a, b) => new Date(b.date_of_infraction).getTime() - new Date(a.date_of_infraction).getTime()
      );
      sorted.forEach((r, ri) => {
        rows.push([
          ri === 0 ? `${inc.first_name} ${inc.last_name}` : '',
          ri === 0 ? (inc.matricule_number ?? '—') : '',
          r.infraction,
          new Date(r.date_of_infraction).toLocaleDateString('fr-FR'),
          r.description,
        ]);
      });
    });

    autoTable(doc, {
      startY: y1 + 4,
      head: [['Détenu', 'Matricule', 'Infraction', 'Date', 'Description']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
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
    doc.save(`incidents-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [incidents, filtered, stats]);

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
      {/* ── Modal déclaration rapide ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step === 'prisoners' && (
                  <button onClick={() => setStep('type')} className="text-slate-300 hover:text-white">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <Zap className="h-5 w-5 text-yellow-400" />
                <h3 className="text-white font-semibold">
                  {step === 'type' ? 'Déclaration rapide d\'incident' : `${QUICK_TYPES.find(t => t.id === selectedType)?.label} — Détenus concernés`}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Étape 1 — choix du type */}
              {step === 'type' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4">Sélectionnez le type d'incident à déclarer</p>
                  {QUICK_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => chooseType(t.id)}
                      className={`w-full text-left px-5 py-4 rounded-xl text-white font-semibold transition-colors ${t.color} flex items-center justify-between`}
                    >
                      <div>
                        <div className="flex items-center gap-2 text-base">
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </div>
                        <p className="text-xs font-normal opacity-80 mt-0.5">{t.description}</p>
                      </div>
                      <Users className="h-5 w-5 opacity-70 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Étape 2 — sélection des détenus */}
              {step === 'prisoners' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un détenu..."
                      value={prisonerSearch}
                      onChange={(e) => setPrisonerSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
                    {filteredDetenus.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-6">Aucun détenu trouvé</p>
                    ) : filteredDetenus.map((d: Detenu) => (
                      <label
                        key={d.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(d.id)}
                          onChange={() => togglePrisoner(d.id)}
                          className="accent-red-600 h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {d.first_name} {d.last_name}
                          </p>
                          {d.matricule_number && (
                            <p className="text-xs text-gray-400 font-mono">{d.matricule_number}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-gray-500">
                      {selectedIds.size > 0
                        ? `${selectedIds.size} détenu${selectedIds.size > 1 ? 's' : ''} sélectionné${selectedIds.size > 1 ? 's' : ''}`
                        : 'Aucun sélectionné'}
                    </p>
                    <button
                      onClick={handleQuickSubmit}
                      disabled={selectedIds.size === 0 || submitting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                      {submitting ? (
                        <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {submitting ? 'Déclaration...' : 'Déclarer l\'incident'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 rounded-lg p-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
            <h2 className="text-2xl font-bold text-slate-800">Incidents disciplinaires</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generateReport}
            disabled={isLoading || incidents.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Rapport PDF
          </button>
          <Can perm="disciplinary_records:create">
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
            >
              <Zap className="h-4 w-4" />
              Incident rapide
            </button>
            <button
              onClick={() => navigate('/incidents/new')}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <AlertTriangle className="h-4 w-4" />
              Signaler un incident
            </button>
          </Can>
        </div>
      </div>

      {/* Sanctions à valider (SUPERVISEUR / ADMIN de la prison) */}
      {pendingSanctions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
          <h3 className="text-base font-semibold text-amber-900">
            Sanctions à valider ({pendingSanctions.length})
          </h3>
          {pendingSanctions.map(({ incident, record }) => (
            <div key={record.id} className="flex items-center justify-between gap-4 bg-white rounded-lg border border-amber-100 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {incident.first_name} {incident.last_name} — {record.infraction}
                </p>
                <p className="text-sm text-gray-600 truncate" title={record.sanction}>
                  Sanction proposée : {record.sanction}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleDecideSanction(incident.id, record.id!, 'reject')}
                  disabled={decideSanction.isPending}
                  className="px-3 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm disabled:opacity-50"
                >
                  Refuser
                </button>
                <button
                  onClick={() => handleDecideSanction(incident.id, record.id!, 'approve')}
                  disabled={decideSanction.isPending}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                        <Can perm="disciplinary_records:update" when={isMyPrison(inc.prison)}>
                          <button
                            onClick={() => navigate(`/incidents/update/${inc.id}`)}
                            className="p-1 text-gray-500 hover:text-gray-800"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </Can>
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