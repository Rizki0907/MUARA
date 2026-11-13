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
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { Badge } from '../ui/Badge';
import { DataTable, type ColumnDef } from '../ui/DataTable';
import { EditorialHeader, Reveal } from '../ui/MotionPrimitives';

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
        <span className="font-mono-num font-semibold text-[var(--accent-blue)]">
          {r.route_id}
        </span>
      ),
    },
    {
      key: 'origin',
      header: 'TBBM Asal -> Koridor',
      sortValue: (r) => r.tbbm_origin,
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">
            <span className="font-mono-num mr-1.5">{r.tbbm_origin}</span>-&gt;{' '}
            {r.target_cluster_id}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">{r.target_corridor}</div>
        </div>
      ),
    },
    {
      key: 'stops',
      header: 'Multi-Drop Stops',
      render: (r) => (
        <span className="font-mono-num text-[11px] text-[var(--text-secondary)]">
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
        <span className="font-mono-num text-[var(--accent-green)] font-semibold">
          -{r.distance_saved_km.toFixed(1)} km
        </span>
      ),
    },
    {
      key: 'shift',
      header: 'Shift AMT',
      align: 'right',
      sortValue: (r) => r.total_amt_shift_hr,
      render: (r) => <span className="font-mono-num">{r.total_amt_shift_hr.toFixed(2)} jam</span>,
    },
    {
      key: 'hsse',
      header: 'HSSE <= 8j',
      align: 'center',
      render: () => <Badge variant="green">100% Patuh</Badge>,
    },
  ];

  const tbbms = ['ALL', 'TBBM_01', 'TBBM_02', 'TBBM_03', 'TBBM_04', 'TBBM_05', 'TBBM_06', 'TBBM_07'];

  return (
    <div className="w-full">
      {/* BAND 1: EDITORIAL FRAMING ON TACIT KNOWLEDGE & CVRPTW */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <EditorialHeader
                  eyebrow="Modul 04 & 05 · Collective Intelligence & OR-Tools CVRPTW"
                  title="Dari Pengetahuan Tacit Lapangan ke Rute Multi-Drop Bebas Pelanggaran HSSE"
                  description="Sistem dispatch klasik kerap gagal karena mengabaikan pengetahuan tacit pengawas SPBU dan Awak Mobil Tangki (AMT). MUARA menggabungkan RAG Dispatcher berbasis SOP Pertamina Patra Niaga (ambang kosinus >= 0,78 dan gerbang persetujuan I_approve = 1) langsung ke fungsi biaya jalan MILP CVRPTW + Guided Local Search."
                  accent="blue"
                />
              </Reveal>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-5 border-t lg:border-t-0 lg:border-l border-[var(--border-hairline)] pt-5 lg:pt-0 lg:pl-8">
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Utilisasi Armada
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-blue)] mt-1">
                  <AnimatedCounter value={94.8} decimals={1} suffix="%" />
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">16 / 24 / 32 KL</div>
              </div>
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Pelanggaran HSSE &gt;8j
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-green)] mt-1">
                  0,0%
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">vs FCFS 11,4%</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Settling &amp; Unload
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--text-primary)] mt-1">
                  45 mnt
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Hard constraint</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 2: INTERACTIVE HUMAN-IN-THE-LOOP RAG COPILOT */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Incident Composer */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
                <span className="text-xs font-sub font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[var(--accent-blue)]" />
                  Input Laporan Lapangan (WhatsApp / Radio AMT)
                </span>
                <button
                  onClick={() => {
                    setIncidentText(INCIDENT_PRESETS[0].text);
                    setApprovedDocId(null);
                  }}
                  className="text-[11px] font-sub text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {INCIDENT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setIncidentText(preset.text);
                      setApprovedDocId(null);
                    }}
                    className="px-2.5 py-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[11px] font-sub text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <textarea
                value={incidentText}
                onChange={(e) => {
                  setIncidentText(e.target.value);
                  setApprovedDocId(null);
                }}
                rows={4}
                className="w-full p-3.5 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs leading-relaxed text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                placeholder="Ketik laporan kendala operator SPBU atau AMT di koridor Jawa Timur..."
              />

              <div className="py-3 px-4 border-l-2 border-[var(--accent-blue)] bg-[var(--bg-subtle)]/70">
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Formula Penalti Dinamis CVRPTW (Persetujuan Dispatcher)
                </div>
                <div className="font-mono-num text-xs font-semibold text-[var(--text-primary)] mt-1">
                  d&apos;_OSRM(u,v) = d_OSRM(u,v) · (1 + phi_RAG(u,v) · I_approve)
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  Ketika dispatcher belum menyetujui (I_approve = 0), AI tidak boleh mengubah rute
                  secara sepihak demi akuntabilitas tata kelola HSSE.
                </p>
              </div>
            </div>

            {/* Right Retrieved SOP & MyPertamina Demand-Shaping Response */}
            <div className="lg:col-span-7 lg:border-l border-[var(--border-hairline)] lg:pl-10 space-y-6">
              {topMatch && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
                    <div>
                      <div className="text-[11px] font-mono-num text-[var(--accent-blue)]">
                        {topMatch.doc.doc_id} · {topMatch.doc.category}
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl text-[var(--text-primary)] mt-1">
                        {topMatch.doc.trigger_condition}
                      </h3>
                    </div>
                    <Badge variant={topMatch.cosineScore >= 0.78 ? 'green' : 'amber'}>
                      Cosine {(topMatch.cosineScore * 100).toFixed(0)}% (&gt;= 78% Gate)
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                        Protokol Tindakan SOP Disarankan
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--text-primary)] mt-1.5">
                        {topMatch.doc.action_protocol}
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--accent-red)] inline-flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Batasan Keras HSSE Patra Niaga
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--text-secondary)] mt-1.5">
                        {topMatch.doc.hsse_rule}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-hairline)] grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                    <div className="space-y-1">
                      <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)] inline-flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                        Demand-Shaping MyPertamina (Insentif Poin)
                      </div>
                      <p className="text-xs text-[var(--text-primary)] font-medium">
                        {topMatch.myPertaminaDiscount}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="text-xs font-mono-num">
                        phi_RAG(u,v) ={' '}
                        <strong className="text-[var(--accent-blue)]">
                          +{topMatch.phiRagPenalty.toFixed(2)}
                        </strong>{' '}
                        ·{' '}
                        <span
                          className={
                            isApproved
                              ? 'text-[var(--accent-green)] font-bold'
                              : 'text-amber-600 dark:text-amber-400 font-semibold'
                          }
                        >
                          I_approve = {isApproved ? '1 (DISETUJUI)' : '0 (MENUNGGU)'}
                        </span>
                      </div>

                      <button
                        onClick={() => setApprovedDocId(isApproved ? null : topMatch.doc.doc_id)}
                        className={cn(
                          'px-4 py-2 rounded-md text-xs font-sub font-semibold inline-flex items-center gap-2 transition-colors',
                          isApproved
                            ? 'bg-[var(--accent-green)] text-white'
                            : 'bg-[var(--accent-blue)] text-white hover:opacity-95'
                        )}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isApproved
                          ? 'Disetujui -> Penalti Rute Aktif di Solver'
                          : 'Setujui & Injeksi Penalti ke OR-Tools CVRPTW'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BAND 3: CVRPTW MULTI-DROP DISPATCH SCHEDULE TABLE */}
      <section className="bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-hairline)] mb-6">
            <EditorialHeader
              eyebrow="Jadwal Optimasi OR-Tools MILP + GLS"
              title="Daftar Rute Multi-Drop Tangki Kompartemen (16 / 24 / 32 KL)"
              description="Saring berdasarkan Terminal BBM asal untuk memeriksa jarak yang dihemat vs skenario single-drop reaktif (1,65x/km) dan kepatuhan shift HSSE 8 jam."
            />

            <div className="flex flex-wrap items-center gap-4 shrink-0 text-xs font-mono-num">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] font-sub uppercase">
                  Jarak Dihemat (Batch)
                </span>
                <strong className="text-lg text-[var(--accent-green)]">
                  -{routeStats.totalSaved.toFixed(1)} km
                </strong>
              </div>
              <div className="pl-4 border-l border-[var(--border-hairline)]">
                <span className="text-[var(--text-muted)] block text-[10px] font-sub uppercase">
                  Rerata Shift AMT
                </span>
                <strong className="text-lg text-[var(--text-primary)]">
                  {routeStats.avgShift.toFixed(2)} jam
                </strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            {tbbms.map((t) => (
              <button
                key={t}
                onClick={() => setTbbmFilter(t)}
                className={cn(
                  'px-3 py-1 rounded text-[11px] font-mono-num transition-colors border',
                  tbbmFilter === t
                    ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] font-semibold'
                    : 'bg-transparent border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                )}
              >
                {t === 'ALL' ? 'Semua 7 TBBM' : t}
              </button>
            ))}
          </div>

          <DataTable
            data={filteredRoutes}
            columns={routeCols}
            rowKey={(r) => r.route_id}
            searchPlaceholder="Cari ID rute, koridor, atau ID SPBU tujuan..."
            searchMatcher={(r, q) =>
              `${r.route_id} ${r.tbbm_origin} ${r.target_corridor} ${r.multi_drop_stops}`
                .toLowerCase()
                .includes(q)
            }
            maxHeightClass="max-h-[460px]"
            toolbarRight={
              <span className="inline-flex items-center gap-1.5 text-[11px] font-sub text-[var(--text-muted)]">
                <RouteIcon className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                Model C (MILP + GLS): 0,0% pelanggaran shift &gt; 8 jam
              </span>
            }
          />
        </div>
      </section>
    </div>
  );
}
