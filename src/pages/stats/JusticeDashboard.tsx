import React, { useMemo } from "react";
import { Clock, FileText, Gavel, Hourglass, Users } from "lucide-react";
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
import { CategoryBars, PrisonBars, Series, TimeLines, TimeStack } from "../../features/stats/components/StatsCharts";
import { CustodyStatus, VisitOutcome } from "../../features/stats/types/stats";
import { formatDays, formatNumber, formatRatio, SERIES_COLORS } from "../../features/stats/utils/chartTheme";
import { formatDay } from "../../features/stats/utils/periods";
import { getApiErrorMessages } from "../../shared/api/errorMessages";

const STATUS_ORDER: CustodyStatus[] = ["PREVENU", "ACCUSE", "CONDAMNE_NON_DEFINITIF", "CONDAMNE"];
const OUTCOME_ORDER: VisitOutcome[] = ["VALIDEE", "REFUSEE", "EN_COURS"];

// Tableau de bord du ministère de la Justice (REP_MIN_JUSTICE ; aussi ouvert au SUPER_ADMIN).
// Lecture seule ; toutes les valeurs viennent de GET stats/justice/ (définitions : PDSC stats/indicators.py).
export const JusticeDashboard: React.FC = () => {
  const [filters, setFilters] = useStatsFilters();
  const prisons = useStatsPrisons("justice");
  const stats = useStats("justice", filters);
  const series = useStatsSeries("justice", filters);

  const data = stats.data;
  const ind = data?.indicateurs;

  const statusSeries: Series[] = useMemo(
    () =>
      STATUS_ORDER.map((key, i) => ({
        key,
        label: ind?.detenus_par_statut.repartition[key]?.label ?? key,
        color: SERIES_COLORS[i],
      })),
    [ind]
  );
  const outcomeSeries: Series[] = useMemo(
    () =>
      OUTCOME_ORDER.map((key, i) => ({
        key,
        label: ind?.demandes_visite.repartition[key]?.label ?? key,
        color: SERIES_COLORS[i],
      })),
    [ind]
  );

  // Évolution : une ligne par tranche de la période
  const evolution = useMemo(
    () =>
      series.points.map(({ bucket, data: d }) => ({
        periode: bucket.label,
        du: bucket.date_from,
        au: bucket.date_to,
        decisions: d.indicateurs.decisions_par_type.total,
        detention_terminees: d.indicateurs.detention_provisoire.terminees.total,
        ...Object.fromEntries(OUTCOME_ORDER.map((k) => [k, d.indicateurs.demandes_visite.repartition[k].total])),
      })),
    [series.points]
  );

  const statusByPrison = useMemo(
    () =>
      (ind?.detenus_par_statut.par_prison ?? []).map((line) => ({
        prison: line.prison,
        prison_nom: line.prison_nom,
        total: line.total,
        ...line.repartition,
      })),
    [ind]
  );

  if (stats.isError) {
    return (
      <div className="space-y-6">
        <StatsHeader title="Tableau de bord — Justice" subtitle="Vue nationale" />
        <StatsMessage tone="error">{getApiErrorMessages(stats.error).join(" ")}</StatsMessage>
      </div>
    );
  }

  const dp = ind?.detention_provisoire;
  const visits = ind?.demandes_visite;

  return (
    <div className="space-y-6">
      <StatsHeader
        title="Tableau de bord — Justice"
        subtitle={data ? `Stocks au ${formatDay(data.date_stocks)} · flux sur la période choisie` : "Vue nationale"}
      />

      <StatsFiltersBar filters={filters} prisons={prisons.data ?? []} onChange={setFilters}
        fetching={stats.isFetching || series.isLoading} />

      {!ind || !dp || !visits ? (
        <StatsMessage>Chargement des indicateurs…</StatsMessage>
      ) : (
        <>
          {/* Chiffres clés */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiTile icon={Users} title="Détenus en détention" stock value={formatNumber(ind.detenus_par_statut.total)}
              hint={`${formatNumber(ind.detenus_par_statut.repartition.CONDAMNE.total + ind.detenus_par_statut.repartition.CONDAMNE_NON_DEFINITIF.total)} condamnés`} />
            <KpiTile icon={Hourglass} title="En détention provisoire" stock value={formatNumber(dp.en_cours.total)}
              hint={`Ancienneté moyenne : ${formatDays(dp.en_cours.anciennete_moyenne_jours)}`} />
            <KpiTile icon={Clock} title="Durée moyenne de détention provisoire" value={formatDays(dp.terminees.duree_moyenne_jours)}
              hint={`${formatNumber(dp.terminees.total)} terminées · médiane ${formatDays(dp.terminees.duree_mediane_jours)} · max ${formatDays(dp.terminees.duree_max_jours)}`} />
            <KpiTile icon={Gavel} title="Décisions de justice" value={formatNumber(ind.decisions_par_type.total)} />
            <KpiTile icon={FileText} title="Demandes de visite" value={formatNumber(visits.total)}
              hint={`Refus : ${formatRatio(visits.taux_refus)} · délai moyen ${formatDays(visits.delai_moyen_jours)}`} />
          </div>

          {/* Répartition */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Détenus par statut" subtitle="À ce jour" definition={ind.detenus_par_statut.definition}
              empty={ind.detenus_par_statut.total === 0}
              table={<RepartitionTable items={STATUS_ORDER.map((k) => ind.detenus_par_statut.repartition[k])} total={ind.detenus_par_statut.total} />}>
              <CategoryBars name="Détenus" data={STATUS_ORDER.map((k) => ({ label: ind.detenus_par_statut.repartition[k].label, value: ind.detenus_par_statut.repartition[k].total }))} />
            </ChartCard>
            <ChartCard title="Décisions de justice par type" subtitle="Sur la période" definition={ind.decisions_par_type.definition}
              empty={ind.decisions_par_type.total === 0}
              table={<RepartitionTable items={Object.values(ind.decisions_par_type.repartition)} total={ind.decisions_par_type.total} />}>
              <CategoryBars name="Décisions"
                data={Object.values(ind.decisions_par_type.repartition).filter((r) => r.total > 0).map((r) => ({ label: r.label, value: r.total }))} />
            </ChartCard>
          </div>

          {/* Évolution dans le temps */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Décisions de justice dans le temps" subtitle={`Datées dans la période, ${series.unit}`}
              definition={ind.decisions_par_type.definition}
              empty={!series.isLoading && !series.isError && evolution.length === 0}
              table={<EvolutionTable rows={evolution} series={[{ key: "decisions", label: "Décisions", color: SERIES_COLORS[0] }]} />}>
              <SeriesState loading={series.isLoading} error={series.isError}>
                <TimeLines rows={evolution} series={[{ key: "decisions", label: "Décisions", color: SERIES_COLORS[0] }]} />
              </SeriesState>
            </ChartCard>
            <ChartCard title="Demandes de visite dans le temps" subtitle={`Par date de dépôt, issue à ce jour, ${series.unit}`}
              definition={visits.definition} legend={outcomeSeries}
              empty={!series.isLoading && !series.isError && evolution.length === 0}
              table={<EvolutionTable rows={evolution} series={outcomeSeries} />}>
              <SeriesState loading={series.isLoading} error={series.isError}>
                <TimeStack rows={evolution} series={outcomeSeries} />
              </SeriesState>
            </ChartCard>
          </div>

          {/* Comparaison entre prisons */}
          <ChartCard title="Détenus par statut et par établissement" subtitle="À ce jour"
            definition={ind.detenus_par_statut.definition} legend={statusSeries}
            empty={statusByPrison.length === 0}
            table={
              <DataTable rows={statusByPrison} rowKey={(r) => r.prison}
                columns={[
                  { label: "Établissement", value: (r) => r.prison_nom },
                  ...statusSeries.map((s) => ({ label: s.label, numeric: true, value: (r: (typeof statusByPrison)[number]) => formatNumber(r[s.key as CustodyStatus]) })),
                  { label: "Total", numeric: true, value: (r) => formatNumber(r.total) },
                ]} />
            }>
            <PrisonBars rows={statusByPrison} series={statusSeries} stacked />
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Ancienneté moyenne en détention provisoire" subtitle="Détenus prévenus ou accusés à ce jour, en jours"
              definition={dp.definition} empty={dp.par_prison.every((l) => l.en_cours === 0)}
              table={
                <DataTable rows={dp.par_prison} rowKey={(r) => r.prison}
                  columns={[
                    { label: "Établissement", value: (r) => r.prison_nom },
                    { label: "En cours", numeric: true, value: (r) => formatNumber(r.en_cours) },
                    { label: "Ancienneté moy.", numeric: true, value: (r) => formatDays(r.anciennete_moyenne_jours) },
                    { label: "Terminées", numeric: true, value: (r) => formatNumber(r.terminees) },
                    { label: "Durée moy.", numeric: true, value: (r) => formatDays(r.duree_moyenne_jours) },
                  ]} />
              }>
              <PrisonBars rows={dp.par_prison} format={(v) => `${v} j`}
                series={[{ key: "anciennete_moyenne_jours", label: "Ancienneté moyenne", color: SERIES_COLORS[0] }]} />
            </ChartCard>
            <ChartCard title="Demandes de visite par établissement" subtitle="Sur la période"
              definition={visits.definition} legend={outcomeSeries} empty={visits.total === 0}
              table={
                <DataTable rows={visits.par_prison} rowKey={(r) => r.prison}
                  columns={[
                    { label: "Établissement", value: (r) => r.prison_nom },
                    ...outcomeSeries.map((s) => ({ label: s.label, numeric: true, value: (r: (typeof visits.par_prison)[number]) => formatNumber(r.repartition[s.key as VisitOutcome]) })),
                    { label: "Taux de refus", numeric: true, value: (r) => formatRatio(r.taux_refus) },
                    { label: "Délai moyen", numeric: true, value: (r) => formatDays(r.delai_moyen_jours) },
                  ]} />
              }>
              <PrisonBars stacked series={outcomeSeries}
                rows={visits.par_prison.map((l) => ({ prison: l.prison, prison_nom: l.prison_nom, ...l.repartition }))} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
};
