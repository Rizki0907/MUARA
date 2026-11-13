import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Compass,
  Database,
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
  tagline: string;
  summary: string;
  metricLabel: string;
  metricValue: string;
  targetTab: NavTabId;
  formulaNote: string;
  icon: typeof Database;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'stage-1',
    step: '01',
    name: 'Disagregasi Kuota & Topologi HDBSCAN',
    tagline: '38 Kabupaten/Kota · 7 TBBM · 920 SPBU · 0,00% Mass-Balance Error',
    summary:
      'Kuota tahunan BPH Migas 11.340.955,3 KL (Pertalite JBKP & Biosolar JBT) didisagregasi hingga level SPBU menggunakan VIIRS Nighttime Lights (0,40), GHSL 2 km (0,35), dan kelas jalan OSM (0,25). HDBSCAN berbasis waktu tempuh jalan (k_min = 6, Excess of Mass) membentuk 38 kluster penyangga dan mengisolasi 18 SPBU outlier (-1) agar mendapat buffer stok pengaman +20% (reorder 10% -> 30%).',
    metricLabel: 'Spillover Containment Ratio',
    metricValue: '94,2% (Silhouette 0,678 · DBI 0,624)',
    targetTab: 'spatial',
    formulaNote: 'HDBSCAN EoM · VIIRS(0,40) + GHSL(0,35) + OSM(0,25)',
    icon: Layers,
  },
  {
    id: 'stage-2',
    step: '02',
    name: 'Modified Huff Spillover & Spatio-Temporal XGBoost',
    tagline: 'Prediksi Depletion & Time-to-Depletion (TTD) Presisi Tinggi',
    summary:
      'Saat satu SPBU mengalami shock atau kehabisan stok, beban antrean bermigrasi ke SPBU tetangga berkapasitas besar yang berjarak singkat melalui model gravitasi Modified Huff (alpha = 1,0; beta = 0,35 menit^-1; gamma = 0,82). Fitur limpahan ini masuk ke XGBoost spasial-temporal (11 fitur ATG, cuaca, & CI) untuk mengestimasi TTD dalam 11,2 ms — 12,7x lebih cepat daripada Bi-LSTM.',
    metricLabel: 'Akurasi Prediksi TTD (R² = 0,9759)',
    metricValue: 'RMSE 2,391 jam · MAPE 8,61% (76,1% lebih akurat vs Moving Avg)',
    targetTab: 'spatial',
    formulaNote: 'D_eff,j(t) = D_base,j(t) + gamma * DeltaD_i * P(i -> j)',
    icon: Sparkles,
  },
  {
    id: 'stage-3',
    step: '03',
    name: 'Prioritas Kluster Hybrid CRITIC–AHP',
    tagline: 'Keputusan Objektif + Tata Kelola Operasional Terkalibrasi',
    summary:
      'Empat dimensi kritis—Urgensi Stok (U = 0,30), Dampak Domino (D = 0,30), Collective Intelligence (C = 0,20), dan Aksesibilitas TBBM (A = 0,20)—dibobotkan dengan metode gabungan variansi objektif CRITIC dan matriks konsistensi AHP (CR = 0,0042 < 0,05). Menghasilkan 8 kluster Tier-1 kritis yang stabil 100% di Top-5 lintas 15 skenario sensitivitas.',
    metricLabel: 'Stabilitas Peringkat (Spearman rho)',
    metricValue: 'rho >= 0,9667 (Top-5 Consistency 100%)',
    targetTab: 'benchmarks',
    formulaNote: 'CRITIC (theta=0,50) + AHP (lambda_max=4,011 · CR=0,0042)',
    icon: Compass,
  },
  {
    id: 'stage-4',
    step: '04',
    name: 'RAG Copilot & Collective Intelligence (CI)',
    tagline: 'Pengetahuan Tacit Lapangan -> Penalti Rute Dinamis (I_approve = 1)',
    summary:
      'Laporan WhatsApp/radio operator SPBU dan Awak Mobil Tangki (AMT) mengenai banjir, pasar tumpah, maupun pengalihan lalu lintas dicocokkan terhadap SOP Patra Niaga melalui retrieval berbasis kosinus (cos >= 0,78). Setelah disetujui dispatcher (I_approve = 1), penalti d_OSRM meningkat otomatis sekaligus memicu notifikasi insentif antrean MyPertamina ke SPBU tetangga.',
    metricLabel: 'Ambang Retrieval & Tata Kelola',
    metricValue: 'cos >= 0,78 · 100% Human-in-the-Loop Dispatch Gate',
    targetTab: 'rag-routing',
    formulaNote: "d'_OSRM(u,v) = d_OSRM(u,v) * (1 + phi_RAG(u,v) * I_approve)",
    icon: Brain,
  },
  {
    id: 'stage-5',
    step: '05',
    name: 'Optimasi Rute Multi-Drop MILP CVRPTW + GLS',
    tagline: 'Kepatuhan Shift AMT 8 Jam & Utilisasi Kompartemen 94,8%',
    summary:
      'Solver OR-Tools memodelkan armada multi-kompartemen (16, 24, 32 KL) lengkap dengan durasi bongkar & settling 45 menit di SPBU serta batas shift HSSE maksimal 8 jam. Dibandingkan dispatch reaktif FCFS yang menelan biaya darurat 1,65x/km dan melanggar 11,4% shift AMT, MUARA memangkas 91,4% stockout berantai dengan 0,0% pelanggaran jam kerja.',
    metricLabel: 'Reduksi Stockout Berantai',
    metricValue: '91,4% (7.250 -> 624 insiden/thn · 782.500 km/thn dihemat)',
    targetTab: 'rag-routing',
    formulaNote: 'OR-Tools Guided Local Search · HSSE 8h Shift Hard Constraint',
    icon: Route,
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
      header: '#',
      align: 'center',
      sortValue: (r) => r.Rank,
      render: (r) => <span className="font-mono-num text-[var(--text-muted)]">#{r.Rank}</span>,
    },
    {
      key: 'cluster',
      header: 'Kluster Penyangga',
      sortValue: (r) => r.cluster_name,
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">
            <span className="font-mono-num text-[var(--accent-blue)] mr-1.5">{r.cluster_id}</span>
            {r.cluster_name}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">{r.primary_tbbm_name}</div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Prioritas',
      render: (r) => (
        <Badge variant={r.Priority_Tier.startsWith('Tier 1') ? 'red' : 'amber'}>
          {r.Priority_Tier.startsWith('Tier 1') ? 'Tier 1 Kritis' : 'Tier 2 Peak'}
        </Badge>
      ),
    },
    {
      key: 'score',
      header: 'MUARA Score',
      align: 'right',
      sortValue: (r) => r.MUARA_Score,
      render: (r) => (
        <div className="inline-flex flex-col items-end gap-1">
          <span className="font-mono-num font-bold text-[var(--text-primary)]">
            {r.MUARA_Score.toFixed(2)}
          </span>
          <div className="w-24 h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden flex">
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
      header: 'Mean TTD',
      align: 'right',
      sortValue: (r) => r.mean_ttd_hr,
      render: (r) => <span className="font-mono-num">{r.mean_ttd_hr.toFixed(2)} jam</span>,
    },
    {
      key: 'demand',
      header: regime === 'peak' ? 'Peak Demand' : 'Avg Demand',
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
                {s.id} · {s.kab}
              </div>
              <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1 leading-tight">
                {s.name}
              </h3>
            </div>
            <Badge variant={s.iso ? 'red' : 'blue'}>{s.iso ? 'Isolated -1' : s.cl}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Kapasitas Tangki
              </div>
              <div className="font-mono-num text-xl font-semibold text-[var(--text-primary)] mt-0.5">
                {s.cap} KL
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Safety Buffer
              </div>
              <div className="font-mono-num text-xl font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                {(s.buf * 100).toFixed(0)}% {s.iso ? '(+20%)' : ''}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Demand ({regime === 'peak' ? 'Peak' : 'Normal'})
              </div>
              <div className="font-mono-num text-lg font-semibold text-[var(--text-primary)] mt-0.5">
                {(regime === 'peak' ? s.dPeak : s.dAvg).toFixed(2)} KL/hr
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Tetangga ≤ 15 Menit
              </div>
              <div className="font-mono-num text-lg font-semibold text-[var(--text-primary)] mt-0.5">
                {s.nbrs} SPBU
              </div>
            </div>
          </div>

          <dl className="divide-y divide-[var(--border-hairline)] text-xs border-t border-b border-[var(--border-hairline)]">
            <div className="py-2.5 flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">TBBM Penyuplai</dt>
              <dd className="font-mono-num font-medium text-[var(--text-primary)]">
                {s.tbbm} ({s.dist} km · {s.lead} jam)
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Kelas Jalan & Max Truk</dt>
              <dd className="font-mono-num font-medium capitalize text-[var(--text-primary)]">
                {s.rc} · ≤ {s.maxTrk} KL
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Kuota Pertalite / Biosolar</dt>
              <dd className="font-mono-num font-medium text-[var(--text-primary)]">
                {formatNumberId(s.qPert)} / {formatNumberId(s.qBio)} KL
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Rezim Kerentanan</dt>
              <dd className="font-medium text-right text-[var(--text-primary)]">{s.reg}</dd>
            </div>
          </dl>

          <button
            onClick={() => onNavigate('spatial')}
            className="w-full py-2.5 px-4 rounded-md bg-[var(--accent-blue)] text-white text-xs font-sub font-semibold tracking-wide hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2"
          >
            Simulasikan Efek Spillover SPBU Ini
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
                {t.tbbm_id} · Terminal Hub Pertamina
              </div>
              <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1">{t.name}</h3>
            </div>
            <Badge variant="blue">{t.fleet_count} Truk Tangki</Badge>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{t.region_corridor}</p>
          <div className="grid grid-cols-2 gap-6 py-3 border-y border-[var(--border-hairline)]">
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Kapasitas Timbun
              </div>
              <div className="font-mono-num text-xl font-semibold text-[var(--text-primary)] mt-0.5">
                {formatNumberId(t.capacity_kl)} KL
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Komposisi 16 / 24 / 32 KL
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
            Buka Rute Multi-Drop Dari {t.tbbm_id}
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
                BPS {k.bps_code} · Wilayah Administrasi
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
                Tekanan Koridor
              </div>
              <div className="font-mono-num text-xl font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                {k.corridor_pressure_factor.toFixed(2)}x
              </div>
            </div>
          </div>

          <dl className="divide-y divide-[var(--border-hairline)] text-xs">
            <div className="py-2 flex justify-between">
              <dt className="text-[var(--text-muted)]">Pertalite (JBKP)</dt>
              <dd className="font-mono-num font-medium">{formatKL(k.kuota_pertalite_jbkp_kl_yr)}</dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-[var(--text-muted)]">Biosolar (JBT)</dt>
              <dd className="font-mono-num font-medium">{formatKL(k.kuota_biosolar_jbt_kl_yr)}</dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-[var(--text-muted)]">TBBM Pemasok Utama</dt>
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
              Rank #{c.Rank} · {c.cluster_id}
            </div>
            <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1 leading-tight">
              {c.cluster_name}
            </h3>
          </div>
          <Badge variant={c.Priority_Tier.startsWith('Tier 1') ? 'red' : 'amber'}>
            {c.Priority_Tier}
          </Badge>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
              Indeks Prioritas Hybrid CRITIC–AHP
            </div>
            <div className="font-mono-num text-4xl font-bold text-[var(--text-primary)] mt-1">
              {c.MUARA_Score.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
              Mean TTD Kluster
            </div>
            <div className="font-mono-num text-lg font-semibold text-[var(--accent-red)] mt-1">
              {c.mean_ttd_hr.toFixed(2)} jam
            </div>
          </div>
        </div>

        {/* Minimalist CRITIC-AHP component breakdown */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
          {[
            { label: 'U · Urgensi Stok (0,30)', val: c.U_Urgency_Score, color: 'bg-[var(--accent-red)]' },
            { label: 'D · Dampak Domino (0,30)', val: c.D_Domino_Score, color: 'bg-amber-500' },
            { label: 'C · Collective Intel (0,20)', val: c.C_Collective_Score, color: 'bg-[var(--accent-blue)]' },
            { label: 'A · Akses TBBM (0,20)', val: c.A_Accessibility_Score, color: 'bg-[var(--accent-green)]' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-sub text-[var(--text-secondary)]">{item.label}</span>
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                  {item.val.toFixed(1)}
                </span>
              </div>
              <div className="h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(100, item.val)}%` }} className={`h-full ${item.color}`} />
              </div>
            </div>
          ))}
        </div>

        <dl className="divide-y divide-[var(--border-hairline)] text-xs border-y border-[var(--border-hairline)]">
          <div className="py-2 flex justify-between">
            <dt className="text-[var(--text-muted)]">Anggota & Kelayakan MyPertamina</dt>
            <dd className="font-mono-num font-medium">
              {c.spbu_count} SPBU (P1: {c.eligible_p1_count} · P2: {c.eligible_p2_count})
            </dd>
          </div>
          <div className="py-2 flex justify-between">
            <dt className="text-[var(--text-muted)]">Supply Terminal</dt>
            <dd className="font-mono-num font-medium">
              {c.primary_tbbm_name} ({c.avg_dist_to_tbbm_km} km)
            </dd>
          </div>
          <div className="py-2 flex justify-between">
            <dt className="text-[var(--text-muted)]">Demand ({regime === 'peak' ? 'Peak' : 'Normal'})</dt>
            <dd className="font-mono-num font-medium">
              {formatKL(regime === 'peak' ? c.peak_daily_demand_kl : c.avg_daily_demand_kl)}/hari
            </dd>
          </div>
        </dl>

        <button
          onClick={() => onNavigate('rag-routing')}
          className="w-full py-2.5 px-4 rounded-md bg-[var(--accent-blue)] text-white text-xs font-sub font-semibold tracking-wide hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2"
        >
          Inspeksi Rute CVRPTW Untuk {c.cluster_id}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* BAND 1: EDITORIAL HERO SPLIT + LIVE SPBU PHOTOGRAPHY */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Editorial Thesis */}
            <div className="lg:col-span-7 space-y-6">
              <Reveal>
                <div className="inline-flex flex-wrap items-center gap-2 text-[11px] font-sub uppercase tracking-[0.14em] text-[var(--accent-blue)] font-semibold">
                  <span>IKMS 2026 · PT Pertamina Patra Niaga</span>
                  <span className="text-[var(--border-strong)]">/</span>
                  <span className="text-[var(--text-muted)]">Regional Jatimbalinus · Jawa Timur</span>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[3.25rem] text-[var(--text-primary)] leading-[1.08] tracking-tight">
                  Memutus Efek Domino Kelangkaan BBM Subsidi dengan{' '}
                  <em className="italic text-[var(--accent-blue)] font-normal">
                    Spillover Intelligence
                  </em>
                  .
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="text-sm sm:text-base leading-relaxed text-[var(--text-secondary)] max-w-2xl">
                  <strong className="font-semibold text-[var(--text-primary)]">
                    MUARA (Multi-Tier Urban Adaptive Refueling &amp; Allocation)
                  </strong>{' '}
                  mengubah pendekatan logistik BBM bersubsidi yang sebelumnya reaktif berbasis{' '}
                  <em>single-silo threshold</em> (15% stok minimum per SPBU) menjadi arsitektur{' '}
                  <em>closed-loop prescriptive intelligence</em> lintas{' '}
                  <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                    38 Kab/Kota, 7 TBBM, dan 920 SPBU
                  </span>{' '}
                  dengan kuota tahunan{' '}
                  <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                    {formatKL(totalQuotaKl)}
                  </span>
                  .
                </p>
              </Reveal>

              <Reveal delay={0.14}>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => onNavigate('spatial')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--accent-blue)] text-white text-xs sm:text-sm font-sub font-semibold tracking-wide hover:opacity-95 transition-opacity"
                  >
                    Buka Simulator Domino Huff
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('rag-routing')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] text-xs sm:text-sm font-sub font-semibold tracking-wide hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    Uji RAG Copilot & Rute CVRPTW
                  </button>
                </div>
              </Reveal>
            </div>

            {/* Right Authentic Pertamina Field Photo & Caption Strip */}
            <div className="lg:col-span-5">
              <Reveal delay={0.12}>
                <figure className="relative overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)]">
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    <img
                      src="/images/pertamina-spbu.jpg"
                      alt="Stasiun Pengisian Bahan Bakar Umum (SPBU) PT Pertamina sebagai simpul distribusi hilir energi nasional"
                      className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
                  <figcaption className="absolute bottom-0 inset-x-0 p-4 sm:p-5 text-white">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-sub uppercase tracking-[0.14em] text-white/80 mb-1">
                      <span>Infrastruktur Hilir JBT & JBKP</span>
                      <span className="font-mono-num">920 Simpul SPBU</span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium leading-snug text-white">
                      Integrasi telemetri ATG tangki pendam, antrean MyPertamina, dan laporan{' '}
                      <em>Collective Intelligence</em> AMT ke dalam satu orkestrasi rute TBBM.
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>

          {/* Open Hairline Telemetry Strip (Anti-Card Grid) */}
          <div className="mt-10 pt-8 border-t border-[var(--border-hairline)] grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-[var(--border-hairline)]">
            <div className="lg:pr-8">
              <div className="text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Reduksi Stockout Berantai
              </div>
              <div className="font-mono-num text-3xl sm:text-4xl font-bold text-[var(--accent-green)] mt-1.5">
                <AnimatedCounter value={91.4} decimals={1} suffix="%" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                  7.250 -&gt; 624
                </span>{' '}
                insiden/tahun dibanding dispatch reaktif FCFS.
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
                Utilisasi kompartemen{' '}
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">94,8%</span>{' '}
                dengan{' '}
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">0,0%</span>{' '}
                pelanggaran shift HSSE 8 jam.
              </p>
            </div>

            <div className="lg:px-8">
              <div className="text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                Dekarbonisasi Transportasi
              </div>
              <div className="font-mono-num text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1.5">
                <AnimatedCounter value={719.9} decimals={1} suffix=" tCO₂e" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                Setara{' '}
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                  7.199 ton CO₂e
                </span>{' '}
                dalam horizon 10 tahun (IPCC 0,92 kg/km).
              </p>
            </div>

            <div className="lg:pl-8">
              <div className="text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                NPV 10-Tahun & IRR (Model C)
              </div>
              <div className="font-mono-num text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1.5">
                <AnimatedCounter value={modelC.NPV_10Yr_WACC10_Billion_IDR} decimals={2} prefix="Rp" suffix=" M" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                IRR{' '}
                <span className="font-mono-num font-semibold text-[var(--accent-green)]">
                  {modelC.IRR_Estimated_Pct.toFixed(1)}%
                </span>{' '}
                · Payback{' '}
                <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                  {modelC.Payback_Period_Years.toFixed(2)} tahun
                </span>{' '}
                (WACC 10%).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 2: PROBLEM FRAMING & ROOT CAUSE DIAGNOSIS */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-5">
              <EditorialHeader
                eyebrow="Akar Masalah Lapangan"
                title="Mengapa Aturan Stok 15% Memicu Keruntuhan Koridor?"
                description="Pada operasional eksisting, setiap SPBU diperlakukan sebagai entitas terisolasi (single-silo monitoring). Ketika satu titik kritis mengering saat lonjakan musiman atau hambatan akses, permintaan tidak berhenti—melainkan tumpah seketika ke tetangga."
                accent="red"
              />
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t sm:border-t-0 sm:border-l border-[var(--border-hairline)] pt-6 sm:pt-0 sm:pl-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-sub font-semibold text-[var(--accent-red)]">
                  <ShieldAlert className="w-4 h-4" />
                  <span>01 · Demand Spillover</span>
                </div>
                <h3 className="font-display text-lg text-[var(--text-primary)]">
                  Migrasi Antrean Eksponensial
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  Limpahan antrean menguras tangki SPBU tetangga lebih cepat daripada proyeksi rata-rata historis (Moving Average RMSE 10,017 jam), menimbulkan{' '}
                  <span className="font-mono-num font-medium text-[var(--text-primary)]">
                    7.250 insiden stockout/thn
                  </span>
                  .
                </p>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-sub font-semibold text-amber-600 dark:text-amber-400">
                  <MapPin className="w-4 h-4" />
                  <span>02 · Blind Spot Terisolasi</span>
                </div>
                <h3 className="font-display text-lg text-[var(--text-primary)]">
                  18 SPBU Tanpa Penyangga
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  Sebanyak{' '}
                  <span className="font-mono-num font-medium text-[var(--text-primary)]">
                    {isolatedBottlenecks.length} SPBU terpencil
                  </span>{' '}
                  berjarak &gt;15 menit dari tetangga mana pun. Penjadwalan FCFS konvensional memicu pengiriman darurat tunggal berbiaya{' '}
                  <span className="font-mono-num font-medium text-[var(--text-primary)]">
                    1,65x/km
                  </span>{' '}
                  dan melanggar{' '}
                  <span className="font-mono-num font-medium text-[var(--text-primary)]">11,4%</span>{' '}
                  shift AMT.
                </p>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-sub font-semibold text-[var(--accent-blue)]">
                  <Brain className="w-4 h-4" />
                  <span>03 · Pengetahuan Tacit Tercecer</span>
                </div>
                <h3 className="font-display text-lg text-[var(--text-primary)]">
                  Silo Laporan Operator & AMT
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  Informasi banjir pantura, pasar tumpah, maupun antrean panjang berhenti sebagai pesan teks tak terstruktur—tidak pernah diterjemahkan menjadi penalti waktu tempuh OSRM di sistem dispatch TBBM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 3: INTERACTIVE 5-STAGE CLOSED-LOOP ARCHITECTURE STEPPER */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[var(--border-hairline)]">
            <EditorialHeader
              eyebrow="Arsitektur Solusi Terintegrasi"
              title="Alur Kerja Closed-Loop 5 Tahap MUARA"
              description="Klik setiap tahap metodologi untuk meninjau mekanisme matematis, parameter terkalibrasi, dan kontribusi terukurnya terhadap pengendalian kelangkaan BBM."
            />
            <span className="text-[11px] font-mono-num text-[var(--text-muted)] shrink-0">
              Reproducible Seed = 42 · Horizon Uji 240 Jam ({peakSimulationPeakStockouts} puncak antrean)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
            {/* Stage selector list */}
            <div className="lg:col-span-5 divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isActive = idx === activeStageIdx;
                const Icon = stage.icon;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStageIdx(idx)}
                    className={`w-full text-left py-4 px-3 flex items-start gap-3.5 transition-colors ${
                      isActive ? 'bg-[var(--bg-subtle)]' : 'hover:bg-[var(--bg-subtle)]/50'
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
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                        {stage.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active stage detail view */}
            <motion.div
              key={currentStage.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-7 flex flex-col justify-between lg:pl-6 space-y-6"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-mono-num uppercase tracking-wider text-[var(--accent-blue)]">
                  <span>Tahap {currentStage.step} dari 05</span>
                  <span>·</span>
                  <span>{currentStage.tagline}</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-[var(--text-primary)] leading-tight">
                  {currentStage.name}
                </h3>

                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {currentStage.summary}
                </p>

                <div className="py-3 px-4 border-l-2 border-[var(--accent-blue)] bg-[var(--bg-subtle)]/70">
                  <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                    Spesifikasi Matematis & Parameter
                  </div>
                  <div className="font-mono-num text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-1">
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
                  Eksplorasi di Modul Terkait
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BAND 4: FULL-BLEED MAP & EDITORIAL TELEMETRY INSPECTOR */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <EditorialHeader
              eyebrow="Peta Operasi Jawa Timur"
              title="Topologi 38 Kluster Penyangga, 7 TBBM & Rute Multi-Drop"
              description="Klik kabupaten/kota, ikon TBBM, titik SPBU, atau gunakan Ctrl+K untuk menyorot entitas. Busur putus-putus menampilkan alur pengiriman CVRPTW aktif."
            />
            <span className="text-[11px] font-mono-num text-[var(--text-muted)]">
              Rezim Aktif:{' '}
              <strong className="text-[var(--text-primary)]">
                {regime === 'peak' ? 'Peak Lebaran / Nataru (1,28x)' : 'Operasional Normal (1,00x)'}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8">
              <EastJavaMap regime={regime} selection={selection} onSelect={onSelect} />
            </div>
            <div className="xl:col-span-4 xl:border-l border-[var(--border-hairline)] xl:pl-8 pt-2">
              <div className="text-[10px] font-sub uppercase tracking-[0.14em] text-[var(--text-muted)] mb-3">
                Inspektor Telemetri Simpul Terpilih
              </div>
              {renderTelemetryInspector()}
            </div>
          </div>
        </div>
      </section>

      {/* BAND 5: TOP 10 CRITICAL CLUSTERS RANKING TABLE */}
      <section className="bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <EditorialHeader
              eyebrow="Prioritas Intervensi CRITIC–AHP"
              title="Top-10 Kluster Kerentanan Tertinggi Jawa Timur"
              description="Delapan kluster teratas diklasifikasikan sebagai Tier-1 Kritis (MUARA Score >= 55) yang memperoleh prioritas utama dispatching multi-kompartemen dan pemantauan ATG."
              accent="green"
            />
            <button
              onClick={() => onNavigate('benchmarks')}
              className="text-xs font-sub font-semibold text-[var(--accent-blue)] hover:underline inline-flex items-center gap-1.5 shrink-0"
            >
              Audit Validasi 38 Kluster & Sensitivitas
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <DataTable
            data={topClusters}
            columns={clusterCols}
            rowKey={(r) => r.cluster_id}
            searchPlaceholder="Cari kluster (mis. Jember, Surabaya, Sidoarjo)..."
            searchMatcher={(r, q) =>
              `${r.cluster_id} ${r.cluster_name} ${r.primary_tbbm_name} ${r.Priority_Tier}`
                .toLowerCase()
                .includes(q)
            }
            selectedKey={selection?.type === 'cluster' ? selection.data.cluster_id : undefined}
            onRowClick={(r) => onSelect({ type: 'cluster', data: r })}
            maxHeightClass="max-h-[420px]"
          />
        </div>
      </section>
    </div>
  );
}
