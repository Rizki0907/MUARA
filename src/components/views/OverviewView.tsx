import { useMemo } from 'react';
import {
  AlertTriangle,
  Building2,
  Fuel,
  Layers,
  Map as MapIcon,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  allSpbus,
  clustersRanking,
  isolatedBottlenecks,
  simulationBundle,
} from '../../data';
import type { ClusterRanking, MapSelection, NavTabId, PeriodRegime } from '../../types/muara';
import { formatIDRBillion, formatKL, formatNumberId } from '../../utils/format';
import { EastJavaMap } from '../map/EastJavaMap';
import { Badge } from '../ui/Badge';
import { DataTable, type ColumnDef } from '../ui/DataTable';
import { KpiCard } from '../ui/KpiCard';

interface OverviewViewProps {
  regime: PeriodRegime;
  selection: MapSelection | null;
  onSelect: (sel: MapSelection) => void;
  onNavigate: (tab: NavTabId) => void;
}

export function OverviewView({ regime, selection, onSelect, onNavigate }: OverviewViewProps) {
  const sparkData = useMemo(() => {
    const pts = simulationBundle.timeline.slice(0, 14);
    return {
      stockouts: pts.map((p) => Math.max(1, 22 - p.stockouts)),
      spillover: pts.map((p) => p.spillTotal),
      ci: pts.map((p) => p.ciMean),
      npv: [-18.4, -2.03, 12.86, 26.39, 38.69, 49.87, 60.04, 69.28, 77.68, 85.32, 92.26],
    };
  }, []);

  const topClusters = useMemo(() => clustersRanking.slice(0, 10), []);

  const clusterCols: ColumnDef<ClusterRanking>[] = [
    {
      key: 'Rank',
      header: '#',
      align: 'center',
      sortValue: (r) => r.Rank,
      render: (r) => (
        <span className="font-mono-num font-semibold text-zinc-500">#{r.Rank}</span>
      ),
    },
    {
      key: 'cluster',
      header: 'Kluster Penyangga',
      sortValue: (r) => r.cluster_name,
      render: (r) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">
            <span className="font-mono-num text-blue-600 dark:text-blue-400 mr-1.5">
              {r.cluster_id}
            </span>
            {r.cluster_name}
          </div>
          <div className="text-[11px] text-zinc-500">{r.primary_tbbm_name}</div>
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
          <span className="font-bold text-zinc-950 dark:text-zinc-50">
            {r.MUARA_Score.toFixed(2)}
          </span>
          <div className="w-24 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
            <div style={{ width: `${r.U_Urgency_Score * 0.3}%` }} className="bg-red-500" />
            <div style={{ width: `${r.D_Domino_Score * 0.3}%` }} className="bg-amber-500" />
            <div style={{ width: `${r.C_Collective_Score * 0.2}%` }} className="bg-blue-500" />
            <div style={{ width: `${r.A_Accessibility_Score * 0.2}%` }} className="bg-emerald-500" />
          </div>
        </div>
      ),
    },
    {
      key: 'ttd',
      header: 'Mean TTD',
      align: 'right',
      sortValue: (r) => r.mean_ttd_hr,
      render: (r) => <span>{r.mean_ttd_hr.toFixed(2)} jam</span>,
    },
    {
      key: 'demand',
      header: regime === 'peak' ? 'Peak Demand' : 'Avg Demand',
      align: 'right',
      sortValue: (r) => (regime === 'peak' ? r.peak_daily_demand_kl : r.avg_daily_demand_kl),
      render: (r) =>
        formatKL(regime === 'peak' ? r.peak_daily_demand_kl : r.avg_daily_demand_kl) + '/hr',
    },
  ];

  const renderInspector = () => {
    const active = selection ?? { type: 'cluster' as const, data: clustersRanking[0] };

    if (active.type === 'spbu') {
      const s = active.data;
      return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono-num text-blue-600 dark:text-blue-400">
                {s.id} · {s.kab}
              </div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mt-0.5">
                {s.name}
              </h3>
            </div>
            <Badge variant={s.iso ? 'red' : 'blue'}>
              {s.iso ? 'Isolated -1' : s.cl}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500">Kapasitas Tangki</div>
              <div className="font-mono-num font-semibold mt-0.5">{s.cap} KL</div>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500">Safety Buffer</div>
              <div className="font-mono-num font-semibold mt-0.5 text-amber-500">
                {(s.buf * 100).toFixed(0)}% {s.iso ? '(+20%)' : ''}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500">
                Permintaan ({regime === 'peak' ? 'Peak' : 'Normal'})
              </div>
              <div className="font-mono-num font-semibold mt-0.5">
                {(regime === 'peak' ? s.dPeak : s.dAvg).toFixed(2)} KL/hr
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500">Tetangga ≤15 Mnt</div>
              <div className="font-mono-num font-semibold mt-0.5">{s.nbrs} SPBU</div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <div className="flex justify-between">
              <span className="text-zinc-500">TBBM Penyuplai</span>
              <span className="font-mono-num font-medium">
                {s.tbbm} ({s.dist} km · {s.lead} jam)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Kelas Jalan & Max Truk</span>
              <span className="font-mono-num font-medium capitalize">
                {s.rc} · ≤{s.maxTrk} KL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Kuota BPH (Pertalite / Solar)</span>
              <span className="font-mono-num font-medium">
                {formatNumberId(s.qPert)} / {formatNumberId(s.qBio)} KL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Rezim Kerentanan</span>
              <span className="font-medium text-right">{s.reg}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('spatial')}
            className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors active:scale-[0.99]"
          >
            Simulasikan Efek Spillover SPBU Ini →
          </button>
        </div>
      );
    }

    if (active.type === 'tbbm') {
      const t = active.data;
      return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono-num text-blue-600 dark:text-blue-400">
                {t.tbbm_id} · Terminal Hub
              </div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mt-0.5">
                {t.name}
              </h3>
            </div>
            <Badge variant="blue">{t.fleet_count} Truk</Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.region_corridor}</p>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500">Kapasitas Timbun</div>
              <div className="font-mono-num font-semibold mt-0.5">
                {formatNumberId(t.capacity_kl)} KL
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500">Armada Kompartemen</div>
              <div className="font-mono-num font-semibold mt-0.5">
                {t.truck_16kl}/{t.truck_24kl}/{t.truck_32kl}
              </div>
              <div className="text-[10px] text-zinc-500">16 / 24 / 32 KL</div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('rag-routing')}
            className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
          >
            Lihat Rute CVRPTW Dari {t.tbbm_id} →
          </button>
        </div>
      );
    }

    if (active.type === 'kabkota') {
      const k = active.data;
      return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono-num text-zinc-500">BPS {k.bps_code}</div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mt-0.5">
                {k.kabkota_name}
              </h3>
            </div>
            <Badge variant="neutral">{k.spbu_count} SPBU</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500">Kuota Pertalite (JBKP)</div>
              <div className="font-mono-num font-semibold mt-0.5">
                {formatNumberId(k.kuota_pertalite_jbkp_kl_yr)} KL
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500">Kuota Biosolar (JBT)</div>
              <div className="font-mono-num font-semibold mt-0.5">
                {formatNumberId(k.kuota_biosolar_jbt_kl_yr)} KL
              </div>
            </div>
          </div>
          <div className="text-xs space-y-1.5 border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <div className="flex justify-between">
              <span className="text-zinc-500">Total Kuota BPH Migas</span>
              <span className="font-mono-num font-semibold">
                {formatNumberId(k.total_kuota_bbm_subsidi_kl_yr)} KL/thn
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">TBBM Penyuplai Utama</span>
              <span className="font-medium text-right">{k.primary_tbbm_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Faktor Tekanan Koridor</span>
              <span className="font-mono-num font-semibold">{k.corridor_pressure_factor}×</span>
            </div>
          </div>
        </div>
      );
    }

    const c = active.data;
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono-num text-blue-600 dark:text-blue-400">
              Rank #{c.Rank} · {c.cluster_id}
            </div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mt-0.5">
              {c.cluster_name}
            </h3>
          </div>
          <Badge variant={c.Priority_Tier.startsWith('Tier 1') ? 'red' : 'amber'}>
            {c.MUARA_Score.toFixed(1)}
          </Badge>
        </div>

        <div className="space-y-2">
          {[
            { label: 'Urgensi Stok (U · 30%)', val: c.U_Urgency_Score, bar: 'bg-red-500' },
            { label: 'Dampak Domino (D · 30%)', val: c.D_Domino_Score, bar: 'bg-amber-500' },
            { label: 'Collective Intel. (C · 20%)', val: c.C_Collective_Score, bar: 'bg-blue-500' },
            { label: 'Aksesibilitas TBBM (A · 20%)', val: c.A_Accessibility_Score, bar: 'bg-emerald-500' },
          ].map((dim) => (
            <div key={dim.label} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500 dark:text-zinc-400">{dim.label}</span>
                <span className="font-mono-num font-semibold">{dim.val.toFixed(1)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div className={`h-full ${dim.bar}`} style={{ width: `${dim.val}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-500">Mean TTD</div>
            <div className="font-mono-num font-semibold mt-0.5">{c.mean_ttd_hr} jam</div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-500">SPBU / Eligible</div>
            <div className="font-mono-num font-semibold mt-0.5">
              {c.spbu_count} / {regime === 'peak' ? c.eligible_p2_count : c.eligible_p1_count}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('spatial')}
          className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
        >
          Buka Analisis Spillover Kluster →
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 4 Context-Rich KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Reduksi Cascading Stockout"
          value="-91,4%"
          deltaText="+23,2 pp vs Spatial-Only"
          deltaType="positive"
          subtext="7.250 → 624 insiden/tahun (Model C)"
          sparkline={sparkData.stockouts}
          accentColor="red"
        />
        <KpiCard
          label="Penghematan Armada Darurat"
          value="782.500 km"
          deltaText="94,8% Utilisasi Truk"
          deltaType="positive"
          subtext="0,0% pelanggaran shift AMT (>8 jam HSSE)"
          sparkline={sparkData.ci}
          accentColor="blue"
        />
        <KpiCard
          label="Reduksi Emisi Karbon (ESG)"
          value="719,9 tCO2e"
          deltaText="7.199 ton / 10 thn"
          deltaType="positive"
          subtext="Faktor emisi truk berat IPCC 0,92 kg/km"
          sparkline={sparkData.spillover}
          accentColor="green"
        />
        <KpiCard
          label="NPV 10 Tahun (WACC 10%)"
          value={formatIDRBillion(92.26)}
          deltaText="Payback 1,02 thn"
          deltaType="positive"
          subtext="Net Benefit Rp18,01 M/thn · IRR 95,4%"
          sparkline={sparkData.npv}
          accentColor="amber"
        />
      </div>

      {/* Main Spatial Command Canvas + Right Telemetry Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8">
          <EastJavaMap regime={regime} selection={selection} onSelect={onSelect} />
        </div>

        <div className="xl:col-span-4 bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              {selection?.type === 'spbu' ? (
                <Fuel className="w-4 h-4 text-blue-500" />
              ) : selection?.type === 'tbbm' ? (
                <Building2 className="w-4 h-4 text-blue-500" />
              ) : selection?.type === 'kabkota' ? (
                <MapIcon className="w-4 h-4 text-blue-500" />
              ) : (
                <Layers className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Telemetry Inspector
              </span>
            </div>
            <span className="text-[11px] font-mono-num text-zinc-400">
              {allSpbus.length} SPBU · {isolatedBottlenecks.length} SPOF
            </span>
          </div>

          {renderInspector()}

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>SCR HDBSCAN: 94,2%</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>18 Isolated (+20% Buf)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Priority Clusters Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Top 10 Kluster Prioritas MUARA (Hybrid CRITIC-AHP)
            </h2>
          </div>
          <button
            onClick={() => onNavigate('spatial')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Lihat seluruh 38 kluster →
          </button>
        </div>

        <DataTable
          data={topClusters}
          columns={clusterCols}
          rowKey={(r) => r.cluster_id}
          selectedKey={selection?.type === 'cluster' ? selection.data.cluster_id : undefined}
          onRowClick={(r) => onSelect({ type: 'cluster', data: r })}
          maxHeightClass="max-h-[360px]"
        />
      </div>
    </div>
  );
}

