import React, { useMemo } from "react";
import { AlertTriangle, ArrowLeftRight, BedDouble, Building2, ShieldAlert, Siren } from "lucide-react";
import { useStats, useStatsPrisons, useStatsSeries } from "../../features/stats/api/useStats";
import { useStatsFilters } from "../../features/stats/hooks/useStatsFilters";
import {
  ChartCard,
  DataTable,
  EvolutionTable,
  KpiTile,
  RepartitionTable,
  SeriesState,
  StatsFiltersBar,
  StatsHeader,
  StatsMessage,
} from "../../features/stats/components/StatsParts";
import { CategoryBars, PrisonBars, Series, TimeLines } from "../../features/stats/components/StatsCharts";
import { TransferStatus } from "../../features/stats/types/stats";
import { formatNumber, formatRatio, SERIES_COLORS } from "../../features/stats/utils/chartTheme";
import { formatDay } from "../../features/stats/utils/periods";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const TRANSFER_ORDER: TransferStatus[] = ["PENDING", "APPROVED", "COMPLETED", "REJECTED"];

const INCIDENT_SERIES: Series[] = [
  { key: "incidents", label: "Incidents", color: SERIES_COLORS[0] },
  { key: "evasions", label: "Évasions", color: SERIES_COLORS[1] },
];
const MOVEMENT_SERIES: Series[] = [
  { key: "ecrous", label: "Écrous", color: SERIES_COLORS[0] },
  { key: "liberations", label: "Libérations", color: SERIES_COLORS[1] },
];
const FLOW_SERIES: Series[] = [
  { key: "entrees", label: "Entrées (écrous, transferts reçus)", color: SERIES_COLORS[0] },
  { key: "sorties", label: "Sorties (libérations, transferts partis, décès)", color: SERIES_COLORS[1] },
];

// Tableau de bord du ministère de l'Intérieur (REP_MIN_INTERIEUR ; aussi ouvert au SUPER_ADMIN).
// Lecture seule ; toutes les valeurs viennent de GET stats/interieur/ (définitions : PDSC stats/indicators.py).
export const InterieurDashboard: React.FC = () => {
  const [filters, setFilters] = useStatsFilters();
  const prisons = useStatsPrisons("interieur");
  const stats = useStats("interieur", filters);
  const series = useStatsSeries("interieur", filters);

  const data = stats.data;
  const ind = data?.indicateurs;

  const evolution = useMemo(
    () =>
      series.points.map(({ bucket, data: d }) => ({
        periode: bucket.label,
        du: bucket.date_from,
        au: bucket.date_to,
        incidents: d.indicateurs.incidents_par_type.total,
        evasions: d.indicateurs.evasions.total,
        ecrous: d.indicateurs.mouvements.totaux.ecrous,
        liberations: d.indicateurs.mouvements.totaux.liberations,
      })),
    [series.points]
  );

  // Occupation par prison, en pourcentage (repère à 100 %)
  const occupancyRows = useMemo(
    () =>
      (ind?.occupation.par_prison ?? []).map((line) => ({
        ...line,
        taux_pct: line.taux_occupation == null ? 0 : Math.round(line.taux_occupation * 1000) / 10,
      })),
    [ind]
  );

  const flowRows = useMemo(
    () =>
      (ind?.mouvements.par_prison ?? []).map((line) => ({
        ...line,
        entrees: line.ecrous + line.transferts_entrants,
        sorties: line.liberations + line.transferts_sortants + line.deces,
      })),
    [ind]
  );

  if (stats.isError) {
    return (
      <div className="space-y-6">
        <StatsHeader title="Tableau de bord — Intérieur" subtitle="Vue nationale" />
        <StatsMessage tone="error">{getApiErrorMessages(stats.error).join(" ")}</StatsMessage>
      </div>
    );
  }

  const occ = ind?.occupation;
  const freePlaces = occ ? occ.capacite - occ.effectif : 0;

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Tableau de bord — Intérieur"
        subtitle={data ? `Stocks au ${formatDay(data.date_stocks)} · flux sur la période choisie` : "Vue nationale"}
      />

      <StatsFiltersBar filters={filters} prisons={prisons.data ?? []} onChange={setFilters}
        fetching={stats.isFetching || series.isLoading} />

      {!ind || !occ ? (
        <StatsMessage>Chargement des indicateurs…</StatsMessage>
      ) : (
        <>
          {/* Chiffres clés */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <KpiTile icon={Building2} title="Taux d'occupation" stock value={formatRatio(occ.taux_occupation)}
              hint={`${formatNumber(occ.effectif)} détenus pour ${formatNumber(occ.capacite)} places`} />
            <KpiTile icon={AlertTriangle} title="Prisons suroccupées" stock value={formatNumber(occ.prisons_suroccupees)}
              hint={`sur ${formatNumber(occ.par_prison.length)} établissements`}
              alert={occ.prisons_suroccupees > 0 ? "Effectif supérieur à la capacité" : undefined} />
            <KpiTile icon={BedDouble} title={freePlaces >= 0 ? "Places disponibles" : "Places manquantes"} stock
              value={formatNumber(Math.abs(freePlaces))} />
            <KpiTile icon={ShieldAlert} title="Incidents" value={formatNumber(ind.incidents_par_type.total)} />
            <KpiTile icon={Siren} title="Évasions" value={formatNumber(ind.evasions.total)}
              hint={`${formatNumber(ind.evasions.evades_actuellement)} détenus encore évadés à ce jour`} />
            <KpiTile icon={ArrowLeftRight} title="Transferts effectués" value={formatNumber(ind.transferts.repartition.COMPLETED.total)}
              hint={`${formatNumber(ind.transferts.total)} transferts sur la période`} />
          </div>

          {/* Répartition */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Incidents par type" subtitle="Sur la période" definition={ind.incidents_par_type.definition}
              empty={ind.incidents_par_type.total === 0}
              table={<RepartitionTable items={Object.values(ind.incidents_par_type.repartition)} total={ind.incidents_par_type.total} />}>
              <CategoryBars name="Incidents"
                data={Object.values(ind.incidents_par_type.repartition).filter((r) => r.total > 0).map((r) => ({ label: r.label, value: r.total }))} />
            </ChartCard>
            <ChartCard title="Transferts par statut" subtitle="Sur la période" definition={ind.transferts.definition}
              empty={ind.transferts.total === 0}
              table={<RepartitionTable items={TRANSFER_ORDER.map((k) => ind.transferts.repartition[k])} total={ind.transferts.total} />}>
              <CategoryBars name="Transferts"
                data={TRANSFER_ORDER.map((k) => ({ label: ind.transferts.repartition[k].label, value: ind.transferts.repartition[k].total }))} />
            </ChartCard>
          </div>

          {/* Évolution dans le temps */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Incidents et évasions dans le temps" subtitle={`Sur la période, ${series.unit}`}
              definition={`${ind.incidents_par_type.definition} ${ind.evasions.definition}`} legend={INCIDENT_SERIES}
              empty={!series.isLoading && !series.isError && evolution.length === 0}
              table={<EvolutionTable rows={evolution} series={INCIDENT_SERIES} />}>
              <SeriesState loading={series.isLoading} error={series.isError}>
                <TimeLines rows={evolution} series={INCIDENT_SERIES} />
              </SeriesState>
            </ChartCard>
            <ChartCard title="Écrous et libérations dans le temps" subtitle={`Sur la période, ${series.unit}`}
              definition={ind.mouvements.definition} legend={MOVEMENT_SERIES}
              empty={!series.isLoading && !series.isError && evolution.length === 0}
              table={<EvolutionTable rows={evolution} series={MOVEMENT_SERIES} />}>
              <SeriesState loading={series.isLoading} error={series.isError}>
                <TimeLines rows={evolution} series={MOVEMENT_SERIES} />
              </SeriesState>
            </ChartCard>
          </div>

          {/* Comparaison entre prisons */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Taux d'occupation par établissement" subtitle="À ce jour ; repère à 100 % de la capacité"
              definition={occ.definition} empty={occupancyRows.length === 0}
              table={
                <DataTable rows={occupancyRows} rowKey={(r) => r.prison}
                  columns={[
                    { label: "Établissement", value: (r) => r.prison_nom },
                    { label: "Effectif", numeric: true, value: (r) => formatNumber(r.effectif) },
                    { label: "Capacité", numeric: true, value: (r) => formatNumber(r.capacite) },
                    {
                      label: "Occupation", numeric: true,
                      value: (r) => (
                        <span className={r.effectif > r.capacite ? "inline-flex items-center gap-1 font-medium text-red-700" : ""}>
                          {r.effectif > r.capacite && <AlertTriangle className="h-3.5 w-3.5" aria-label="Suroccupée" />}
                          {formatRatio(r.taux_occupation)}
                        </span>
                      ),
                    },
                    { label: "Places libres", numeric: true, value: (r) => formatNumber(r.places_disponibles) },
                  ]}
                  footer={["Total", formatNumber(occ.effectif), formatNumber(occ.capacite), formatRatio(occ.taux_occupation), formatNumber(freePlaces)]} />
              }>
              <PrisonBars rows={occupancyRows} format={(v) => `${v} %`} domainMax={100}
                reference={{ value: 100, label: "Capacité" }}
                series={[{ key: "taux_pct", label: "Taux d'occupation", color: SERIES_COLORS[0] }]} />
            </ChartCard>
            <ChartCard title="Entrées et sorties par établissement" subtitle="Sur la période"
              definition={ind.mouvements.definition} legend={FLOW_SERIES}
              empty={flowRows.every((r) => r.entrees === 0 && r.sorties === 0)}
              table={
                <DataTable rows={flowRows} rowKey={(r) => r.prison}
                  columns={[
                    { label: "Établissement", value: (r) => r.prison_nom },
                    { label: "Écrous", numeric: true, value: (r) => formatNumber(r.ecrous) },
                    { label: "Transferts reçus", numeric: true, value: (r) => formatNumber(r.transferts_entrants) },
                    { label: "Transferts partis", numeric: true, value: (r) => formatNumber(r.transferts_sortants) },
                    { label: "Libérations", numeric: true, value: (r) => formatNumber(r.liberations) },
                    { label: "Décès", numeric: true, value: (r) => formatNumber(r.deces) },
                    { label: "Sorties temp.", numeric: true, value: (r) => formatNumber(r.sorties_temporaires) },
                    { label: "Retours en retard", numeric: true, value: (r) => formatNumber(r.retours_en_retard) },
                  ]}
                  footer={[
                    "Total",
                    ...(["ecrous", "transferts_entrants", "transferts_sortants", "liberations", "deces", "sorties_temporaires", "retours_en_retard"] as const)
                      .map((k) => formatNumber(ind.mouvements.totaux[k])),
                  ]} />
              }>
              <PrisonBars rows={flowRows} series={FLOW_SERIES} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
};
