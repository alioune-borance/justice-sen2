import React, { useState, useCallback } from 'react';
import { AlertTriangle, Shield, TrendingUp, MapPin, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Données fictives ──────────────────────────────────────────────────────────

const crimeData = [
  { month: 'Jan', crimes: 312 },
  { month: 'Fév', crimes: 278 },
  { month: 'Mar', crimes: 345 },
  { month: 'Avr', crimes: 401 },
  { month: 'Mai', crimes: 367 },
  { month: 'Jun', crimes: 433 },
];

// 14 régions du Sénégal avec coordonnées SVG approx. (viewport 440×320)
const REGIONS = [
  { id: 'dakar',       name: 'Dakar',        cx:  22, cy: 148, incidents: 87, level: 'Élevé',  trend: 'up'     },
  { id: 'thies',       name: 'Thiès',         cx:  60, cy: 140, incidents: 54, level: 'Élevé',  trend: 'up'     },
  { id: 'diourbel',    name: 'Diourbel',      cx: 108, cy: 150, incidents: 38, level: 'Modéré', trend: 'stable' },
  { id: 'fatick',      name: 'Fatick',        cx:  90, cy: 172, incidents: 29, level: 'Modéré', trend: 'down'   },
  { id: 'kaolack',     name: 'Kaolack',       cx: 120, cy: 185, incidents: 46, level: 'Élevé',  trend: 'up'     },
  { id: 'kaffrine',    name: 'Kaffrine',      cx: 162, cy: 190, incidents: 22, level: 'Modéré', trend: 'down'   },
  { id: 'saint-louis', name: 'Saint-Louis',   cx:  82, cy:  48, incidents: 31, level: 'Modéré', trend: 'stable' },
  { id: 'louga',       name: 'Louga',         cx: 106, cy:  88, incidents: 18, level: 'Faible', trend: 'down'   },
  { id: 'matam',       name: 'Matam',         cx: 318, cy:  82, incidents: 14, level: 'Faible', trend: 'stable' },
  { id: 'tambacounda', name: 'Tambacounda',   cx: 284, cy: 200, incidents: 25, level: 'Modéré', trend: 'up'     },
  { id: 'kedougou',    name: 'Kédougou',      cx: 372, cy: 262, incidents: 11, level: 'Faible', trend: 'down'   },
  { id: 'kolda',       name: 'Kolda',         cx: 200, cy: 252, incidents: 20, level: 'Modéré', trend: 'stable' },
  { id: 'sedhiou',     name: 'Sédhiou',       cx: 150, cy: 264, incidents: 16, level: 'Faible', trend: 'down'   },
  { id: 'ziguinchor',  name: 'Ziguinchor',    cx:  98, cy: 278, incidents: 33, level: 'Modéré', trend: 'up'     },
];

const riskZones = REGIONS.filter(r => r.level === 'Élevé' || r.level === 'Modéré')
  .sort((a, b) => b.incidents - a.incidents)
  .slice(0, 5);

// ── Couleur heatmap ───────────────────────────────────────────────────────────
const heatColor = (incidents: number): { fill: string; glow: string } => {
  if (incidents >= 70) return { fill: '#991b1b', glow: '#ef4444' };
  if (incidents >= 45) return { fill: '#dc2626', glow: '#f87171' };
  if (incidents >= 30) return { fill: '#ea580c', glow: '#fb923c' };
  if (incidents >= 18) return { fill: '#d97706', glow: '#fbbf24' };
  return { fill: '#65a30d', glow: '#a3e635' };
};

const heatRadius = (incidents: number) => Math.max(10, Math.min(32, incidents * 0.36));

// ── Composant carte heatmap ───────────────────────────────────────────────────
const HeatMap: React.FC = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredRegion = REGIONS.find(r => r.id === hovered);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-1">
        Carte de chaleur — Incidents par région
      </h3>
      <p className="text-xs text-gray-400 mb-3">Données fictives illustratives — Sénégal</p>

      <div className="relative">
        <svg
          viewBox="0 0 440 320"
          className="w-full rounded-lg"
          style={{ background: 'linear-gradient(160deg, #e0f2fe 0%, #f0fdf4 100%)' }}
        >
          <defs>
            {REGIONS.map(r => {
              const { glow } = heatColor(r.incidents);
              return (
                <radialGradient key={r.id} id={`g-${r.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor={glow}  stopOpacity="0.9" />
                  <stop offset="60%"  stopColor={glow}  stopOpacity="0.4" />
                  <stop offset="100%" stopColor={glow}  stopOpacity="0"   />
                </radialGradient>
              );
            })}
          </defs>

          {/* Grille de fond légère */}
          {[0,80,160,240,320].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="440" y2={y} stroke="#cbd5e1" strokeWidth="0.4" />
          ))}
          {[0,88,176,264,352,440].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="320" stroke="#cbd5e1" strokeWidth="0.4" />
          ))}

          {/* Titre carte */}
          <text x="220" y="15" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">
            SÉNÉGAL — Carte thermique des incidents pénitentiaires
          </text>

          {/* Halo de chaleur (grand) */}
          {REGIONS.map(r => {
            const rad = heatRadius(r.incidents);
            return (
              <circle
                key={`halo-${r.id}`}
                cx={r.cx} cy={r.cy}
                r={rad * 2.5}
                fill={`url(#g-${r.id})`}
                opacity={hovered === r.id ? 1 : 0.65}
              />
            );
          })}

          {/* Bulle centrale */}
          {REGIONS.map(r => {
            const { fill } = heatColor(r.incidents);
            const rad = heatRadius(r.incidents);
            const isHovered = hovered === r.id;
            return (
              <g
                key={r.id}
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={r.cx} cy={r.cy} r={rad}
                  fill={fill}
                  stroke="white"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  opacity={isHovered ? 1 : 0.85}
                  style={{ transition: 'all 0.15s' }}
                />
                <text
                  x={r.cx} y={r.cy + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={rad > 18 ? 9 : 7}
                  fontWeight="bold"
                  fill="white"
                  fontFamily="sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {r.incidents}
                </text>
                {/* Label région */}
                <text
                  x={r.cx} y={r.cy + rad + 9}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="#334155"
                  fontFamily="sans-serif"
                  fontWeight={isHovered ? '700' : '400'}
                  style={{ pointerEvents: 'none' }}
                >
                  {r.name}
                </text>
              </g>
            );
          })}

          {/* Légende */}
          {[
            { color: '#991b1b', label: '70+' },
            { color: '#dc2626', label: '45–69' },
            { color: '#ea580c', label: '30–44' },
            { color: '#d97706', label: '18–29' },
            { color: '#65a30d', label: '<18' },
          ].map((l, i) => (
            <g key={l.label} transform={`translate(${12 + i * 82}, 302)`}>
              <rect x="0" y="0" width="12" height="12" rx="3" fill={l.color} />
              <text x="15" y="10" fontSize="8.5" fill="#475569" fontFamily="sans-serif">{l.label}</text>
            </g>
          ))}
        </svg>

        {/* Tooltip flottant */}
        {hoveredRegion && (
          <div className="absolute top-2 right-2 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs min-w-[140px]">
            <p className="font-bold text-slate-800 text-sm">{hoveredRegion.name}</p>
            <p className="text-gray-500 mt-0.5">{hoveredRegion.incidents} incidents ce mois</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              hoveredRegion.level === 'Élevé'  ? 'bg-red-100 text-red-700'    :
              hoveredRegion.level === 'Modéré' ? 'bg-orange-100 text-orange-700' :
                                                  'bg-green-100 text-green-700'
            }`}>
              {hoveredRegion.level}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Graphique en barres ───────────────────────────────────────────────────────
const CrimeChart: React.FC = () => {
  const maxCrime = Math.max(...crimeData.map(d => d.crimes));
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Évolution des incidents par mois</h3>
      <div className="h-64">
        <div className="flex items-end justify-between h-full space-x-2">
          {crimeData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-100 rounded-t-lg flex items-end" style={{ height: '200px' }}>
                <div
                  className="w-full bg-blue-600 rounded-t-lg flex items-end justify-center transition-all"
                  style={{ height: `${(data.crimes / maxCrime) * 100}%` }}
                >
                  <span className="text-white text-xs font-medium mb-1">{data.crimes}</span>
                </div>
              </div>
              <span className="text-sm text-gray-600 mt-2">{data.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Liste zones à risque ──────────────────────────────────────────────────────
const RiskZonesList: React.FC = () => {
  const getLevelColor = (level: string) => {
    if (level === 'Élevé')  return 'bg-red-100 text-red-800';
    if (level === 'Modéré') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up')   return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === 'down') return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />;
    return <div className="h-4 w-1.5 bg-gray-400 rounded-full mx-auto" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Zones à risque — Top 5</h3>
      <div className="space-y-3">
        {riskZones.map((zone, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="font-medium text-slate-800">{zone.name}</p>
                <p className="text-sm text-gray-500">{zone.incidents} incidents ce mois</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(zone.level)}`}>
                {zone.level}
              </span>
              {getTrendIcon(zone.trend)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────
export const SecurityDashboard: React.FC = () => {
  const generateReport = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    doc.setFillColor(185, 28, 28);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Rapport — Sécurité & Analytique', 14, 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Ministère de la Justice du Sénégal  —  Généré le ${date}`, 14, 22);

    // Indicateurs globaux
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Indicateurs globaux', 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [['Indicateur', 'Valeur', 'Évolution']],
      body: [
        ['Incidents ce mois',   '247', '+12%'],
        ['Régions à risque',    '5',   '-5%' ],
        ['Alertes actives',     '8',   '-20%'],
        ['Analyses générées',   '42',  '+8%' ],
      ],
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        1: { fontStyle: 'bold', halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
    });

    // Régions par niveau de risque
    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text('Analyse par région — Sénégal', 14, y1);

    autoTable(doc, {
      startY: y1 + 4,
      head: [['Région', 'Incidents ce mois', 'Niveau de risque', 'Tendance']],
      body: REGIONS.sort((a, b) => b.incidents - a.incidents).map(r => [
        r.name,
        r.incidents,
        r.level,
        r.trend === 'up' ? 'Hausse' : r.trend === 'down' ? 'Baisse' : 'Stable',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      didParseCell: (data) => {
        if (data.column.index === 2 && data.section === 'body') {
          const v = data.cell.raw as string;
          if (v === 'Élevé')  data.cell.styles.textColor = [185, 28, 28];
          else if (v === 'Modéré') data.cell.styles.textColor = [180, 83, 9];
          else data.cell.styles.textColor = [22, 101, 52];
        }
        if (data.column.index === 3 && data.section === 'body') {
          const v = data.cell.raw as string;
          if (v === 'Hausse') data.cell.styles.textColor = [185, 28, 28];
          else if (v === 'Baisse') data.cell.styles.textColor = [22, 101, 52];
        }
      },
      columnStyles: { 1: { halign: 'center' }, 2: { fontStyle: 'bold' }, 3: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });

    // Évolution mensuelle
    const y2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text('Évolution mensuelle des incidents', 14, y2);

    autoTable(doc, {
      startY: y2 + 4,
      head: [['Mois', 'Incidents']],
      body: crimeData.map(d => [d.month, d.crimes]),
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
      margin: { left: 14, right: 100 },
    });

    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
      doc.text('Document confidentiel — Ministère de la Justice du Sénégal', 8, 290);
      doc.text(`Page ${p} / ${pageCount}`, 202, 290, { align: 'right' });
    }
    doc.save(`securite-analytique-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Sécurité & Analytique</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Rapport PDF
          </button>
          <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
            <Shield className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">Ministère de la Justice — Sénégal</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Incidents ce mois',     value: '247', delta: '+12%', color: 'red',    Icon: AlertTriangle, up: true  },
          { label: 'Régions à risque',      value: '5',   delta: '-5%',  color: 'yellow', Icon: MapPin,        up: false },
          { label: 'Alertes actives',       value: '8',   delta: '-20%', color: 'green',  Icon: Shield,        up: false },
          { label: 'Analyses générées',     value: '42',  delta: '+8%',  color: 'blue',   Icon: BarChart3,     up: true  },
        ].map(({ label, value, delta, color, Icon, up }) => (
          <div key={label} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
                <div className={`flex items-center mt-2 text-${color}-600`}>
                  <TrendingUp className={`h-4 w-4 mr-1 ${!up ? 'rotate-180' : ''}`} />
                  <span className="text-sm font-medium">{delta}</span>
                </div>
              </div>
              <div className={`bg-${color}-50 p-3 rounded-full`}>
                <Icon className={`h-8 w-8 text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Carte + Zones à risque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeatMap />
        <RiskZonesList />
      </div>

      <CrimeChart />

      {/* Alertes récentes */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Alertes récentes</h3>
        <div className="space-y-3">
          {[
            { color: 'red',    region: 'Dakar',      msg: 'Hausse des incidents disciplinaires — Maison d\'Arrêt de Rebeuss',         time: 'Il y a 1 heure'   },
            { color: 'yellow', region: 'Kaolack',    msg: 'Concentration d\'incidents — Maison de correction de Kaolack',              time: 'Il y a 3 heures'  },
            { color: 'orange', region: 'Ziguinchor', msg: 'Tentative d\'évasion signalée — Camp pénal de Ziguinchor',                  time: 'Il y a 5 heures'  },
          ].map(({ color, region, msg, time }) => (
            <div key={region} className={`flex items-center space-x-3 p-3 bg-${color}-50 rounded-lg`}>
              <AlertTriangle className={`h-5 w-5 text-${color}-600 shrink-0`} />
              <div>
                <p className={`text-sm font-medium text-${color}-800`}>{msg}</p>
                <p className={`text-xs text-${color}-600`}>{region} — {time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};