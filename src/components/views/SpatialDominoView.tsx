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
import { AlertTriangle, Flame, Layers, Sliders } from 'lucide-react';
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
    return raw.slice(0, 120).map((pt) => ({
      hour: `J${pt.h}`,
      stock: pt.stk,
      baseFlow: pt.db,
      spillover: pt.sp,
      ttd: pt.ttd,
    }));
  }, [simStationId]);

  const clusterCols: ColumnDef<ClusterRanking>[] = [
    {
      key: 'Rank',
      header: 'Rank',
      align: 'center',
      sortValue: (r) => r.Rank,
      render: (r) => <span className="font-mono-num">#{r.Rank}</span>,
    },
    {
      key: 'name',
      header: 'Kluster HDBSCAN (38)',
      sortValue: (r) => r.cluster_name,
      render: (r) => (
        <div>
          <span className="font-mono-num text-blue-600 dark:text-blue-400 mr-1.5">
            {r.cluster_id}
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{r.cluster_name}</span>
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
      render: (r) => <span className="font-semibold">{r.MUARA_Score.toFixed(2)}</span>,
    },
    {
      key: 'spbus',
      header: 'SPBU',
      align: 'right',
      sortValue: (r) => r.spbu_count,
      render: (r) => <span>{r.spbu_count}</span>,
    },
    {
      key: 'ttd',
      header: 'Mean TTD',
      align: 'right',
      sortValue: (r) => r.mean_ttd_hr,
      render: (r) => <span>{r.mean_ttd_hr} jam</span>,
    },
    {
      key: 'lead',
      header: 'Lead Time TBBM',
      align: 'right',
      sortValue: (r) => r.avg_lead_time_hr,
      render: (r) => <span>{r.avg_lead_time_hr} jam</span>,
    },
  ];

  const bottleneckCols: ColumnDef<IsolatedBottleneck>[] = [
    {
      key: 'id',
      header: 'ID SPBU',
      sortValue: (r) => r.spbu_id,
      render: (r) => (
        <span className="font-mono-num font-semibold text-red-600 dark:text-red-400">
          {r.spbu_id}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nama & Kab/Kota',
      sortValue: (r) => r.kabkota_name,
      render: (r) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.name}</div>
          <div className="text-[11px] text-zinc-500">{r.kabkota_name}</div>
        </div>
      ),
    },
    {
      key: 'road',
      header: 'Kelas Jalan',
      render: (r) => <Badge variant="neutral">{r.road_class}</Badge>,
    },
    {
      key: 'dist',
      header: 'Jarak TBBM',
      align: 'right',
      sortValue: (r) => r.dist_to_tbbm_km,
      render: (r) => <span>{r.dist_to_tbbm_km} km</span>,
    },
    {
      key: 'lead',
      header: 'Lead Time',
      align: 'right',
      sortValue: (r) => r.tbbm_lead_time_hr,
      render: (r) => <span>{r.tbbm_lead_time_hr} jam</span>,
    },
    {
      key: 'buffer',
      header: 'Safety Buffer',
      align: 'right',
      render: (r) => (
        <Badge variant="red">{(r.safety_stock_buffer_pct * 100).toFixed(0)}% (+20%)</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Interactive Modified Huff Spillover Simulator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-4 bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Simulator Modified Huff Spillover
              </h2>
            </div>
            <Badge variant="blue">Persamaan (2)</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                SPBU Sumber Stockout Primer (Kluster Penyangga)
              </label>
              <select
                value={selectedSpbuId}
                onChange={(e) => setSelectedSpbuId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                {highRiskSpbus.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} · {s.kab} ({s.cl} · Peak {s.dPeak} KL/hr)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">Peluruhan Waktu Tempuh (β)</span>
                <span className="font-mono-num font-semibold">{beta.toFixed(2)} mnt⁻¹</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.5}
                step={0.01}
                value={beta}
                onChange={(e) => setBeta(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono-num">
                <span>0,20 (Toleransi Jauh)</span>
                <span>Baseline 0,35</span>
                <span>0,50 (Dekat Saja)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">Retensi Permintaan Jaringan (γ)</span>
                <span className="font-mono-num font-semibold">{(gamma * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.7}
                max={0.95}
                step={0.01}
                value={gamma}
                onChange={(e) => setGamma(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono-num">
                <span>70%</span>
                <span>Baseline 82%</span>
                <span>95%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">Intensitas Guncangan (Shock)</span>
                <span className="font-mono-num font-semibold">{shockFactor.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min={0.85}
                max={1.5}
                step={0.05}
                value={shockFactor}
                onChange={(e) => setShockFactor(Number(e.target.value))}
                className="w-full accent-red-600"
              />
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
              <div className="text-zinc-500">Beban Tak Terlayani (ΔDᵢ):</div>
              <div className="font-mono-num text-sm font-bold text-red-600 dark:text-red-400">
                +{((sourceSpbu.dPeak / 24) * shockFactor * gamma).toFixed(2)} KL/jam meluber
              </div>
              <div className="text-[11px] text-zinc-500">
                Diserap oleh {huffResults.length} SPBU penyangga dalam radius ≤18 menit OSRM.
              </div>
            </div>
          </div>
        </div>

        {/* Spillover Target Redistribution Panel */}
        <div className="xl:col-span-8 bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Distribusi Probabilitas Limpahan P(i → j) & Pemangkasan TTD Tetangga
              </h2>
            </div>
            <span className="text-[11px] font-mono-num text-zinc-500">
              Sumber: {sourceSpbu.id} ({sourceSpbu.cl})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">SPBU Penyangga</th>
                  <th className="py-2 px-3 text-right">Jarak / Waktu</th>
                  <th className="py-2 px-3 text-right">Share P(i→j)</th>
                  <th className="py-2 px-3 text-right">Limpahan (+KL/j)</th>
                  <th className="py-2 px-3 text-right">TTD Awal</th>
                  <th className="py-2 pl-3 text-right">TTD Pasca-Spillover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                {huffResults.map((row) => {
                  const ttdDrop = row.baselineTtdHr - row.postSpilloverTtdHr;
                  return (
                    <tr
                      key={row.station.id}
                      onClick={() => onInspectMap({ type: 'spbu', data: row.station })}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="font-mono-num font-semibold text-zinc-900 dark:text-zinc-100">
                          {row.station.id}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Tangki {row.station.cap} KL · {row.station.kab}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {row.distanceKm} km · {row.travelMinutes} mnt
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${Math.min(100, row.spilloverShare * 100)}%` }}
                            />
                          </div>
                          <span>{(row.spilloverShare * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-amber-600 dark:text-amber-400">
                        +{row.addedFlowKlHr.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-zinc-500">
                        {row.baselineTtdHr} jam
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono-num">
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {row.postSpilloverTtdHr} jam
                        </span>
                        <span className="ml-1.5 text-[10px] text-zinc-500">
                          (-{ttdDrop.toFixed(1)}j)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Digital Twin Hourly Simulation Curve */}
      <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Kurva Dinamika Tangki Pendam ATG & Laju Spillover (Digital Twin 240 Jam Pertama)
            </h2>
            <p className="text-xs text-zinc-500">
              Data historis simulasi 2-jam dari `spbu_hourly_simulation.csv`
            </p>
          </div>
          <select
            value={simStationId}
            onChange={(e) => setSimStationId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono-num"
          >
            {stationIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stationSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,113,122,0.2)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#71717a' }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fafafa',
                }}
              />
              <Area
                type="monotone"
                dataKey="stock"
                name="Stok ATG (KL)"
                stroke="#2589f5"
                fill="#2589f5"
                fillOpacity={0.14}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="ttd"
                name="Time-to-Depletion (Jam)"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.08}
                strokeWidth={1.75}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabbed Tables: All 38 Clusters & 18 Isolated Bottlenecks */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTableTab('clusters')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              activeTableTab === 'clusters'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-[#111114] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            38 Kluster Penyangga HDBSCAN
          </button>
          <button
            onClick={() => setActiveTableTab('bottlenecks')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              activeTableTab === 'bottlenecks'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white dark:bg-[#111114] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            18 Isolated Bottleneck SPBU (Label -1)
          </button>
        </div>

        {activeTableTab === 'clusters' ? (
          <DataTable
            data={clustersRanking}
            columns={clusterCols}
            rowKey={(r) => r.cluster_id}
            searchPlaceholder="Cari kluster atau TBBM (mis. Jember, Surabaya, CL_36)..."
            searchMatcher={(r, q) =>
              `${r.cluster_id} ${r.cluster_name} ${r.primary_tbbm_name}`.toLowerCase().includes(q)
            }
            onRowClick={(r) => onInspectMap({ type: 'cluster', data: r })}
          />
        ) : (
          <DataTable
            data={isolatedBottlenecks}
            columns={bottleneckCols}
            rowKey={(r) => r.spbu_id}
            searchPlaceholder="Cari Isolated Bottleneck SPBU (mis. Pacitan, Trenggalek, Madura)..."
            searchMatcher={(r, q) =>
              `${r.spbu_id} ${r.name} ${r.kabkota_name}`.toLowerCase().includes(q)
            }
            onRowClick={(r) => {
              const found = allSpbus.find((s) => s.id === r.spbu_id);
              if (found) onInspectMap({ type: 'spbu', data: found });
            }}
          />
        )}
      </div>
    </div>
  );
}

