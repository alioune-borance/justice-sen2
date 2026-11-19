import React, { useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TransfertTable } from '../../components/transfert/TransfertTable';
import { TransfertTableRow } from '../../features/transferts/types/transfert';
import { useNavigate } from 'react-router-dom';
import { useGetTransferts, useTransfertDecision } from '../../features/transferts/api/useGetTransfert';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { Detenu } from '../../features/detenus/types/detenu';
import { useGetPrisons } from '../../features/prisons/api/useGetPrison';
import { Prison } from '../../features/prisons/types/prison';
import { useGetSorties, useSortieDecision } from '../../features/sorties/api/useGetSortie';
import { usePermissions } from '../../features/auth/hooks/usePermissions';
import { getApiErrorMessage } from '../../shared/api/errorMessages';
import { SortieTableRow } from '../../features/sorties/types/sortie';

export const TransfertListPage: React.FC = () => {
  const navigate = useNavigate();

  const { can, isMyPrison } = usePermissions();
  const { data: transferts = [], isLoading } = useGetTransferts({ enabled: can('transfers:read') });
  const { data: sorties = [] } = useGetSorties({ enabled: can('exits:read') });
  const sortieDecision = useSortieDecision();
  const transfertDecision = useTransfertDecision();

  const handleDecideTransfert = (transfert: TransfertTableRow, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? window.prompt('Motif du refus (facultatif) :') : undefined;
    if (reason === null) return; // annulé
    transfertDecision.mutate(
      { id: transfert.id, action, reason: reason || undefined },
      { onError: (error) => window.alert(getApiErrorMessage(error)) },
    );
  };

  // Arrivée du détenu dans la prison de destination : il change d'établissement (confirmation demandée)
  const handleCompleteTransfert = (transfert: TransfertTableRow) => {
    if (!window.confirm(`Confirmer l'arrivée de ${transfert.detenu_name} dans votre établissement ?`)) return;
    transfertDecision.mutate(
      { id: transfert.id, action: 'complete' },
      { onError: (error) => window.alert(getApiErrorMessage(error)) },
    );
  };

  const handleDecideSortie = (sortie: SortieTableRow, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? window.prompt('Motif du refus (facultatif) :') : undefined;
    if (reason === null) return; // annulé
    sortieDecision.mutate(
      { id: sortie.id, action, reason: reason || undefined },
      { onError: (error) => window.alert(getApiErrorMessage(error)) },
    );
  };
  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons();
  const { data: detenusList = [], isLoading: isLoadingDetenus } = useGetDetenus();

  const getDetenuName = (detenuId: number): string => {
    const detenu = detenusList.find((d: Detenu) => d.id === detenuId);
    return detenu ? `${detenu.first_name} ${detenu.last_name}` : '...';
  };

  const getTransfert = (from: number, to: number): string => {
    const f = prisons.find((p: Prison) => p.id === Number(from));
    const t = prisons.find((p: Prison) => p.id === Number(to));
    return `${f?.name || '...'} => ${t?.name || '...'}`;
  };

  const handleViewDetail = (id: number) => navigate(`/transfers/${id}`);

  const tableRows: TransfertTableRow[] = useMemo(() => {
    if (isLoadingDetenus || isLoadingPrisons) return [];
    return transferts.map((transfert) => ({
      ...transfert,
      detenu_name: getDetenuName(transfert.prisoner),
      type_transfert: getTransfert(transfert.from_prison, transfert.to_prison),
      motif: transfert.purpose,
      transfer_date: transfert.transfer_date,
      priorite: transfert.priority,
      status: transfert.status,
    } as TransfertTableRow));
  }, [transferts, detenusList, prisons]);

  const tableRowsSorties: SortieTableRow[] = useMemo(() => {
    return sorties.map((sortie) => ({
      ...sortie,
      detenu_name: getDetenuName(sortie.prisoner),
      date_prevue: sortie.date,
      due_return_date: sortie.due_return_date,
      is_returned: sortie.is_returned,
      actual_return_date: sortie.actual_return_date,
    } as SortieTableRow));
  }, [sorties, detenusList]);

  const generateReport = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    // En-tête
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Rapport — Transferts & Sorties', 14, 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Administration Pénitentiaire du Sénégal  —  Généré le ${date}`, 14, 22);

    // Stats
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Statistiques générales', 14, 38);

    const pending = tableRows.filter(t => t.status === 'PENDING').length;
    const approved = tableRows.filter(t => t.status === 'APPROVED').length;
    const completed = tableRows.filter(t => t.status === 'COMPLETED').length;
    const returned = tableRowsSorties.filter(s => s.is_returned).length;

    autoTable(doc, {
      startY: 42,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Total transferts', String(tableRows.length)],
        ['En attente', String(pending)],
        ['Approuvés', String(approved)],
        ['Complétés', String(completed)],
        ['Total sorties', String(tableRowsSorties.length)],
        ['Sorties retournées', String(returned)],
        ['Sorties en cours', String(tableRowsSorties.length - returned)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'center', cellWidth: 25 } },
      margin: { left: 14, right: 14 },
    });

    // Tableau transferts
    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(`Liste des transferts (${tableRows.length})`, 14, y1);

    autoTable(doc, {
      startY: y1 + 4,
      head: [['#', 'Détenu', 'Transfert', 'Motif', 'Date', 'Priorité', 'Statut']],
      body: tableRows.map((t, i) => [
        i + 1, t.detenu_name, t.type_transfert, t.motif,
        new Date(t.date).toLocaleDateString('fr-FR'),
        t.priorite, t.status,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const v = data.cell.raw as string;
          if (v === 'PENDING') data.cell.styles.textColor = [180, 83, 9];
          else if (v === 'APPROVED') data.cell.styles.textColor = [22, 101, 52];
          else if (v === 'REJECTED') data.cell.styles.textColor = [185, 28, 28];
        }
      },
      margin: { left: 8, right: 8 },
      columnStyles: { 6: { fontStyle: 'bold' } },
    });

    // Tableau sorties (nouvelle page si nécessaire)
    const y2 = (doc as any).lastAutoTable.finalY + 12;
    if (y2 > 240) doc.addPage();
    const sy = y2 > 240 ? 20 : y2;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(`Liste des sorties (${tableRowsSorties.length})`, 14, sy);

    autoTable(doc, {
      startY: sy + 4,
      head: [['#', 'Détenu', 'Destination', 'Autorisé par', 'Date prévue', 'Retour prévu', 'Retour réel', 'Retourné']],
      body: tableRowsSorties.map((s, i) => [
        i + 1, s.detenu_name, s.destination, s.authorized_by,
        new Date(s.date).toLocaleDateString('fr-FR'),
        new Date(s.due_return_date).toLocaleDateString('fr-FR'),
        s.actual_return_date ? new Date(s.actual_return_date).toLocaleDateString('fr-FR') : '—',
        s.is_returned ? 'Oui' : 'Non',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.section === 'body') {
          const v = data.cell.raw as string;
          data.cell.styles.textColor = v === 'Oui' ? [22, 101, 52] : [185, 28, 28];
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
    doc.save(`transferts-sorties-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [tableRows, tableRowsSorties]);

  if (isLoadingDetenus || isLoadingPrisons) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des transferts et sorties</h2>
        <button
          onClick={generateReport}
          disabled={isLoading || (tableRows.length === 0 && tableRowsSorties.length === 0)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Rapport PDF
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <TransfertTable
          tranferts={tableRows}
          sorties={tableRowsSorties}
          onViewDetail={handleViewDetail}
          onEdit={() => {}}
          onAddTransfert={can('transfers:create') ? () => navigate('/transfers/new') : undefined}
          onEditTransfert={can('transfers:update') ? (t) => navigate(`/transfers/update/${t.id}`) : undefined}
          // Seul un transfert en attente, de la prison de l'utilisateur, est modifiable
          canEditTransfert={(t) => t.status === 'PENDING' && isMyPrison(t.from_prison)}
          // Validation par la prison source (SP ou AP), directement depuis la liste
          onDecideTransfert={can('transfers:validate') ? handleDecideTransfert : undefined}
          canDecideTransfert={(t) => isMyPrison(t.from_prison)}
          // Réception par la prison de destination (AG, SP ou AP), directement depuis la liste
          onCompleteTransfert={can('transfers:complete') ? handleCompleteTransfert : undefined}
          canCompleteTransfert={(t) => isMyPrison(t.to_prison)}
          decidingTransfertId={transfertDecision.isPending ? transfertDecision.variables?.id ?? null : null}
          onAddSortie={can('exits:create') ? () => navigate('/transfers/sorties/new') : undefined}
          onEditSortie={can('exits:update') ? (s) => navigate(`/transfers/sorties/update/${s.id}`) : undefined}
          onDecideSortie={can('exits:validate') ? handleDecideSortie : undefined}
          canDecideSortie={(s) => isMyPrison(s.prison)}
          loading={isLoading}
        />
      </div>
    </div>
  );
};
