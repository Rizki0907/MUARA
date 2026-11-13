import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Compass,
  Layers,
  MapPin,
  Route,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  allSpbus,
  clustersRanking,
  financialModels,
  isolatedBottlenecks,
  simulationBundle,
} from '../../data';
import type { ClusterRanking, MapSelection, NavTabId, PeriodRegime } from '../../types/muara';
import { formatKL, formatNumberId } from '../../utils/format';
import { EastJavaMap } from '../map/EastJavaMap';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { Badge } from '../ui/Badge';
import { DataTable, type ColumnDef } from '../ui/DataTable';
import { EditorialHeader, Reveal } from '../ui/MotionPrimitives';

interface OverviewViewProps {
  regime: PeriodRegime;
  selection: MapSelection | null;
  onSelect: (sel: MapSelection) => void;
  onNavigate: (tab: NavTabId) => void;
}

interface PipelineStage {
  id: string;
  step: string;
  name: string;
  plainTitle: string;
  tagline: string;
  summary: string;
  metricLabel: string;
  metricValue: string;
  targetTab: NavTabId;
  formulaNote: string;
  icon: typeof Layers;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'stage-1',
    step: '01',
    name: 'Pengelompokan Wilayah & Proteksi SPBU Terpencil (HDBSCAN)',
    plainTitle: 'Mengelompokkan SPBU yang saling memengaruhi',
    tagline: '38 Kab/Kota · 7 TBBM · 920 SPBU · Galat Keseimbangan Kuota 0,00%',
    summary:
      'Kuota tahunan BPH Migas 11.340.955,3 KL (Pertalite JBKP & Biosolar JBT) dipetakan akurat ke masing-masing SPBU menggunakan citra cahaya malam (VIIRS 0,40), kepadatan penduduk (GHSL 0,35), dan kelas jalan (OSM 0,25). Algoritma HDBSCAN (k_min = 6) menyekat 38 zona penyangga dan mendeteksi 18 SPBU terpencil (-1) agar otomatis mendapat stok cadangan lebih besar (+20%, reorder naik dari 10% menjadi 30%).',
    metricLabel: 'Tingkat Kontainmen Limpahan (SCR)',
    metricValue: '94,2% tertahan di dalam zona (Silhouette 0,678 · DBI 0,624)',
    targetTab: 'spatial',
    formulaNote: 'HDBSCAN Excess of Mass · Bobot Disagregasi: VIIRS 0,40 + GHSL 0,35 + Jalan 0,25',
    icon: Layers,
  },
  {
    id: 'stage-2',
    step: '02',
    name: 'Prediksi Limpahan Antrean & Sisa Waktu Tangki (Modified Huff + XGBoost)',
    plainTitle: 'Menghitung kapan tangki habis jika SPBU sebelah tutup',
    tagline: 'Estimasi Sisa Waktu Sebelum Tangki Kosong (Time-to-Depletion / TTD)',
    summary:
      'Ketika satu SPBU menipis atau antre panjang, pembeli bermigrasi ke SPBU tetangga terdekat berkapasitas besar. Pola perpindahan ini dihitung dengan model gravitasi Modified Huff (alpha = 1,0; beta = 0,35 menit^-1; gamma = 0,82) lalu diproses Spatio-Temporal XGBoost dalam 11,2 milidetik — 12,7x lebih cepat daripada model deep learning Bi-LSTM.',
    metricLabel: 'Ketepatan Prediksi Sisa Waktu Tangki',
    metricValue: 'Kesalahan rata-rata hanya 2,391 jam (R² = 0,9759 · 76,1% lebih akurat)',
    targetTab: 'spatial',
    formulaNote: 'D_eff,j(t) = D_base,j(t) + gamma · DeltaD_i · P(i -> j)',
    icon: Sparkles,
  },
  {
    id: 'stage-3',
    step: '03',
    name: 'Penentuan Urutan Prioritas Pengiriman (Hybrid CRITIC–AHP)',
    plainTitle: 'Menentukan zona mana yang paling mendesak dikirim lebih dulu',
    tagline: 'Perpaduan Objektivitas Data Lapangan + Aturan Pakar Operasional',
    summary:
      'Keempat faktor krisis—Urgensi Stok (30%), Dampak Domino ke tetangga (30%), Laporan Lapangan/CI (20%), dan Jarak dari TBBM (20%)—digabungkan dengan metode CRITIC–AHP berketepatan tinggi (Consistency Ratio CR = 0,0042 < 0,05). Hasilnya menetapkan 8 zona paling kritis (Tier-1) yang tetap stabil 100% di 5 besar pada seluruh 15 skenario uji krisis.',
    metricLabel: 'Konsistensi Peringkat Lintas Skenario Krisis',
    metricValue: 'Spearman rho >= 0,9667 (100% stabil di daftar 5 teratas)',
    targetTab: 'benchmarks',
    formulaNote: 'Hybrid CRITIC–AHP (theta = 0,50 · lambda_max = 4,011 · CR = 0,0042)',
    icon: Compass,
  },
  {
    id: 'stage-4',
    step: '04',
    name: 'Asisten SOP Lapangan & Pengalih Antrean (RAG Copilot + MyPertamina)',
    plainTitle: 'Mengubah pesan banjir/macet dari sopir menjadi rute alternatif aman',
    tagline: 'Gerbang Persetujuan Dispatcher (I_approve = 1) Demi Keamanan SOP',
    summary:
      'Laporan pesan singkat pengawas SPBU maupun Awak Mobil Tangki (AMT) terkait banjir, pasar tumpah, atau antrean ekstrem dicocokkan ke SOP Pertamina Patra Niaga (ambang kemiripan >= 0,78). Jika disetujui dispatcher (I_approve = 1), jalur macet otomatis dihindari oleh solver rute sekaligus mengirim promo poin MyPertamina agar warga mengantre di SPBU sekitar yang masih aman.',
    metricLabel: 'Standar Tata Kelola AI',
    metricValue: 'Kemiripan >= 0,78 · 100% Wajib Persetujuan Manusia (Human-in-the-Loop)',
    targetTab: 'rag-routing',
    formulaNote: "d'_OSRM(u,v) = d_OSRM(u,v) · (1 + phi_RAG(u,v) · I_approve)",
    icon: Brain,
  },
  {
    id: 'stage-5',
    step: '05',
    name: 'Penjadwalan Rute Truk Multi-Drop (MILP OR-Tools CVRPTW + GLS)',
    plainTitle: 'Mengirim ke beberapa SPBU sekaligus tanpa membuat sopir lembur',
    tagline: 'Armada Kompartemen 16/24/32 KL · Wajib Patuh Shift Maksimal 8 Jam',
    summary:
      'Solver optimasi menyusun rute satu truk untuk memasok beberapa SPBU berdekatan sekaligus (multi-drop) sambil memperhitungkan durasi bongkar & pengendapan tangki 45 menit. Hasilnya memangkas 91,4% kekosongan berantai, menghemat 782.500 km perjalanan darurat per tahun, dengan tingkat pelanggaran jam kerja AMT 0,0% (dibanding sistem lama 11,4%).',
    metricLabel: 'Dampak Pengendalian Kelangkaan',
    metricValue: '91,4% insiden stok habis dicegah (7.250 -> 624 kasus/thn)',
    targetTab: 'rag-routing',
    formulaNote: 'OR-Tools Guided Local Search · Hard Constraint HSSE 8 Jam Kerja AMT',
    icon: Route,
  },
];

const COMPARISON_ROWS = [
  {
    aspect: 'Deteksi Risiko Tangki',
    legacy: 'Menunggu tangki menyentuh ambang statis < 15% per SPBU secara terpisah.',
    muara: 'Prediksi sisa jam sebelum kosong (TTD) dengan akurasi RMSE 2,391 jam & kecepatan 11,2 ms.',
    gain: 'Intervensi jauh sebelum antrean menular',
  },
  {
    aspect: 'Efek Tumpahan Antrean',
    legacy: 'Tidak memperhitungkan pembeli yang berpindah saat SPBU sebelah tutup.',
    muara: 'Memodelkan migrasi pembeli (Modified Huff gamma = 0,82) & menyekat 94,2% limpahan dalam 38 zona.',
    gain: 'Stockout berantai turun 91,4%',
  },
  {
    aspect: 'SPBU Jalur Terpencil',
    legacy: 'Diperlakukan sama dengan SPBU kota meski jarak antar-SPBU > 15 menit.',
    muara: '18 SPBU terpencil otomatis terdeteksi & memperoleh safety buffer ekstra +20% (reorder 30%).',
    gain: '0 wilayah terisolasi luput pantauan',
  },
  {
    aspect: 'Info Banjir & Kemacetan',
    legacy: 'Berhenti di grup pesan WhatsApp/radio tanpa masuk sistem penjadwalan.',
    muara: 'RAG Copilot mencocokkan ke SOP (cos >= 0,78), dispatcher klik setuju, rute langsung dialihkan.',
    gain: 'Pengetahuan tacit jadi keputusan rute',
  },
  {
    aspect: 'Biaya & Keselamatan AMT',
    legacy: 'Kirim darurat 1-tujuan berbiaya 1,65x/km dengan 11,4% pelanggaran shift 8 jam.',
    muara: 'Rute multi-drop OR-Tools mengisi kompartemen 94,8% dengan 0,0% pelanggaran shift HSSE.',
    gain: 'Hemat 782.500 km & NPV Rp92,26 M',
  },
];

export function OverviewView({ regime, selection, onSelect, onNavigate }: OverviewViewProps) {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const currentStage = PIPELINE_STAGES[activeStageIdx];
  const modelC = useMemo(
    () => financialModels.find((m) => m.Model_Code === 'Model C') ?? financialModels[2],
    []
  );

  const topClusters = useMemo(() => clustersRanking.slice(0, 10), []);
  const totalQuotaKl = useMemo(
    () => allSpbus.reduce((acc, s) => acc + s.qPert + s.qBio, 0),
    []
  );
  const peakSimulationPeakStockouts = useMemo(
    () => Math.max(...simulationBundle.timeline.map((p) => p.stockouts)),
    []
  );

  const clusterCols: ColumnDef<ClusterRanking>[] = [
    {
      key: 'Rank',
      header: 'Urutan',
      align: 'center',
      sortValue: (r) => r.Rank,
      render: (r) => <span className="font-mono-num font-bold text-[var(--text-muted)]">#{r.Rank}</span>,
    },
    {
      key: 'cluster',
      header: 'Zona / Kluster Penyangga',
      sortValue: (r) => r.cluster_name,
      render: (r) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)]">
            <span className="font-mono-num text-[var(--accent-blue)] mr-1.5">{r.cluster_id}</span>
            {r.cluster_name}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">Pemasok: {r.primary_tbbm_name}</div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tingkat Risiko',
      render: (r) => (
        <Badge variant={r.Priority_Tier.startsWith('Tier 1') ? 'red' : 'amber'}>
          {r.Priority_Tier.startsWith('Tier 1') ? 'Kritis Utama' : 'Siaga Puncak'}
        </Badge>
      ),
    },
    {
      key: 'score',
      header: 'Skor Risiko MUARA',
      align: 'right',
      sortValue: (r) => r.MUARA_Score,
      render: (r) => (
        <div className="inline-flex flex-col items-end gap-1">
          <span className="font-mono-num font-bold text-[var(--text-primary)]">
            {r.MUARA_Score.toFixed(2)}
          </span>
          <div className="w-24 h-1 bg-[var(--bg-subtle)] overflow-hidden flex">
            <div style={{ width: `${r.U_Urgency_Score * 0.3}%` }} className="bg-[var(--accent-red)]" />
            <div style={{ width: `${r.D_Domino_Score * 0.3}%` }} className="bg-amber-500" />
            <div style={{ width: `${r.C_Collective_Score * 0.2}%` }} className="bg-[var(--accent-blue)]" />
            <div style={{ width: `${r.A_Accessibility_Score * 0.2}%` }} className="bg-[var(--accent-green)]" />
          </div>
        </div>
      ),
    },
    {
      key: 'ttd',
      header: 'Sisa Waktu Tangki',
      align: 'right',
      sortValue: (r) => r.mean_ttd_hr,
      render: (r) => <span className="font-mono-num">{r.mean_ttd_hr.toFixed(2)} jam</span>,
    },
    {
      key: 'demand',
      header: regime === 'peak' ? 'Konsumsi Mudik' : 'Konsumsi Normal',
      align: 'right',
      sortValue: (r) => (regime === 'peak' ? r.peak_daily_demand_kl : r.avg_daily_demand_kl),
      render: (r) => (
        <span className="font-mono-num">
          {formatKL(regime === 'peak' ? r.peak_daily_demand_kl : r.avg_daily_demand_kl)}/hr
        </span>
      ),
    },
  ];

  const activeSelection = selection ?? { type: 'cluster' as const, data: clustersRanking[0] };

  const renderTelemetryInspector = () => {
    if (activeSelection.type === 'spbu') {
      const s = activeSelection.data;
      return (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
            <div>
              <div className="text-[11px] font-mono-num uppercase tracking-wider text-[var(--accent-blue)]">
                SPBU Terpilih · {s.id} · {s.kab}
              </div>
              <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1 leading-tight">
                {s.name}
              </h3>
            </div>
            <Badge variant={s.iso ? 'red' : 'blue'}>
              {s.iso ? 'Terpencil (+20% Buffer)' : `Zona ${s.cl}`}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Kapasitas Tangki Pendam
              </div>
              <div className="font-mono-num text-xl font-semibold text-[var(--text-primary)] mt-0.5">
                {s.cap} KL
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Batas Aman Isi Ulang
              </div>
              <div className="font-mono-num text-xl font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                {(s.buf * 100).toFixed(0)}% {s.iso ? '(Ekstra +20%)' : ''}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Penjualan ({regime === 'peak' ? 'Peak Mudik' : 'Normal'})
              </div>
              <div className="font-mono-num text-lg font-semibold text-[var(--text-primary)] mt-0.5">
                {(regime === 'peak' ? s.dPeak : s.dAvg).toFixed(2)} KL/hari
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                SPBU Tetangga (&le; 15 Menit)
              </div>
              <div className="font-mono-num text-lg font-semibold text-[var(--text-primary)] mt-0.5">
                {s.nbrs} lokasi
              </div>
            </div>
          </div>

          <dl className="divide-y divide-[var(--border-hairline)] text-xs border-t border-b border-[var(--border-hairline)]">
            <div className="py-2.5 flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Terminal Pemasok (TBBM)</dt>
              <dd className="font-mono-num font-medium text-[var(--text-primary)]">
                {s.tbbm} ({s.dist} km · {s.lead} jam)
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Akses Jalan &amp; Maks Truk</dt>
              <dd className="font-mono-num font-medium capitalize text-[var(--text-primary)]">
                {s.rc} · Maks {s.maxTrk} KL
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Kuota Pertalite / Biosolar</dt>
              <dd className="font-mono-num font-medium text-[var(--text-primary)]">
                {formatNumberId(s.qPert)} / {formatNumberId(s.qBio)} KL
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Status Kerentanan</dt>
              <dd className="font-medium text-right text-[var(--text-primary)]">{s.reg}</dd>
            </div>
          </dl>

          <button
            onClick={() => onNavigate('spatial')}
            className="w-full py-2.5 px-4 rounded-md bg-[var(--accent-blue)] text-white text-xs font-sub font-semibold tracking-wide hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2"
          >
            Uji Simulasi Jika SPBU Ini Kosong
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    if (activeSelection.type === 'tbbm') {
      const t = activeSelection.data;
      return (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
            <div>
              <div className="text-[11px] font-mono-num uppercase tracking-wider text-[var(--accent-blue)]">
                Terminal Depot BBM · {t.tbbm_id}
              </div>
              <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1">{t.name}</h3>
            </div>
            <Badge variant="blue">{t.fleet_count} Truk Tangki</Badge>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Wilayah layanan utama: {t.region_corridor}
          </p>
          <div className="grid grid-cols-2 gap-6 py-3 border-y border-[var(--border-hairline)]">
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Kapasitas Depot
              </div>
              <div className="font-mono-num text-xl font-semibold text-[var(--text-primary)] mt-0.5">
                {formatNumberId(t.capacity_kl)} KL
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Armada 16 / 24 / 32 KL
              </div>
              <div className="font-mono-num text-xl font-semibold text-[var(--text-primary)] mt-0.5">
                {t.truck_16kl} / {t.truck_24kl} / {t.truck_32kl}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('rag-routing')}
            className="w-full py-2.5 px-4 rounded-md bg-[var(--accent-blue)] text-white text-xs font-sub font-semibold tracking-wide hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2"
          >
            Lihat Jadwal Truk Dari {t.tbbm_id}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    if (activeSelection.type === 'kabkota') {
      const k = activeSelection.data;
      return (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
            <div>
              <div className="text-[11px] font-mono-num uppercase tracking-wider text-[var(--text-muted)]">
                Wilayah Kota/Kab · BPS {k.bps_code}
              </div>
              <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1">
                {k.kabkota_name}
              </h3>
            </div>
            <Badge variant="neutral">{k.spbu_count} SPBU</Badge>
          </div>

          <div className="grid grid-cols-2 gap-6 py-3 border-y border-[var(--border-hairline)]">
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Total Kuota Tahunan
              </div>
              <div className="font-mono-num text-xl font-semibold text-[var(--text-primary)] mt-0.5">
                {formatKL(k.total_kuota_bbm_subsidi_kl_yr)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Faktor Tekanan Jalur
              </div>
              <div className="font-mono-num text-xl font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                {k.corridor_pressure_factor.toFixed(2)}x
              </div>
            </div>
          </div>

          <dl className="divide-y divide-[var(--border-hairline)] text-xs">
            <div className="py-2 flex justify-between">
              <dt className="text-[var(--text-muted)]">Kuota Pertalite (JBKP)</dt>
              <dd className="font-mono-num font-medium">{formatKL(k.kuota_pertalite_jbkp_kl_yr)}</dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-[var(--text-muted)]">Kuota Biosolar (JBT)</dt>
              <dd className="font-mono-num font-medium">{formatKL(k.kuota_biosolar_jbt_kl_yr)}</dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-[var(--text-muted)]">Terminal Pemasok Utama</dt>
              <dd className="font-mono-num font-medium">
                {k.primary_tbbm_id} · {k.primary_tbbm_name}
              </dd>
            </div>
          </dl>
        </div>
      );
    }

    const c = activeSelection.data;
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
          <div>
            <div className="text-[11px] font-mono-num uppercase tracking-wider text-[var(--accent-blue)]">
              Prioritas #{c.Rank} dari 38 Zona · {c.cluster_id}
            </div>
            <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1 leading-tight">
              {c.cluster_name}
            </h3>
          </div>
          <Badge variant={c.Priority_Tier.startsWith('Tier 1') ? 'red' : 'amber'}>
            {c.Priority_Tier.startsWith('Tier 1') ? 'Tier 1 Kritis' : 'Tier 2 Puncak'}
          </Badge>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
              Skor Risiko Gabungan (Maks 100)
            </div>
            <div className="font-mono-num text-4xl font-bold text-[var(--text-primary)] mt-1">
              {c.MUARA_Score.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
              Sisa Waktu Tangki Rata-rata
            </div>
            <div className="font-mono-num text-lg font-semibold text-[var(--accent-red)] mt-1">
              {c.mean_ttd_hr.toFixed(2)} jam
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
          {[
            { label: 'Urgensi Stok Tersisa (Bobot 30%)', val: c.U_Urgency_Score, color: 'bg-[var(--accent-red)]' },
            { label: 'Risiko Penularan Antrean (Bobot 30%)', val: c.D_Domino_Score, color: 'bg-amber-500' },
            { label: 'Laporan Gangguan Lapangan (Bobot 20%)', val: c.C_Collective_Score, color: 'bg-[var(--accent-blue)]' },
            { label: 'Jarak & Akses dari Depot (Bobot 20%)', val: c.A_Accessibility_Score, color: 'bg-[var(--accent-green)]' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-sub text-[var(--text-secondary)]">{item.label}</span>
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                  {item.val.toFixed(1)}
                </span>
              </div>
              <div className="h-1 bg-[var(--bg-subtle)] overflow-hidden">
                <div style={{ width: `${Math.min(100, item.val)}%` }} className={`h-full ${item.color}`} />
              </div>
            </div>
          ))}
        </div>

        <dl className="divide-y divide-[var(--border-hairline)] text-xs border-y border-[var(--border-hairline)]">
          <div className="py-2 flex justify-between">
            <dt className="text-[var(--text-muted)]">Jumlah SPBU di Zona Ini</dt>
            <dd className="font-mono-num font-medium">
              {c.spbu_count} SPBU (P1: {c.eligible_p1_count} · P2: {c.eligible_p2_count})
            </dd>
          </div>
          <div className="py-2 flex justify-between">
            <dt className="text-[var(--text-muted)]">Depot TBBM Penyuplai</dt>
            <dd className="font-mono-num font-medium">
              {c.primary_tbbm_name} ({c.avg_dist_to_tbbm_km} km)
            </dd>
          </div>
          <div className="py-2 flex justify-between">
            <dt className="text-[var(--text-muted)]">
              Kebutuhan ({regime === 'peak' ? 'Peak Mudik' : 'Normal'})
            </dt>
            <dd className="font-mono-num font-medium">
              {formatKL(regime === 'peak' ? c.peak_daily_demand_kl : c.avg_daily_demand_kl)}/hari
            </dd>
          </div>
        </dl>

        <button
          onClick={() => onNavigate('rag-routing')}
          className="w-full py-2.5 px-4 rounded-md bg-[var(--accent-blue)] text-white text-xs font-sub font-semibold tracking-wide hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2"
        >
          Lihat Jadwal Truk Menuju Zona {c.cluster_id}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* BAND 1: EDITORIAL HERO SPLIT + PHOTOGRAPHY */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <Reveal>
                <div className="inline-flex flex-wrap items-center gap-2.5 text-[11px] font-sub uppercase tracking-[0.14em] text-[var(--accent-blue)] font-semibold">
                  <span>Sistem Kendali Distribusi BBM Subsidi</span>
                  <span className="text-[var(--border-strong)]">/</span>
                  <span className="text-[var(--text-muted)]">Jawa Timur · 920 SPBU</span>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[3.35rem] text-[var(--text-primary)] leading-[1.07] tracking-tight">
                  Cegah Antrean &amp; Kelangkaan BBM Subsidi Sebelum{' '}
                  <em className="italic text-[var(--accent-blue)] font-normal">
                    Menular Antar-SPBU
                  </em>
                  .
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="text-sm sm:text-base leading-relaxed text-[var(--text-secondary)] max-w-2xl">
                  Saat satu SPBU kehabisan Pertalite atau Biosolar, pengendara berpindah ke SPBU
                  sebelahnya dan memicu kelangkaan berantai.{' '}
                  <strong className="font-semibold text-[var(--text-primary)]">MUARA</strong>{' '}
                  memprediksi perpindahan antrean itu lebih dini, menggabungkan laporan banjir atau
                  macet dari sopir tangki, dan menyusun jadwal kirim multi-tujuan di seluruh{' '}
                  <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                    38 Kab/Kota &amp; 7 TBBM Jawa Timur
                  </span>{' '}
                  ({formatKL(totalQuotaKl)}/tahun).
                </p>
              </Reveal>

              <Reveal delay={0.14}>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="#peta-utama"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--accent-blue)] text-white text-xs sm:text-sm font-sub font-semibold tracking-wide hover:opacity-95 transition-opacity"
                  >
                    Jelajahi Peta Jawa Timur
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => onNavigate('spatial')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] text-xs sm:text-sm font-sub font-semibold tracking-wide hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    Coba Simulasi Kelangkaan
                  </button>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={0.12}>
                <figure className="relative overflow-hidden border border-[var(--border-hairline)] bg-[var(--bg-subtle)]">
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    <img
                      src="/images/pertamina-spbu.jpg"
                      alt="SPBU PT Pertamina sebagai simpul layanan pengisian Pertalite JBKP dan Biosolar JBT"
                      className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
                  <figcaption className="absolute bottom-0 inset-x-0 p-4 sm:p-5 text-white">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-sub uppercase tracking-[0.14em] text-white/80 mb-1">
                      <span>Orkestrasi Hilir Patra Niaga</span>
                      <span className="font-mono-num">7 TBBM -&gt; 920 SPBU</span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium leading-snug text-white">
                      Mengubah pengiriman reaktif yang serba mendadak menjadi jadwal terencana
                      sebelum tangki pendam benar-benar kosong.
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>

          {/* Open Hairline Executive Impact Strip */}
          <div className="mt-10 pt-8 border-t border-[var(--border-hairline)] grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-[var(--border-hairline)]">
            <div className="lg:pr-8">
              <div className="text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Kelangkaan Berantai Dicegah
              </div>
              <div className="font-mono-num text-3xl sm:text-4xl font-bold text-[var(--accent-green)] mt-1.5">
                <AnimatedCounter value={91.4} decimals={1} suffix="%" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                Menurun tajam dari{' '}
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                  7.250 menjadi 624
                </span>{' '}
                kejadian per tahun.
              </p>
            </div>

            <div className="lg:px-8">
              <div className="text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Jarak Darurat Dihemat
              </div>
              <div className="font-mono-num text-3xl sm:text-4xl font-bold text-[var(--accent-blue)] mt-1.5">
                <AnimatedCounter value={782.5} decimals={1} suffix=" rb km" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                Tangki truk terisi{' '}
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">94,8%</span>{' '}
                dengan{' '}
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">0,0%</span>{' '}
                sopir lembur melewati 8 jam.
              </p>
            </div>

            <div className="lg:px-8">
              <div className="text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Penurunan Emisi Truk
              </div>
              <div className="font-mono-num text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1.5">
                <AnimatedCounter value={719.9} decimals={1} suffix=" ton CO₂e" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                Setara{' '}
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                  7.199 ton CO₂e
                </span>{' '}
                lebih bersih sepanjang 10 tahun operasi.
              </p>
            </div>

            <div className="lg:pl-8">
              <div className="text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Nilai Ekonomi Bersih (NPV 10 Thn)
              </div>
              <div className="font-mono-num text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1.5">
                <AnimatedCounter
                  value={modelC.NPV_10Yr_WACC10_Billion_IDR}
                  decimals={2}
                  prefix="Rp"
                  suffix=" M"
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                Balik modal cepat{' '}
                <span className="font-mono-num font-semibold text-[var(--accent-green)]">
                  {modelC.Payback_Period_Years.toFixed(2)} tahun
                </span>{' '}
                · IRR{' '}
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                  {modelC.IRR_Estimated_Pct.toFixed(1)}%
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 2: HIGH-CONTRAST SPOTLIGHT BAND — KEUNGGULAN SOLUSI (LAMA vs MUARA) */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-spotlight)] text-[var(--text-on-spotlight)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-4 space-y-4">
              <div className="text-[11px] font-sub font-semibold uppercase tracking-[0.14em] text-[#60a5fa]">
                Keunggulan Utama Solusi
              </div>
              <h2 className="font-display text-2xl sm:text-3xl leading-tight text-white">
                Mengapa MUARA Jauh Mengungguli Pola Distribusi Konvensional?
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">
                Sistem eksisting memantau tiap SPBU secara terpisah dan baru bergerak setelah stok
                kritis &lt;15%. Ketika terjadi macet pantura atau libur panjang, keterlambatan satu
                SPBU memicu efek domino ke seluruh koridor dengan biaya darurat{' '}
                <span className="font-mono-num font-semibold text-white">1,65x per km</span>.
              </p>
              <div className="pt-2 text-xs font-sub text-slate-400">
                Data terkalibrasi pada simulasi 240 jam &amp; 5-Fold Time-Series Validation.
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="overflow-x-auto border-t border-b border-white/15">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/15 text-[10px] font-sub uppercase tracking-wider text-slate-400">
                      <th className="py-3 pr-4">Aspek Operasional</th>
                      <th className="py-3 px-4">Cara Lama (Reaktif 15%)</th>
                      <th className="py-3 px-4 text-[#60a5fa]">Terobosan MUARA</th>
                      <th className="py-3 pl-4 text-right text-emerald-400">Dampak Terukur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.aspect} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 pr-4 font-sub font-semibold text-white whitespace-nowrap">
                          {row.aspect}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 leading-relaxed">{row.legacy}</td>
                        <td className="py-3.5 px-4 text-white font-medium leading-relaxed">
                          {row.muara}
                        </td>
                        <td className="py-3.5 pl-4 text-right font-mono-num font-semibold text-emerald-400 whitespace-nowrap">
                          {row.gain}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 3: PROBLEM FRAMING IN PLAIN LANGUAGE */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-5">
              <EditorialHeader
                eyebrow="Masalah yang Diselesaikan"
                title="Tiga Titik Buta Logistik BBM yang Kerap Memicu Antrean Panjang"
                description="MUARA dirancang bukan sekadar memvisualkan angka, melainkan menutup tiga celah operasional yang selama ini membuat truk tangki selalu datang terlambat saat puncak permintaan."
                accent="red"
              />
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t sm:border-t-0 sm:border-l border-[var(--border-hairline)] pt-6 sm:pt-0 sm:pl-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-sub font-semibold text-[var(--accent-red)]">
                  <ShieldAlert className="w-4 h-4" />
                  <span>01 · Antrean Menular</span>
                </div>
                <h3 className="font-display text-lg text-[var(--text-primary)]">
                  Efek Domino Tetangga
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  Saat satu SPBU tutup sementara, kendaraan lari ke SPBU terdekat dan menguras stok
                  dua kali lebih cepat. Tanpa pemodelan limpahan, terjadi{' '}
                  <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                    7.250 kasus stok habis/thn
                  </span>
                  .
                </p>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-sub font-semibold text-amber-600 dark:text-amber-400">
                  <MapPin className="w-4 h-4" />
                  <span>02 · Wilayah Terpencil</span>
                </div>
                <h3 className="font-display text-lg text-[var(--text-primary)]">
                  18 SPBU Tanpa Pengganti
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  Ada{' '}
                  <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                    {isolatedBottlenecks.length} SPBU terpencil
                  </span>{' '}
                  yang berjarak &gt;15 menit dari SPBU lain. Jika habis, warga tidak punya opsi
                  terdekat dan truk darurat harus menempuh perjalanan jauh berbiaya{' '}
                  <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                    1,65x/km
                  </span>
                  .
                </p>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-sub font-semibold text-[var(--accent-blue)]">
                  <Brain className="w-4 h-4" />
                  <span>03 · Laporan Terpisah</span>
                </div>
                <h3 className="font-display text-lg text-[var(--text-primary)]">
                  Info Sopir Tak Terpakai
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  Info banjir, pasar tumpah, atau jalan putus dari sopir AMT biasanya tercecer di
                  chat radio. MUARA mengubah pesan teks tersebut menjadi penyesuaian rute otomatis
                  setelah disetujui petugas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 4: INTERACTIVE 5-STAGE CLOSED-LOOP STEPPER */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[var(--border-hairline)]">
            <EditorialHeader
              eyebrow="Cara Kerja Sistem (5 Tahap)"
              title="Bagaimana MUARA Bekerja Dari Data Lapangan Hingga Truk Berangkat?"
              description="Klik salah satu dari lima tahap di sebelah kiri untuk membaca penjelasan ringkas maupun rumus teknisnya."
            />
            <span className="text-[11px] font-mono-num text-[var(--text-muted)] shrink-0">
              Uji Simulasi 240 Jam · Puncak {peakSimulationPeakStockouts} titik rawan terpantau
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
            <div className="lg:col-span-5 divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isActive = idx === activeStageIdx;
                const Icon = stage.icon;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStageIdx(idx)}
                    className={`w-full text-left py-4 px-3.5 flex items-start gap-3.5 transition-colors ${
                      isActive ? 'bg-[var(--bg-subtle)]' : 'hover:bg-[var(--bg-subtle)]/45'
                    }`}
                  >
                    <span
                      className={`font-mono-num text-xs font-bold pt-0.5 ${
                        isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {stage.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-sub text-sm font-semibold ${
                            isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {stage.name}
                        </span>
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'
                          }`}
                        />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {stage.plainTitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <motion.div
              key={currentStage.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-7 flex flex-col justify-between lg:pl-8 space-y-6"
            >
              <div className="space-y-4">
                <div className="inline-flex flex-wrap items-center gap-2 text-[11px] font-mono-num uppercase tracking-wider text-[var(--accent-blue)]">
                  <span>Tahap {currentStage.step} / 05</span>
                  <span>·</span>
                  <span>{currentStage.tagline}</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-[var(--text-primary)] leading-tight">
                  {currentStage.name}
                </h3>

                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {currentStage.summary}
                </p>

                <div className="pt-2 border-t border-[var(--border-hairline)]">
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    Catatan Matematis &amp; Parameter
                  </div>
                  <div className="font-mono-num text-xs font-semibold text-[var(--text-primary)] mt-1">
                    {currentStage.formulaNote}
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    {currentStage.metricLabel}
                  </div>
                  <div className="font-mono-num text-base font-bold text-[var(--accent-green)] mt-0.5 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{currentStage.metricValue}</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(currentStage.targetTab)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--border-strong)] text-xs font-sub font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors shrink-0"
                >
                  Buka Halaman Simulasinya
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BAND 5: LAYMAN QUICK GUIDE + INTERACTIVE MAP + INSPECTOR */}
      <section id="peta-utama" className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
            <EditorialHeader
              eyebrow="Peta Interaktif Jawa Timur"
              title="Pantau Wilayah, Kluster Rawan, Terminal TBBM & Rute Truk"
              description="Klik kabupaten/kota, ikon kotak TBBM, lingkaran kluster, atau segitiga merah SPBU terpencil untuk melihat datanya secara langsung di panel kanan."
            />
            <span className="text-[11px] font-mono-num text-[var(--text-muted)] shrink-0">
              Mode Aktif:{' '}
              <strong className="text-[var(--text-primary)]">
                {regime === 'peak' ? 'Peak Mudik / Libur (1,28x)' : 'Hari Normal (1,00x)'}
              </strong>
            </span>
          </div>

          {/* 3-step plain guide strip for beginners */}
          <div className="mb-6 py-3 border-y border-[var(--border-hairline)] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[var(--text-secondary)]">
            <div>
              <strong className="font-sub text-[var(--text-primary)]">1. Pilih Kondisi:</strong>{' '}
              Ubah tombol <em>Hari Normal / Peak Mudik</em> di menu atas.
            </div>
            <div>
              <strong className="font-sub text-[var(--text-primary)]">2. Klik Titik / Cari:</strong>{' '}
              Klik titik di peta atau pakai kotak <em>Cari SPBU, Kota, Kluster</em> di atas.
            </div>
            <div>
              <strong className="font-sub text-[var(--text-primary)]">3. Baca Inspektor:</strong>{' '}
              Panel kanan langsung menampilkan sisa waktu tangki &amp; kuotanya.
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8">
              <EastJavaMap regime={regime} selection={selection} onSelect={onSelect} />
            </div>
            <div className="xl:col-span-4 xl:border-l border-[var(--border-hairline)] xl:pl-8 pt-2">
              <div className="text-[10px] font-sub uppercase tracking-[0.14em] text-[var(--text-muted)] mb-3">
                Detail Lokasi Terpilih
              </div>
              {renderTelemetryInspector()}
            </div>
          </div>
        </div>
      </section>

      {/* BAND 6: TOP 10 PRIORITY CLUSTERS */}
      <section className="bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <EditorialHeader
              eyebrow="Daftar Prioritas Pengiriman"
              title="10 Zona Dengan Tingkat Risiko Kelangkaan Tertinggi"
              description="Klik salah satu baris untuk langsung menyorot zona tersebut pada peta di atas. Delapan zona teratas merupakan prioritas krisis utama (Tier-1)."
              accent="green"
            />
            <button
              onClick={() => onNavigate('benchmarks')}
              className="text-xs font-sub font-semibold text-[var(--accent-blue)] hover:underline inline-flex items-center gap-1.5 shrink-0"
            >
              Lihat Bukti Uji Akurasi &amp; Stabilitas Model
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <DataTable
            data={topClusters}
            columns={clusterCols}
            rowKey={(r) => r.cluster_id}
            searchPlaceholder="Ketik nama zona atau depot (mis. Jember, Surabaya, Sidoarjo)..."
            searchMatcher={(r, q) =>
              `${r.cluster_id} ${r.cluster_name} ${r.primary_tbbm_name} ${r.Priority_Tier}`
                .toLowerCase()
                .includes(q)
            }
            selectedKey={selection?.type === 'cluster' ? selection.data.cluster_id : undefined}
            onRowClick={(r) => {
              onSelect({ type: 'cluster', data: r });
              document.getElementById('peta-utama')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            maxHeightClass="max-h-[420px]"
          />
        </div>
      </section>
    </div>
  );
}
