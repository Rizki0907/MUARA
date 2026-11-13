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
    label: 'Banjir Porong + Macet Pantura',
    text: 'Laporan AMT: genangan banjir > 35 cm di koridor Porong dan kemacetan arteri Pantura. TTD Kluster Tier 1 < Lead Time TBBM dengan hujan ekstrem ERA5 > 15 mm/jam. Mohon aktivasi alih suplai lintas TBBM.',
  },
  {
    label: 'SPBU Arteri Menipis + Pacitan',
    text: 'Laporan operator SPBU arteri stok tangki pendam < 12% dengan antrean panjang, dan Isolated Bottleneck SPBU jalur lintas selatan Pacitan menyentuh ambang 30% safety buffer.',
  },
  {
    label: 'Longsor Jalur Gumitir (Jember)',
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
      header: 'Kode Rute',
      sortValue: (r) => r.route_id,
      render: (r) => (
        <span className="font-mono-num font-semibold text-[var(--accent-blue)]">
          {r.route_id}
        </span>
      ),
    },
    {
      key: 'origin',
      header: 'Dari Terminal -> Zona Tujuan',
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
      header: 'Urutan SPBU yang Diisi (Multi-Drop)',
      render: (r) => (
        <span className="font-mono-num text-[11px] text-[var(--text-secondary)]">
          {r.multi_drop_stops}
        </span>
      ),
    },
    {
      key: 'cap',
      header: 'Ukuran Truk',
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
      header: 'Lama Shift Sopir',
      align: 'right',
      sortValue: (r) => r.total_amt_shift_hr,
      render: (r) => <span className="font-mono-num">{r.total_amt_shift_hr.toFixed(2)} jam</span>,
    },
    {
      key: 'hsse',
      header: 'Aturan HSSE <= 8j',
      align: 'center',
      render: () => <Badge variant="green">Patuh 100%</Badge>,
    },
  ];

  const tbbms = ['ALL', 'TBBM_01', 'TBBM_02', 'TBBM_03', 'TBBM_04', 'TBBM_05', 'TBBM_06', 'TBBM_07'];

  return (
    <div className="w-full">
      {/* BAND 1: EDITORIAL HEADER & KEY OPERATIONAL ADVANTAGES */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <EditorialHeader
                  eyebrow="Asisten SOP Lapangan & Jadwal Truk Tangki"
                  title="Mengubah Laporan Banjir & Macet Menjadi Rute Pengiriman Aman"
                  description="Sopir mobil tangki (AMT) dan petugas SPBU sering tahu lebih dulu jika ada banjir, longsor, atau pasar tumpah. Di sini Anda dapat menguji bagaimana asisten AI mencocokkan laporan tersebut ke buku SOP Patra Niaga sebelum dispatcher menyetujui pengalihan rute."
                  accent="blue"
                />
              </Reveal>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-5 border-t lg:border-t-0 lg:border-l border-[var(--border-hairline)] pt-5 lg:pt-0 lg:pl-8">
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Muatan Truk Terisi
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-blue)] mt-1">
                  <AnimatedCounter value={94.8} decimals={1} suffix="%" />
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Truk 16 / 24 / 32 KL</div>
              </div>
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Sopir Lembur &gt; 8 Jam
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-green)] mt-1">
                  0,0%
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Sistem lama: 11,4%</div>
              </div>
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Waktu Bongkar + Aman
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--text-primary)] mt-1">
                  45 mnt
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Wajib di tiap SPBU</div>
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
                  1. Pilih atau Ketik Laporan Kondisi Lapangan
                </span>
                <button
                  onClick={() => {
                    setIncidentText(INCIDENT_PRESETS[0].text);
                    setApprovedDocId(null);
                  }}
                  className="text-[11px] font-sub text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Contoh
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
                placeholder="Ketik laporan kendala dari petugas SPBU atau sopir AMT..."
              />

              <div className="pt-3 border-t border-[var(--border-hairline)] space-y-1">
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Mekanisme Pengaman Keputusan (Human-in-the-Loop)
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  Asisten AI <strong>tidak boleh</strong> mengubah rute truk sendirian. Penalti
                  hambatan jalur hanya aktif ke solver rute setelah petugas dispatcher mengklik
                  tombol persetujuan (<span className="font-mono-num">I_approve = 1</span>).
                </p>
              </div>
            </div>

            {/* Right Retrieved SOP & Approval Action */}
            <div className="lg:col-span-7 lg:border-l border-[var(--border-hairline)] lg:pl-10 space-y-6">
              {topMatch && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
                    <div>
                      <div className="text-[11px] font-mono-num text-[var(--accent-blue)]">
                        Rujukan SOP Ditemukan · {topMatch.doc.doc_id} ({topMatch.doc.category})
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl text-[var(--text-primary)] mt-1">
                        {topMatch.doc.trigger_condition}
                      </h3>
                    </div>
                    <Badge variant={topMatch.cosineScore >= 0.78 ? 'green' : 'amber'}>
                      Kecocokan {(topMatch.cosineScore * 100).toFixed(0)}% (Syarat &ge; 78%)
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                        2. Rekomendasi Tindakan SOP
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--text-primary)] mt-1.5">
                        {topMatch.doc.action_protocol}
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--accent-red)] inline-flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Batasan Keselamatan Kerja (HSSE)
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
                        Pengurai Antrean Warga (MyPertamina)
                      </div>
                      <p className="text-xs text-[var(--text-primary)] font-medium">
                        {topMatch.myPertaminaDiscount}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="text-xs font-mono-num">
                        Penalti Jarak:{' '}
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
                          {isApproved ? 'SUDAH DISETUJUI (AKTIF)' : 'MENUNGGU PERSETUJUAN'}
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
                          ? 'Aktif: Rute Pengiriman Sudah Dialihkan'
                          : 'Setujui & Terapkan Pengalihan Rute'}
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
              eyebrow="Jadwal Perjalanan Truk Multi-Tujuan"
              title="Rencana Kirim Multi-Drop dari 7 Terminal TBBM"
              description="Alih-alih mengirim 1 truk hanya untuk 1 SPBU darurat, MUARA menggabungkan beberapa SPBU searah ke dalam satu perjalanan sesuai kapasitas kompartemen."
            />

            <div className="flex flex-wrap items-center gap-4 shrink-0 text-xs font-mono-num">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] font-sub uppercase">
                  Penghematan Jarak (Filter Ini)
                </span>
                <strong className="text-lg text-[var(--accent-green)]">
                  -{routeStats.totalSaved.toFixed(1)} km
                </strong>
              </div>
              <div className="pl-4 border-l border-[var(--border-hairline)]">
                <span className="text-[var(--text-muted)] block text-[10px] font-sub uppercase">
                  Rata-rata Jam Kerja Sopir
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
                {t === 'ALL' ? 'Semua 7 Terminal' : t}
              </button>
            ))}
          </div>

          <DataTable
            data={filteredRoutes}
            columns={routeCols}
            rowKey={(r) => r.route_id}
            searchPlaceholder="Cari kode rute, nama koridor, atau kode SPBU..."
            searchMatcher={(r, q) =>
              `${r.route_id} ${r.tbbm_origin} ${r.target_corridor} ${r.multi_drop_stops}`
                .toLowerCase()
                .includes(q)
            }
            maxHeightClass="max-h-[460px]"
            toolbarRight={
              <span className="inline-flex items-center gap-1.5 text-[11px] font-sub text-[var(--text-muted)]">
                <RouteIcon className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                Seluruh rute patuh batas maksimal 8 jam kerja AMT
              </span>
            }
          />
        </div>
      </section>
    </div>
  );
}
