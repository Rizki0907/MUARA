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

  const affectedCriticalCount = useMemo(
    () => huffResults.filter((r) => r.postSpilloverTtdHr <= 12).length,
    [huffResults]
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
      header: 'Urutan',
      align: 'center',
      sortValue: (r) => r.Rank,
      render: (r) => <span className="font-mono-num text-[var(--text-muted)]">#{r.Rank}</span>,
    },
    {
      key: 'name',
      header: 'Zona Penyangga (38 Kluster)',
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
      header: 'Tingkat Risiko',
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
      header: 'Skor Risiko',
      align: 'right',
      sortValue: (r) => r.MUARA_Score,
      render: (r) => <span className="font-mono-num font-bold">{r.MUARA_Score.toFixed(2)}</span>,
    },
    {
      key: 'spbu_count',
      header: 'Jumlah SPBU',
      align: 'right',
      sortValue: (r) => r.spbu_count,
      render: (r) => <span className="font-mono-num">{r.spbu_count}</span>,
    },
    {
      key: 'tbbm',
      header: 'Terminal Pemasok',
      sortValue: (r) => r.primary_tbbm_name,
      render: (r) => <span className="text-xs text-[var(--text-secondary)]">{r.primary_tbbm_name}</span>,
    },
    {
      key: 'mean_ttd_hr',
      header: 'Rata-rata Sisa Jam',
      align: 'right',
      sortValue: (r) => r.mean_ttd_hr,
      render: (r) => <span className="font-mono-num">{r.mean_ttd_hr.toFixed(2)} jam</span>,
    },
    {
      key: 'cascading',
      header: 'Durasi Domino (30h)',
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
      header: 'Kode SPBU',
      sortValue: (r) => r.spbu_id,
      render: (r) => (
        <span className="font-mono-num text-[var(--accent-red)] font-semibold">{r.spbu_id}</span>
      ),
    },
    {
      key: 'name',
      header: 'Nama SPBU & Wilayah',
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{r.name}</div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {r.kabkota_name} · Jalan {r.road_class}
          </div>
        </div>
      ),
    },
    {
      key: 'tbbm',
      header: 'Depot & Jarak Tempuh',
      sortValue: (r) => r.dist_to_tbbm_km,
      render: (r) => (
        <span className="font-mono-num">
          {r.nearest_tbbm_id} ({r.dist_to_tbbm_km} km · {r.tbbm_lead_time_hr} jam)
        </span>
      ),
    },
    {
      key: 'cap',
      header: 'Tangki / Penjualan Harian',
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
      header: 'Proteksi Cadangan',
      align: 'right',
      render: (r) => (
        <Badge variant="red">{(r.safety_stock_buffer_pct * 100).toFixed(0)}% (+20% Ekstra)</Badge>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* BAND 1: EDITORIAL FRAMING + PERTAMINA NOZZLE PHOTO */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <Reveal>
                <EditorialHeader
                  eyebrow="Simulasi Kelangkaan & Penyebaran Antrean"
                  title="Bagaimana Satu SPBU Kosong Menguras Tangki SPBU di Sekitarnya?"
                  description="Ketika satu SPBU kehabisan Pertalite atau Biosolar, pengendara berpindah ke SPBU terdekat berkapasitas besar. Di halaman ini Anda dapat mensimulasikan seberapa cepat efek domino tersebut terjadi dan bagaimana 38 zona penyangga HDBSCAN menahannya."
                  accent="red"
                />
              </Reveal>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-4 border-t border-[var(--border-hairline)]">
                <div>
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    Kualitas Klaster
                  </div>
                  <div className="font-mono-num text-2xl font-bold text-[var(--accent-blue)] mt-1">
                    0,678
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Road Silhouette (DBI 0,624)</div>
                </div>
                <div>
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    Limpahan Tertahan
                  </div>
                  <div className="font-mono-num text-2xl font-bold text-[var(--accent-green)] mt-1">
                    94,2%
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Dalam 38 zona penyangga</div>
                </div>
                <div>
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    Porsi Warga Pindah
                  </div>
                  <div className="font-mono-num text-2xl font-bold text-[var(--text-primary)] mt-1">
                    82%
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">gamma = 0,82 (beta = 0,35)</div>
                </div>
                <div>
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    SPBU Terpencil
                  </div>
                  <div className="font-mono-num text-2xl font-bold text-[var(--accent-red)] mt-1">
                    18 lokasi
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Buffer +20% (reorder 30%)</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <figure className="relative overflow-hidden border border-[var(--border-hairline)] bg-[var(--bg-subtle)]">
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <img
                    src="/images/pertamina-nozzle.jpg"
                    alt="Dispenser dan nozzle pengisian Pertalite JBKP dan Biosolar JBT di SPBU Pertamina"
                    className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
                <figcaption className="absolute bottom-0 inset-x-0 p-4 text-white">
                  <div className="text-[10px] font-sub uppercase tracking-[0.14em] text-white/80 mb-1">
                    Insight Utama
                  </div>
                  <p className="text-xs leading-snug">
                    Antrean tidak berhenti saat tangki kosong—melainkan tumpah ke SPBU tetangga.
                    MUARA mengisi SPBU tetangga lebih dulu sebelum limpahan itu menghabiskannya.
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 2: INTERACTIVE MODIFIED HUFF SIMULATOR */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
            <EditorialHeader
              eyebrow="Simulasi Interaktif"
              title="Uji Dampak Jika Satu SPBU Kehabisan Stok"
              description="Pilih satu SPBU bermasalah di bawah, lalu geser tiga pengaturan untuk melihat SPBU mana di sekitarnya yang akan kebanjiran pembeli dan seberapa cepat tangkinya menyusut."
            />
            <button
              onClick={() => onInspectMap({ type: 'spbu', data: sourceSpbu })}
              className="inline-flex items-center gap-1.5 text-xs font-sub font-semibold text-[var(--accent-blue)] hover:underline shrink-0"
            >
              Tampilkan {sourceSpbu.id} di Peta Utama
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pt-8">
            <div className="xl:col-span-4 space-y-6 xl:border-r border-[var(--border-hairline)] xl:pr-8">
              <div>
                <label className="text-[11px] font-sub font-semibold uppercase tracking-wider text-[var(--text-primary)] block mb-1.5">
                  1. Pilih SPBU yang Mengalami Kekosongan
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
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                  Zona <strong className="text-[var(--text-primary)]">{sourceSpbu.cl}</strong> ·
                  Kebutuhan puncak{' '}
                  <span className="font-mono-num">{(sourceSpbu.dPeak / 24).toFixed(2)} KL/jam</span>{' '}
                  · Ada {sourceSpbu.nbrs} SPBU lain dalam radius 15 menit.
                </p>
              </div>

              <div className="space-y-5 pt-4 border-t border-[var(--border-hairline)]">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-sub font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                      Enggan Pergi Jauh (beta)
                    </span>
                    <span className="font-mono-num font-bold text-[var(--accent-blue)]">
                      {beta.toFixed(2)}
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
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Semakin tinggi angkanya, warga hanya mau pindah ke SPBU paling dekat saja.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-sub font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[var(--accent-red)]" />
                      Persentase Warga yang Pindah (gamma)
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
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Berapa persen pembeli dari SPBU kosong yang langsung mengantre ke sebelah.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-sub font-semibold text-[var(--text-primary)]">
                      Kenaikan Keramaian / Shock Harian
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
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    1,00x = normal; &gt;1,28x = kondisi lonjakan arus mudik / libur panjang.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-hairline)]">
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--accent-red)] font-semibold">
                  Kesimpulan Cepat Skenario Ini
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)] mt-1">
                  Dengan parameter ini,{' '}
                  <strong className="text-[var(--text-primary)]">
                    {affectedCriticalCount} dari {huffResults.length} SPBU tetangga
                  </strong>{' '}
                  langsung masuk zona kritis (sisa ketahanan tangki &le; 12 jam) bila truk
                  suplai terlambat dikirim.
                </p>
              </div>
            </div>

            <div className="xl:col-span-8">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
                <h3 className="font-sub text-sm font-semibold text-[var(--text-primary)]">
                  Daftar {huffResults.length} SPBU Tetangga yang Terimbas Antrean
                </h3>
                <span className="text-[11px] font-mono-num text-[var(--text-muted)]">
                  Kondisi awal tangki diset pada sisa 45%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)] text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-3 px-2">SPBU Tetangga Terdampak</th>
                      <th className="py-3 px-2 text-right">Waktu Tempuh</th>
                      <th className="py-3 px-2 text-right">Porsi Limpahan</th>
                      <th className="py-3 px-2 text-right">Beban Ekstra</th>
                      <th className="py-3 px-2 text-right">Sisa Jam (Awal -&gt; Imbas)</th>
                      <th className="py-3 px-2 text-right">Status</th>
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
                            +{res.addedFlowKlHr.toFixed(3)} KL/j
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
                              Habis {pctDrop.toFixed(0)}% lebih cepat
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
              eyebrow="Rekaman Simulasi 10 Hari (240 Jam)"
              title="Pergerakan Isi Tangki vs Lonjakan Antrean Pindahan Per Jam"
              description="Grafik biru menunjukkan sisa stok tangki (KL) dari sensor ATG, sedangkan garis merah menunjukkan tambahan arus kendaraan dari SPBU lain."
            />
            <select
              value={simStationId}
              onChange={(e) => setSimStationId(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs font-mono-num text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] shrink-0"
            >
              {stationIds.map((id) => (
                <option key={id} value={id}>
                  Sampel Sensor: {id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-9 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stationSeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stockFillClean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#004c97" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#004c97" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="spillFillClean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c41d1d" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#c41d1d" stopOpacity={0.04} />
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
                    name="Stok Tangki ATG (KL)"
                    stroke="#004c97"
                    strokeWidth={2}
                    fill="url(#stockFillClean)"
                  />
                  <Area
                    type="monotone"
                    dataKey="spillover"
                    name="Tambahan Antrean Limpahan (KL/jam)"
                    stroke="#c41d1d"
                    strokeWidth={1.6}
                    fill="url(#spillFillClean)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-3 space-y-5 lg:border-l border-[var(--border-hairline)] lg:pl-6">
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Titik Terkritis Sepanjang 10 Hari
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-red)] mt-1">
                  {peakSimStats.minTtd.toFixed(1)} jam
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Waktu ketahanan tangki paling tipis sebelum isi ulang masuk.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border-hairline)]">
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Lonjakan Limpahan Puncak
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--text-primary)] mt-1">
                  +{peakSimStats.maxSpill.toFixed(2)} KL/jam
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Tambahan konsumsi ekstra per jam akibat SPBU sekitar habis.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border-hairline)]">
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Total Jam Terdampak
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {peakSimStats.stockoutHours} jam
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Berhasil ditekan turun 91,4% setelah optimasi jadwal TBBM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 4: FULL 38 CLUSTERS & 18 ISOLATED BOTTLENECKS */}
      <section className="bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-hairline)] mb-6">
            <EditorialHeader
              eyebrow="Daftar Lengkap Seluruh Zona"
              title="38 Zona Penyangga HDBSCAN & 18 SPBU Terpencil"
              description="Klik baris mana pun untuk melompat langsung ke posisinya di Peta Utama."
            />

            <div className="flex items-center gap-6 shrink-0">
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
                <span>38 Zona Kluster</span>
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
                <span>18 SPBU Terpencil (-1)</span>
              </button>
            </div>
          </div>

          {activeTableTab === 'clusters' ? (
            <DataTable
              data={clustersRanking}
              columns={clusterCols}
              rowKey={(r) => r.cluster_id}
              searchPlaceholder="Cari dari 38 zona (nama kota, terminal TBBM, atau tingkat risiko)..."
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
              searchPlaceholder="Cari SPBU terpencil (mis. Pacitan, Trenggalek, Sumenep)..."
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
