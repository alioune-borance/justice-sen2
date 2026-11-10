// features/visites/pages/visites/VisitePage.tsx
import React, { useMemo, useCallback } from 'react';
import { VisitTable } from '../../components/visite/VisitTable';
import { VisiteTableRow, visitorName } from '../../features/visites/types/visite';
import { useNavigate } from 'react-router-dom';
import { useGetVisites } from '../../features/visites/api/useGetVisite';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { Detenu } from '../../features/detenus/types/detenu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePermissions } from '../../features/auth/hooks/usePermissions';
import { Can } from '../../features/auth/components/Can';

export const VisiteListPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: visites = [], isLoading } = useGetVisites();
  const { data: detenusList = [] } = useGetDetenus();

  const getVisitorName = (visitor: visitorName) => visitor.name;

  const getDetenuName = (prisoner: number) => {
    const detenu = detenusList.find((d: Detenu) => d.id === prisoner);
    return detenu ? `${detenu.first_name} ${detenu.last_name}` : '';
  };

  const handleViewDetail = (id: number) => navigate(`/visits/${id}`);
  const handleEdit = (visite: VisiteTableRow) => navigate(`/visits/update/${visite.id}`);

  const tableRows: VisiteTableRow[] = useMemo(() => {
    return visites.map((visite) => ({
      ...visite,
      detenu_name: getDetenuName(visite.prisoner),
      visitor: getVisitorName(visite.visitor_name),
      visit_date: visite.visit_date,
      purpose: visite.purpose,
      status: visite.status,
    } as VisiteTableRow));
  }, [visites, detenusList]);

  const generateReport = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    // En-tête
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Rapport — Gestion des visites', 14, 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Administration Pénitentiaire du Sénégal  —  Généré le ${date}`, 14, 22);

    // Stats
    const total = tableRows.length;
    const scheduled = tableRows.filter(v => v.status?.toLowerCase() === 'scheduled').length;
    const completed = tableRows.filter(v => v.status?.toLowerCase() === 'completed').length;
    const cancelled = tableRows.filter(v => v.status?.toLowerCase() === 'cancelled').length;

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Statistiques des visites', 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Total des visites', String(total)],
        ['Programmées', String(scheduled)],
        ['Complétées', String(completed)],
        ['Annulées', String(cancelled)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'center', cellWidth: 25 } },
      margin: { left: 14, right: 14 },
    });

    const afterStats = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Liste des visites (${total})`, 14, afterStats);

    autoTable(doc, {
      startY: afterStats + 4,
      head: [['#', 'Détenu', 'Visiteur', 'Date', 'Début', 'Fin', 'Raison', 'Statut']],
      body: tableRows.map((v, i) => [
        i + 1,
        v.detenu_name,
        v.visitor,
        new Date(v.visit_date).toLocaleDateString('fr-FR'),
        new Date(v.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        new Date(v.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        v.purpose,
        v.status,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.section === 'body') {
          const val = (data.cell.raw as string)?.toLowerCase();
          if (val === 'cancelled') data.cell.styles.textColor = [185, 28, 28];
          else if (val === 'scheduled') data.cell.styles.textColor = [22, 101, 52];
          else if (val === 'completed') data.cell.styles.textColor = [100, 116, 139];
        }
      },
      margin: { left: 8, right: 8 },
      columnStyles: { 7: { fontStyle: 'bold' } },
    });

    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
      doc.text('Document confidentiel — Ne pas diffuser sans autorisation', 8, 290);
      doc.text(`Page ${p} / ${pageCount}`, 202, 290, { align: 'right' });
    }
    doc.save(`visites-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [tableRows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des visites</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={generateReport}
            disabled={isLoading || tableRows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Rapport PDF
          </button>
          <Can perm="visits:create">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => navigate('/visits/new')}
            >
              Nouvelle visite
            </button>
          </Can>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <VisitTable
          visites={tableRows}
          onViewDetail={handleViewDetail}
          onEdit={can('visits:update') ? handleEdit : undefined}
          loading={isLoading}
        />
      </div>
    </div>
  );
};