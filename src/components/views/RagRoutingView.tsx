import { useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  RotateCcw,
  Route as RouteIcon,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { cvrptwRoutes, ragKnowledgeBase } from '../../data';
import type { CvrptwRoute } from '../../types/muara';
import { cn } from '../../utils/cn';
import { matchRagKnowledgeBase } from '../../utils/huff';
import { Badge } from '../ui/Badge';
import { DataTable, type ColumnDef } from '../ui/DataTable';

const INCIDENT_PRESETS = [
  {
    label: 'Banjir Porong + Antrean Pantura',
    text: 'Laporan AMT: genangan banjir > 35 cm di koridor Porong dan kemacetan arteri Pantura. TTD Kluster Tier 1 < Lead Time TBBM dengan hujan ekstrem ERA5 > 15 mm/jam. Mohon aktivasi alih suplai lintas TBBM.',
  },
  {
    label: 'SPBU Arteri <12% + Bottleneck Pacitan',
    text: 'Laporan operator SPBU arteri stok tangki pendam < 12% dengan antrean panjang, dan Isolated Bottleneck SPBU jalur lintas selatan Pacitan menyentuh ambang 30% safety buffer.',
  },
  {
    label: 'Longsor Jalur Gumitir (Tapal Kuda)',
    text: 'Hambatan jalur arteri Gumitir menuju Jember akibat hujan ekstrem ERA5. Pertimbangkan rerouting CVRPTW dan verifikasi batas kelas jalan truk 16 KL serta jam kerja AMT <= 8 jam.',
  },
];

export function RagRoutingView() {
  const [incidentText, setIncidentText] = useState(INCIDENT_PRESETS[0].text);
  const [approvedDocId, setApprovedDocId] = useState<string | null>(null);
  const [tbbmFilter, setTbbmFilter] = useState<string>('ALL');

  const ragMatches = useMemo(
    () => matchRagKnowledgeBase(incidentText, ragKnowledgeBase),
    [incidentText]
  );

  const topMatch = ragMatches[0];
  const isApproved = approvedDocId === topMatch?.doc.doc_id;

  const filteredRoutes = useMemo(() => {
    if (tbbmFilter === 'ALL') return cvrptwRoutes;
    return cvrptwRoutes.filter((r) => r.tbbm_origin === tbbmFilter);
  }, [tbbmFilter]);

  const routeStats = useMemo(() => {
    const totalSaved = filteredRoutes.reduce((acc, r) => acc + r.distance_saved_km, 0);
    const avgShift =
      filteredRoutes.reduce((acc, r) => acc + r.total_amt_shift_hr, 0) /
      Math.max(1, filteredRoutes.length);
    return { totalSaved, avgShift };
  }, [filteredRoutes]);

  const routeCols: ColumnDef<CvrptwRoute>[] = [
    {
      key: 'route_id',
      header: 'ID Rute',
      sortValue: (r) => r.route_id,
      render: (r) => (
        <span className="font-mono-num font-semibold text-blue-600 dark:text-blue-400">
          {r.route_id}
        </span>
      ),
    },
    {
      key: 'origin',
      header: 'TBBM Asal → Koridor',
      sortValue: (r) => r.tbbm_origin,
      render: (r) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">
            <span className="font-mono-num mr-1.5">{r.tbbm_origin}</span>→ {r.target_cluster_id}
          </div>
          <div className="text-[11px] text-zinc-500">{r.target_corridor}</div>
        </div>
      ),
    },
    {
      key: 'stops',
      header: 'Multi-Drop Stops',
      render: (r) => (
        <span className="font-mono-num text-[11px] text-zinc-700 dark:text-zinc-300">
          {r.multi_drop_stops}
        </span>
      ),
    },
    {
      key: 'cap',
      header: 'Tangki',
      align: 'right',
      sortValue: (r) => r.assigned_truck_capacity_kl,
      render: (r) => <Badge variant="neutral">{r.assigned_truck_capacity_kl} KL</Badge>,
    },
    {
      key: 'saved',
      header: 'Jarak Dihemat',
      align: 'right',
      sortValue: (r) => r.distance_saved_km,
      render: (r) => (
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          -{r.distance_saved_km.toFixed(1)} km
        </span>
      ),
    },
    {
      key: 'shift',
      header: 'Shift AMT',
      align: 'right',
      sortValue: (r) => r.total_amt_shift_hr,
      render: (r) => <span>{r.total_amt_shift_hr.toFixed(2)} jam</span>,
    },
    {
      key: 'hsse',
      header: 'HSSE ≤8j',
      align: 'center',
      render: () => <Badge variant="green">100% Patuh</Badge>,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Human-in-the-Loop RAG Dispatcher Copilot */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Input Laporan Collective Intelligence (AMT / SPBU)
              </h2>
            </div>
            <Badge variant="blue">Threshold cos ≥ 0,78</Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {INCIDENT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setIncidentText(p.text);
                  setApprovedDocId(null);
                }}
                className="px-2.5 py-1 rounded-md text-[11px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-colors text-zinc-700 dark:text-zinc-300"
              >
                {p.label}
              </button>
            ))}
          </div>

          <textarea
            rows={4}
            value={incidentText}
            onChange={(e) => {
              setIncidentText(e.target.value);
              setApprovedDocId(null);
            }}
            placeholder="Ketik laporan hambatan jalan, cuaca, atau lonjakan antrean SPBU..."
            className="w-full p-3 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 leading-relaxed"
          />

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Korpus SOP: {ragKnowledgeBase.length} Dokumen Resmi Pertamina Patra Niaga</span>
            <span className="font-mono-num">
              I_approve = {isApproved ? '1 (AKTIF)' : '0 (MENUNGGU)'}
            </span>
          </div>
        </div>

        {/* RAG Retrieval & Human-in-the-Loop Approval Output */}
        <div className="xl:col-span-7 bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Rekomendasi SOP RAG Dispatcher Copilot & Penyeimbang MyPertamina
              </h2>
            </div>
            {topMatch && (
              <Badge variant={topMatch.cosineScore >= 0.78 ? 'green' : 'amber'}>
                Cosine Similarity: {topMatch.cosineScore.toFixed(2)}
              </Badge>
            )}
          </div>

          {topMatch && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono-num text-xs font-bold text-blue-600 dark:text-blue-400">
                    {topMatch.doc.doc_id}
                  </span>
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {topMatch.doc.category}
                  </span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  <strong className="text-zinc-900 dark:text-zinc-100">Pemicu: </strong>
                  {topMatch.doc.trigger_condition}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  <strong className="text-zinc-900 dark:text-zinc-100">Protokol Aksi: </strong>
                  {topMatch.doc.action_protocol}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md px-2.5 py-1.5">
                  <strong>Kepatuhan HSSE: </strong>
                  {topMatch.doc.hsse_rule}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Pembaruan Bobot Jalan Dinamis d'OSRM
                  </div>
                  <div className="mt-1 font-mono-num font-semibold text-zinc-900 dark:text-zinc-100">
                    d'(u,v) = d(u,v) × (1 + {isApproved ? `1 × ${topMatch.phiRagPenalty}` : '0'})
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Penalti koridor terhambat: {isApproved ? `+${(topMatch.phiRagPenalty * 100).toFixed(0)}%` : 'Belum diaktifkan'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
                    <Smartphone className="w-3 h-3 text-blue-500" />
                    Insentif Antrean MyPertamina
                  </div>
                  <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                    {topMatch.myPertaminaDiscount}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Status: {isApproved ? 'Terkirim ke pengguna radius 5 km' : 'Menunggu persetujuan dispatcher'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={() => setApprovedDocId(topMatch.doc.doc_id)}
                  disabled={isApproved}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.99]',
                    isApproved
                      ? 'bg-emerald-600/15 text-emerald-500 border border-emerald-500/30 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isApproved
                    ? 'Disetujui Dispatcher (I_approve = 1 · Rute Diperbarui)'
                    : 'Setujui & Terapkan ke Solver CVRPTW (I_approve = 1)'}
                </button>

                {isApproved && (
                  <button
                    onClick={() => setApprovedDocId(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Simulasi
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optimized CVRPTW Routes Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Sampel Penjadwalan Armada MILP OR-Tools CVRPTW (45 Rute Multi-Drop)
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono-num text-emerald-600 dark:text-emerald-400">
              Total dihemat: {routeStats.totalSaved.toFixed(1)} km · Rata-rata shift:{' '}
              {routeStats.avgShift.toFixed(2)} jam
            </span>
            <select
              value={tbbmFilter}
              onChange={(e) => setTbbmFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 font-mono-num text-xs"
            >
              <option value="ALL">Semua 7 TBBM</option>
              <option value="TBBM_01">TBBM_01 (Surabaya)</option>
              <option value="TBBM_02">TBBM_02 (Tuban)</option>
              <option value="TBBM_03">TBBM_03 (Malang)</option>
              <option value="TBBM_04">TBBM_04 (Madiun)</option>
              <option value="TBBM_05">TBBM_05 (Kediri)</option>
              <option value="TBBM_06">TBBM_06 (Camplong)</option>
              <option value="TBBM_07">TBBM_07 (Tanjung Wangi)</option>
            </select>
          </div>
        </div>

        <DataTable
          data={filteredRoutes}
          columns={routeCols}
          rowKey={(r) => r.route_id}
          searchPlaceholder="Cari ID rute, koridor, atau kode SPBU..."
          searchMatcher={(r, q) =>
            `${r.route_id} ${r.tbbm_origin} ${r.target_corridor} ${r.multi_drop_stops}`
              .toLowerCase()
              .includes(q)
          }
        />
      </div>
    </div>
  );
}

