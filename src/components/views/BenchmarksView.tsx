import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Award, CheckCircle2, Scale, SlidersHorizontal } from 'lucide-react';
import {
  benchClustering,
  benchPrediction,
  benchRouting,
  clustersRanking,
  criticAhpWeights,
  sensitivityScenarios,
} from '../../data';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';

export function BenchmarksView() {
  const [benchTab, setBenchTab] = useState<'prediction' | 'clustering' | 'routing'>('prediction');
  const [theta, setTheta] = useState(0.5);

  const liveWeights = useMemo(() => {
    return criticAhpWeights.map((w) => {
      const hybrid = theta * w.Weight_CRITIC_Objective + (1 - theta) * w.Weight_AHP_Operational;
      return {
        ...w,
        liveWeight: hybrid,
      };
    });
  }, [theta]);

  const liveTop5 = useMemo(() => {
    const wMap = new Map(liveWeights.map((w) => [w.Dimension_Code, w.liveWeight]));
    const wU = wMap.get('U') ?? 0.3;
    const wD = wMap.get('D') ?? 0.3;
    const wC = wMap.get('C') ?? 0.2;
    const wA = wMap.get('A') ?? 0.2;

    return clustersRanking
      .map((c) => ({
        ...c,
        liveScore:
          wU * c.U_Urgency_Score +
          wD * c.D_Domino_Score +
          wC * c.C_Collective_Score +
          wA * c.A_Accessibility_Score,
      }))
      .sort((a, b) => b.liveScore - a.liveScore)
      .slice(0, 6);
  }, [liveWeights]);

  const chartData = useMemo(() => {
    if (benchTab === 'prediction') {
      return benchPrediction.map((m) => ({
        name: m.Model_Name.split(' (')[0].replace('Spatio-Temporal ', 'ST-'),
        primary: m.RMSE_TTD_Hours,
        secondary: m.Inference_Latency_ms,
        r2: m.R2_Score,
        isWinner: m.Model_Rank === 1,
      }));
    }
    if (benchTab === 'clustering') {
      return benchClustering.map((c) => ({
        name: c.Clustering_Model.split(' (')[0],
        primary: c.Spillover_Containment_Ratio_Pct,
        secondary: c.Road_Silhouette_Score * 100,
        isWinner: c.Algorithm_Rank === 1,
      }));
    }
    return benchRouting.map((r) => ({
      name: r.Routing_Method.split(' (')[0].replace('MILP OR-Tools ', 'OR-Tools '),
      primary: r.Cascading_Stockout_Reduction_Pct,
      secondary: r.Fleet_Compartment_Utilization_Pct,
      isWinner: r.Method_Rank === 1,
    }));
  }, [benchTab]);

  return (
    <div className="space-y-5">
      {/* Multi-Model Benchmarking Section */}
      <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Protokol Multi-Model Benchmarking MUARA
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'prediction' as const, label: '7 Model Prediksi TTD' },
              { id: 'clustering' as const, label: '5 Klustering Spasial' },
              { id: 'routing' as const, label: '4 Solver Rute Armada' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setBenchTab(t.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  benchTab === t.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
          <div className="xl:col-span-5 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,113,122,0.2)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={135}
                  tick={{ fontSize: 10, fill: '#a1a1aa' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fafafa',
                  }}
                />
                <Bar
                  dataKey="primary"
                  name={
                    benchTab === 'prediction'
                      ? 'RMSE TTD (Jam — lebih rendah lebih baik)'
                      : benchTab === 'clustering'
                      ? 'Spillover Containment (%)'
                      : 'Reduksi Cascading Stockout (%)'
                  }
                  radius={[0, 4, 4, 0]}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.isWinner
                          ? benchTab === 'prediction'
                            ? '#22c55e'
                            : '#2589f5'
                          : '#52525b'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="xl:col-span-7 overflow-x-auto">
            {benchTab === 'prediction' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase text-zinc-500">
                  <tr>
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-3">Model Prediksi TTD</th>
                    <th className="py-2 px-2 text-right">RMSE (Jam)</th>
                    <th className="py-2 px-2 text-right">MAE</th>
                    <th className="py-2 px-2 text-right">R²</th>
                    <th className="py-2 pl-2 text-right">Latensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                  {benchPrediction.map((m) => (
                    <tr
                      key={m.Model_Rank}
                      className={m.Model_Rank === 1 ? 'bg-emerald-500/5' : undefined}
                    >
                      <td className="py-2 pr-2 font-mono-num">#{m.Model_Rank}</td>
                      <td className="py-2 pr-3">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {m.Model_Name}
                        </div>
                        <div className="text-[11px] text-zinc-500">{m.Model_Family}</div>
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num font-semibold">
                        {m.RMSE_TTD_Hours.toFixed(3)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num">
                        {m.MAE_TTD_Hours.toFixed(3)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num">
                        {m.R2_Score.toFixed(4)}
                      </td>
                      <td className="py-2 pl-2 text-right font-mono-num">
                        {m.Inference_Latency_ms} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {benchTab === 'clustering' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase text-zinc-500">
                  <tr>
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-3">Algoritma</th>
                    <th className="py-2 px-2 text-right">Kluster</th>
                    <th className="py-2 px-2 text-right">Outlier</th>
                    <th className="py-2 px-2 text-right">Silhouette</th>
                    <th className="py-2 px-2 text-right">DBI</th>
                    <th className="py-2 pl-2 text-right">SCR %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                  {benchClustering.map((c) => (
                    <tr
                      key={c.Algorithm_Rank}
                      className={c.Algorithm_Rank === 1 ? 'bg-blue-500/5' : undefined}
                    >
                      <td className="py-2 pr-2 font-mono-num">#{c.Algorithm_Rank}</td>
                      <td className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {c.Clustering_Model}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num">{c.Clusters_Formed}</td>
                      <td className="py-2 px-2 text-right font-mono-num">
                        {c.Outlier_SPBU_Detected}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num font-semibold">
                        {c.Road_Silhouette_Score.toFixed(3)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num">
                        {c.Davies_Bouldin_Index_DBI.toFixed(3)}
                      </td>
                      <td className="py-2 pl-2 text-right font-mono-num font-semibold text-blue-600 dark:text-blue-400">
                        {c.Spillover_Containment_Ratio_Pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {benchTab === 'routing' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase text-zinc-500">
                  <tr>
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-3">Metode Optimasi</th>
                    <th className="py-2 px-2 text-right">Reduksi Stockout</th>
                    <th className="py-2 px-2 text-right">Hemat Km/thn</th>
                    <th className="py-2 px-2 text-right">Utilisasi</th>
                    <th className="py-2 pl-2 text-right">Pelanggaran Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                  {benchRouting.map((r) => (
                    <tr
                      key={r.Method_Rank}
                      className={r.Method_Rank === 1 ? 'bg-blue-500/5' : undefined}
                    >
                      <td className="py-2 pr-2 font-mono-num">#{r.Method_Rank}</td>
                      <td className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {r.Routing_Method}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                        {r.Cascading_Stockout_Reduction_Pct}%
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num">
                        {r.Emergency_Km_Saved_Per_Yr.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num">
                        {r.Fleet_Compartment_Utilization_Pct}%
                      </td>
                      <td className="py-2 pl-2 text-right font-mono-num">
                        {r.AMT_Shift_Violation_Rate_Pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Hybrid CRITIC-AHP Interactive Mixer & 15-Scenario Sensitivity Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Eksplorasi Sintesis Hybrid CRITIC-AHP
              </h2>
            </div>
            <Badge variant="green">CR = 0,0042 &lt; 0,05</Badge>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-500">Proporsi Sintesis (θ CRITIC vs AHP)</span>
              <span className="font-mono-num font-semibold">θ = {theta.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={theta}
              onChange={(e) => setTheta(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono-num">
              <span>0,00 (AHP Pakar Murni)</span>
              <span>0,50 (MUARA Seimbang)</span>
              <span>1,00 (CRITIC Objektif)</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {liveWeights.map((w) => (
              <div key={w.Dimension_Code} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                    [{w.Dimension_Code}] {w.Dimension_Name.split(' (')[0]}
                  </span>
                  <span className="font-mono-num font-semibold">
                    {(w.liveWeight * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-150"
                    style={{ width: `${w.liveWeight * 100 * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Peringkat Top-6 Dinamis (Saat θ = {theta.toFixed(2)})
            </div>
            {liveTop5.map((c, i) => (
              <div
                key={c.cluster_id}
                className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
              >
                <span>
                  <span className="font-mono-num text-zinc-400 mr-2">#{i + 1}</span>
                  <span className="font-mono-num font-semibold text-blue-600 dark:text-blue-400 mr-1.5">
                    {c.cluster_id}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {c.cluster_name.split(' (')[0]}
                  </span>
                </span>
                <span className="font-mono-num font-semibold">{c.liveScore.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 15-Scenario Rank Stability Heatmap */}
        <div className="xl:col-span-7 bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Uji Ketahanan 15 Skenario Bobot & Guncangan Permintaan
              </h2>
            </div>
            <Badge variant="green">
              <CheckCircle2 className="w-3 h-3" /> Top-5 Konsisten 100% (ρ ≥ 0,9667)
            </Badge>
          </div>

          <div className="overflow-x-auto max-h-[360px]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 uppercase text-zinc-500">
                <tr>
                  <th className="py-2 pr-2">Skema Bobot</th>
                  <th className="py-2 px-2">Skenario Permintaan</th>
                  <th className="py-2 px-2 text-right">Spearman ρ</th>
                  <th className="py-2 px-2 text-center">Top 1–3</th>
                  <th className="py-2 pl-2 text-right">NPV Model C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                {sensitivityScenarios.map((s, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-2 pr-2 font-medium text-zinc-800 dark:text-zinc-200">
                      {s.Weight_Scheme.split(' (')[0]}
                    </td>
                    <td className="py-2 px-2 text-zinc-500">
                      {s.Demand_Scenario.split(' (')[0]}
                    </td>
                    <td className="py-2 px-2 text-right font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                      {s.Spearman_Rank_Correlation_Rho.toFixed(4)}
                    </td>
                    <td className="py-2 px-2 text-center font-mono-num">
                      {s.Rank1_Cluster} · {s.Rank2_Cluster} · {s.Rank3_Cluster}
                    </td>
                    <td className="py-2 pl-2 text-right font-mono-num font-semibold">
                      Rp{s.Model_C_NPV10_Billion_IDR.toFixed(2)} M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

