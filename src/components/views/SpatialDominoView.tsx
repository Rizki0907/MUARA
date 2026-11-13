import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, ArrowUpRight, Flame, Layers, Sliders } from 'lucide-react';
import {
  allSpbus,
  clustersRanking,
  isolatedBottlenecks,
  simulationBundle,
} from '../../data';
import type { ClusterRanking, IsolatedBottleneck, MapSelection } from '../../types/muara';
import { simulateModifiedHuffSpillover } from '../../utils/huff';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { DataTable, type ColumnDef } from '../ui/DataTable';
import { EditorialHeader, Reveal } from '../ui/MotionPrimitives';

interface SpatialDominoViewProps {
  onInspectMap: (sel: MapSelection) => void;
}

export function SpatialDominoView({ onInspectMap }: SpatialDominoViewProps) {
  const highRiskSpbus = useMemo(
    () =>
      allSpbus
        .filter((s) => !s.iso && s.nbrs >= 3)
        .sort((a, b) => b.spill - a.spill)
        .slice(0, 40),
    []
  );

  const [selectedSpbuId, setSelectedSpbuId] = useState(highRiskSpbus[0]?.id ?? 'SPBU_0001');
  const [beta, setBeta] = useState(0.35);
  const [gamma, setGamma] = useState(0.82);
  const [shockFactor, setShockFactor] = useState(1.0);
  const [activeTableTab, setActiveTableTab] = useState<'clusters' | 'bottlenecks'>('clusters');

  const sourceSpbu = useMemo(
    () => allSpbus.find((s) => s.id === selectedSpbuId) ?? highRiskSpbus[0],
    [selectedSpbuId, highRiskSpbus]
  );

  const huffResults = useMemo(
    () => simulateModifiedHuffSpillover(sourceSpbu, allSpbus, beta, gamma, shockFactor),
    [sourceSpbu, beta, gamma, shockFactor]
  );

  const stationIds = useMemo(() => Object.keys(simulationBundle.stations), []);
  const [simStationId, setSimStationId] = useState(stationIds[0] ?? 'SPBU_0001');

  const stationSeries = useMemo(() => {
    const raw = simulationBundle.stations[simStationId] ?? [];
    return raw.map((pt) => ({
      hour: `J${pt.h}`,
      stock: pt.stk,
      baseFlow: pt.db,
      spillover: pt.sp,
      ttd: pt.ttd,
    }));
  }, [simStationId]);

  const peakSimStats = useMemo(() => {
    const raw = simulationBundle.stations[simStationId] ?? [];
    if (raw.length === 0) return { minTtd: 0, maxSpill: 0, stockoutHours: 0 };
    return {
      minTtd: Math.min(...raw.map((p) => p.ttd)),
      maxSpill: Math.max(...raw.map((p) => p.sp)),
      stockoutHours: raw.filter((p) => p.so > 0).length,
    };
  }, [simStationId]);

  const clusterCols: ColumnDef<ClusterRanking>[] = [
    {
      key: 'Rank',
      header: 'Rank',
      align: 'center',
      sortValue: (r) => r.Rank,
      render: (r) => <span className="font-mono-num text-[var(--text-muted)]">#{r.Rank}</span>,
    },
    {
      key: 'name',
      header: 'Kluster HDBSCAN (38)',
      sortValue: (r) => r.cluster_name,
      render: (r) => (
        <div>
          <span className="font-mono-num text-[var(--accent-blue)] mr-1.5">{r.cluster_id}</span>
          <span className="font-medium text-[var(--text-primary)]">{r.cluster_name}</span>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (r) => (
        <Badge
          variant={
            r.Priority_Tier.startsWith('Tier 1')
              ? 'red'
              : r.Priority_Tier.startsWith('Tier 2')
              ? 'amber'
              : r.Priority_Tier.startsWith('Tier 3')
              ? 'blue'
              : 'green'
          }
        >
          {r.Priority_Tier.split(' (')[0]}
        </Badge>
      ),
    },
    {
      key: 'score',
      header: 'MUARA Score',
      align: 'right',
      sortValue: (r) => r.MUARA_Score,
      render: (r) => <span className="font-mono-num font-bold">{r.MUARA_Score.toFixed(2)}</span>,
    },
    {
      key: 'spbu_count',
      header: 'SPBU',
      align: 'right',
      sortValue: (r) => r.spbu_count,
      render: (r) => <span className="font-mono-num">{r.spbu_count}</span>,
    },
    {
      key: 'tbbm',
      header: 'TBBM Utama',
      sortValue: (r) => r.primary_tbbm_name,
      render: (r) => <span className="text-xs text-[var(--text-secondary)]">{r.primary_tbbm_name}</span>,
    },
    {
      key: 'mean_ttd_hr',
      header: 'Mean TTD',
      align: 'right',
      sortValue: (r) => r.mean_ttd_hr,
      render: (r) => <span className="font-mono-num">{r.mean_ttd_hr.toFixed(2)} jam</span>,
    },
    {
      key: 'cascading',
      header: 'Baseline Domino',
      align: 'right',
      sortValue: (r) => r.baseline_cascading_hrs_30d,
      render: (r) => (
        <span className="font-mono-num text-[var(--accent-red)] font-medium">
          {r.baseline_cascading_hrs_30d.toFixed(1)} jam
        </span>
      ),
    },
  ];

  const bottleneckCols: ColumnDef<IsolatedBottleneck>[] = [
    {
      key: 'spbu_id',
      header: 'ID SPBU (-1)',
      sortValue: (r) => r.spbu_id,
      render: (r) => (
        <span className="font-mono-num text-[var(--accent-red)] font-semibold">{r.spbu_id}</span>
      ),
    },
    {
      key: 'name',
      header: 'Nama SPBU & Kab/Kota',
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{r.name}</div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {r.kabkota_name} · Kelas {r.road_class}
          </div>
        </div>
      ),
    },
    {
      key: 'tbbm',
      header: 'TBBM & Jarak',
      sortValue: (r) => r.dist_to_tbbm_km,
      render: (r) => (
        <span className="font-mono-num">
          {r.nearest_tbbm_id} ({r.dist_to_tbbm_km} km · {r.tbbm_lead_time_hr} jam)
        </span>
      ),
    },
    {
      key: 'cap',
      header: 'Tangki / Demand',
      align: 'right',
      sortValue: (r) => r.tank_capacity_kl,
      render: (r) => (
        <span className="font-mono-num">
          {r.tank_capacity_kl} KL / {r.avg_daily_demand_kl} KL/hr
        </span>
      ),
    },
    {
      key: 'buffer',
      header: 'Proteksi Buffer',
      align: 'right',
      render: (r) => (
        <Badge variant="red">{(r.safety_stock_buffer_pct * 100).toFixed(0)}% (+20%)</Badge>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* BAND 1: EDITORIAL FRAMING + PERTAMINA NOZZLE FIELD PHOTO */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <Reveal>
                <EditorialHeader
                  eyebrow="Modul 01 & 02 · Spillover & Klasterisasi Spasial"
                  title="Dinamika Gravitasi Antrean & Kontainmen Domino BBM Subsidi"
                  description="Ketika satu SPBU kehabisan Pertalite (JBKP) maupun Biosolar (JBT), pengendara bermigrasi ke SPBU terdekat berkapasitas besar. MUARA mengukur daya hisap migrasi itu menggunakan Modified Huff Spillover lalu menyekatnya dalam 38 kluster penyangga HDBSCAN."
                  accent="red"
                />
              </Reveal>

              {/* Hairline formula + empirical clustering metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-4 border-t border-[var(--border-hairline)]">
                <div>
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    Road Silhouette
                  </div>
                  <div className="font-mono-num text-2xl font-bold text-[var(--accent-blue)] mt-1">
                    0,678
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">DBI 0,624</div>
                </div>
                <div>
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    Spillover Containment
                  </div>
                  <div className="font-mono-num text-2xl font-bold text-[var(--accent-green)] mt-1">
                    94,2%
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">k_min = 6 · EoM</div>
                </div>
                <div>
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    Parameter Huff (alpha/beta/gamma)
                  </div>
                  <div className="font-mono-num text-xl font-bold text-[var(--text-primary)] mt-1">
                    1,0 / 0,35 / 0,82
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Peluruhan per menit</div>
                </div>
                <div>
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    Proteksi Outlier (-1)
                  </div>
                  <div className="font-mono-num text-2xl font-bold text-[var(--accent-red)] mt-1">
                    18 SPBU
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Buffer +20% (30%)</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <figure className="relative overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)]">
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <img
                    src="/images/pertamina-nozzle.jpg"
                    alt="Dispenser dan nozzle pengisian BBM Pertamina di lapangan"
                    className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
                <figcaption className="absolute bottom-0 inset-x-0 p-4 text-white">
                  <div className="text-[10px] font-sub uppercase tracking-[0.14em] text-white/80 mb-1">
                    Proteksi JBKP &amp; JBT Lintas Koridor
                  </div>
                  <p className="text-xs leading-snug">
                    Simulasi Modified Huff memperkirakan perpindahan beban per jam agar tangki
                    pendam tetangga diisi sebelum menyentuh batas minimum.
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 2: INTERACTIVE MODIFIED HUFF SPILLOVER SIMULATOR */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
            <EditorialHeader
              eyebrow="Eksperimen Gravitasi Interaktif"
              title="Simulator Migrasi Permintaan & Penurunan Time-to-Depletion (TTD)"
              description="Pilih satu SPBU sumber gangguan, atur sensitivitas jarak tempuh (beta), fraksi pengendara yang beralih (gamma), serta eskalasi shock permintaan."
            />
            <button
              onClick={() => onInspectMap({ type: 'spbu', data: sourceSpbu })}
              className="inline-flex items-center gap-1.5 text-xs font-sub font-semibold text-[var(--accent-blue)] hover:underline shrink-0"
            >
              Sorot {sourceSpbu.id} di Peta Overview
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pt-8">
            {/* Left Parameter Controls */}
            <div className="xl:col-span-4 space-y-6 xl:border-r border-[var(--border-hairline)] xl:pr-8">
              <div>
                <label className="text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  SPBU Sumber Gangguan / Stockout
                </label>
                <select
                  value={selectedSpbuId}
                  onChange={(e) => setSelectedSpbuId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                >
                  {highRiskSpbus.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.id} · {st.name} ({st.kab})
                    </option>
                  ))}
                </select>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-mono-num text-[var(--text-secondary)]">
                  <span>Kluster {sourceSpbu.cl}</span>
                  <span>·</span>
                  <span>Peak {(sourceSpbu.dPeak / 24).toFixed(2)} KL/jam</span>
                  <span>·</span>
                  <span>{sourceSpbu.nbrs} tetangga &lt;=15 mnt</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[var(--border-hairline)]">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-sub text-[var(--text-secondary)] inline-flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                      Sensitivitas Jarak Waktu (beta)
                    </span>
                    <span className="font-mono-num font-bold text-[var(--accent-blue)]">
                      {beta.toFixed(2)} mnt^-1
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.65}
                    step={0.01}
                    value={beta}
                    onChange={(e) => setBeta(parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-sub text-[var(--text-secondary)] inline-flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[var(--accent-red)]" />
                      Fraksi Migrasi Antrean (gamma)
                    </span>
                    <span className="font-mono-num font-bold text-[var(--accent-red)]">
                      {(gamma * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.35}
                    max={1.0}
                    step={0.01}
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-sub text-[var(--text-secondary)]">
                      Pengali Lonjakan Permintaan
                    </span>
                    <span className="font-mono-num font-bold text-amber-600 dark:text-amber-400">
                      {shockFactor.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.8}
                    step={0.05}
                    value={shockFactor}
                    onChange={(e) => setShockFactor(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              <div className="py-3 px-4 border-l-2 border-[var(--accent-red)] bg-[var(--bg-subtle)]/70">
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Formula Efek Domino Huff
                </div>
                <div className="font-mono-num text-[11px] font-medium text-[var(--text-primary)] mt-1">
                  P(i-&gt;j) = C_j^1.0 · exp(-{beta.toFixed(2)}·t_ij) / Sum_l
                </div>
                <div className="font-mono-num text-[11px] font-medium text-[var(--text-primary)] mt-0.5">
                  D_eff,j = D_base,j + {gamma.toFixed(2)}·DeltaD_i·P(i-&gt;j)
                </div>
              </div>
            </div>

            {/* Right Spillover Redistribution Table */}
            <div className="xl:col-span-8">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
                <h3 className="font-sub text-sm font-semibold text-[var(--text-primary)]">
                  Proyeksi Pelimpahan ke {huffResults.length} SPBU Tetangga Terdekat
                </h3>
                <span className="text-[11px] font-mono-num text-[var(--text-muted)]">
                  Asumsi S_initial = 45% kapasitas tangki
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)] text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-3 px-2">SPBU Terdampak</th>
                      <th className="py-3 px-2 text-right">Jarak OSRM</th>
                      <th className="py-3 px-2 text-right">Share P(i-&gt;j)</th>
                      <th className="py-3 px-2 text-right">Limpahan (+KL/j)</th>
                      <th className="py-3 px-2 text-right">TTD Awal -&gt; Domino</th>
                      <th className="py-3 px-2 text-right">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {huffResults.map((res) => {
                      const pctDrop =
                        res.baselineTtdHr > 0
                          ? ((res.baselineTtdHr - res.postSpilloverTtdHr) / res.baselineTtdHr) * 100
                          : 0;
                      const isCritical = res.postSpilloverTtdHr <= 12;
                      return (
                        <tr
                          key={res.station.id}
                          onClick={() => onInspectMap({ type: 'spbu', data: res.station })}
                          className="hover:bg-[var(--bg-subtle)]/70 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-2">
                            <div className="font-medium text-[var(--text-primary)]">
                              <span className="font-mono-num text-[var(--accent-blue)] mr-1.5">
                                {res.station.id}
                              </span>
                              {res.station.name}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              Tangki {res.station.cap} KL · {res.station.kab}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono-num">
                            {res.travelMinutes} mnt
                            <span className="block text-[10px] text-[var(--text-muted)]">
                              {res.distanceKm} km
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-mono-num font-semibold">
                            {(res.spilloverShare * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-2 text-right font-mono-num font-semibold text-[var(--accent-red)]">
                            +{res.addedFlowKlHr.toFixed(3)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono-num">
                            <span className="text-[var(--text-muted)]">{res.baselineTtdHr}j</span>
                            <span className="mx-1 text-[var(--text-muted)]">-&gt;</span>
                            <span
                              className={cn(
                                'font-bold',
                                isCritical ? 'text-[var(--accent-red)]' : 'text-[var(--text-primary)]'
                              )}
                            >
                              {res.postSpilloverTtdHr}j
                            </span>
                            <span className="block text-[10px] text-[var(--accent-red)]">
                              -{pctDrop.toFixed(1)}% TTD
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Badge variant={isCritical ? 'red' : 'amber'}>
                              {isCritical ? 'Kritis Domino' : 'Waspada'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 3: DIGITAL TWIN 240-HOUR SIMULATION */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <EditorialHeader
              eyebrow="Digital Twin 240 Jam (10 Hari)"
              title="Dinamika Stok ATG Tangki Pendam & Beban Spillover Per Jam"
              description="Observasi interaksi langsung antara deplesi normal (base flow) dan lonjakan spillover dari SPBU sekitar sebelum dispatch TBBM tiba."
            />
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <select
                value={simStationId}
                onChange={(e) => setSimStationId(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs font-mono-num text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              >
                {stationIds.map((id) => (
                  <option key={id} value={id}>
                    Sample Digital Twin: {id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-9 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stationSeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stockFillClean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0052a3" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0052a3" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="spillFillClean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={23} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="stock"
                    name="Stok ATG (KL)"
                    stroke="#0052a3"
                    strokeWidth={2}
                    fill="url(#stockFillClean)"
                  />
                  <Area
                    type="monotone"
                    dataKey="spillover"
                    name="Beban Spillover (KL/jam)"
                    stroke="#dc2626"
                    strokeWidth={1.6}
                    fill="url(#spillFillClean)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-3 space-y-5 lg:border-l border-[var(--border-hairline)] lg:pl-6">
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  TTD Minimum Tersisa
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-red)] mt-1">
                  {peakSimStats.minTtd.toFixed(1)} jam
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Titik genting sepanjang simulasi 240 jam.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border-hairline)]">
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Puncak Spillover Masuk
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--text-primary)] mt-1">
                  +{peakSimStats.maxSpill.toFixed(2)} KL/jam
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Tambahan arus kendaraan dari SPBU sekitar.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border-hairline)]">
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Durasi Episode Stockout
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {peakSimStats.stockoutHours} jam
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Sebelum penjadwalan ulang kluster HDBSCAN.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 4: 38 HDBSCAN CLUSTERS & 18 ISOLATED BOTTLENECKS EXPLORER */}
      <section className="bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-hairline)] mb-6">
            <EditorialHeader
              eyebrow="Audit Simpul Lengkap"
              title="38 Kluster Penyangga & 18 SPBU Bottleneck Terisolasi"
              description="Klik baris mana pun untuk menyorot lokasi koordinat dan metrik kuotanya di inspektor utama."
            />

            <div className="flex items-center gap-6 border-b border-transparent shrink-0">
              <button
                onClick={() => setActiveTableTab('clusters')}
                className={cn(
                  'pb-2 text-xs font-sub font-semibold inline-flex items-center gap-1.5 border-b-2 transition-colors',
                  activeTableTab === 'clusters'
                    ? 'border-[var(--accent-blue)] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>38 Kluster HDBSCAN</span>
              </button>
              <button
                onClick={() => setActiveTableTab('bottlenecks')}
                className={cn(
                  'pb-2 text-xs font-sub font-semibold inline-flex items-center gap-1.5 border-b-2 transition-colors',
                  activeTableTab === 'bottlenecks'
                    ? 'border-[var(--accent-red)] text-[var(--accent-red)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>18 Isolated Bottleneck (-1)</span>
              </button>
            </div>
          </div>

          {activeTableTab === 'clusters' ? (
            <DataTable
              data={clustersRanking}
              columns={clusterCols}
              rowKey={(r) => r.cluster_id}
              searchPlaceholder="Filter 38 kluster (nama, TBBM, Tier)..."
              searchMatcher={(r, q) =>
                `${r.cluster_id} ${r.cluster_name} ${r.primary_tbbm_name} ${r.Priority_Tier}`
                  .toLowerCase()
                  .includes(q)
              }
              onRowClick={(r) => onInspectMap({ type: 'cluster', data: r })}
              maxHeightClass="max-h-[460px]"
            />
          ) : (
            <DataTable
              data={isolatedBottlenecks}
              columns={bottleneckCols}
              rowKey={(r) => r.spbu_id}
              searchPlaceholder="Cari SPBU terisolasi (Pacitan, Trenggalek, Situbondo, Sumenep)..."
              searchMatcher={(r, q) =>
                `${r.spbu_id} ${r.name} ${r.kabkota_name} ${r.nearest_tbbm_id}`
                  .toLowerCase()
                  .includes(q)
              }
              maxHeightClass="max-h-[460px]"
            />
          )}
        </div>
      </section>
    </div>
  );
}
