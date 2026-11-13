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
import { CheckCircle2, SlidersHorizontal } from 'lucide-react';
import {
  benchClustering,
  benchPrediction,
  benchRouting,
  clustersRanking,
  criticAhpWeights,
  sensitivityScenarios,
} from '../../data';
import { cn } from '../../utils/cn';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { Badge } from '../ui/Badge';
import { EditorialHeader, Reveal } from '../ui/MotionPrimitives';

export function BenchmarksView() {
  const [benchTab, setBenchTab] = useState<'prediction' | 'clustering' | 'routing'>('prediction');
  const [theta, setTheta] = useState(0.5);

  const liveWeights = useMemo(() => {
    return criticAhpWeights.map((w) => ({
      ...w,
      liveWeight: theta * w.Weight_CRITIC_Objective + (1 - theta) * w.Weight_AHP_Operational,
    }));
  }, [theta]);

  const liveTop6 = useMemo(() => {
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
    <div className="w-full">
      {/* BAND 1: METHODOLOGICAL RIGOR HEADER */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <EditorialHeader
                  eyebrow="Validasi Empiris & Ablasi Ketat (Seed = 42)"
                  title="Komparasi 7 Model Prediksi, 5 Algoritma Klaster & 4 Solver Rute"
                  description="Seluruh komparasi dijalankan dengan 5-Fold Time-Series Split bebas kebocoran data masa depan. Model gabungan MUARA mengungguli Bi-LSTM dalam kecepatan inferensi (11,2 ms vs 142,0 ms) maupun akurasi (RMSE TTD 2,391 jam; R² = 0,9759)."
                  accent="blue"
                />
              </Reveal>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-5 border-t lg:border-t-0 lg:border-l border-[var(--border-hairline)] pt-5 lg:pt-0 lg:pl-8">
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  RMSE TTD (R² 0,9759)
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-blue)] mt-1">
                  <AnimatedCounter value={2.391} decimals={3} suffix=" j" />
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">-76,1% vs Moving Avg</div>
              </div>
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Konsistensi AHP (CR)
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-green)] mt-1">
                  0,0042
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Batas keras &lt; 0,05</div>
              </div>
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Stabilitas Spearman rho
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--text-primary)] mt-1">
                  &gt;=0,9667
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Top-5 100% stabil</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 2: TABBED MULTI-MODEL BENCHMARKING */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[var(--border-hairline)] mb-8">
            <EditorialHeader
              eyebrow="Benchmarking Komparatif"
              title={
                benchTab === 'prediction'
                  ? '7 Model Prediksi Time-to-Depletion (TTD)'
                  : benchTab === 'clustering'
                  ? '5 Algoritma Klasterisasi Penyangga Spasial'
                  : '4 Paradigma Optimasi Pengiriman TBBM'
              }
              description={
                benchTab === 'prediction'
                  ? 'Metrik lebih rendah (RMSE TTD) menandakan prediksi kehabisan tangki lebih presisi untuk intervensi sebelum spillover memuncak.'
                  : benchTab === 'clustering'
                  ? 'Spillover Containment Ratio (SCR) mengukur persentase migrasi permintaan yang berhasil tertampung di dalam kluster sendiri.'
                  : 'OR-Tools MILP + GLS memadukan jadwal multi-drop dengan batas waktu bongkar-settling 45 menit serta kepatuhan shift 8 jam.'
              }
            />

            <div className="flex items-center gap-5 shrink-0">
              {[
                { id: 'prediction' as const, label: 'Prediksi TTD (7)' },
                { id: 'clustering' as const, label: 'Klasterisasi (5)' },
                { id: 'routing' as const, label: 'Routing (4)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setBenchTab(t.id)}
                  className={cn(
                    'pb-2 text-xs font-sub font-semibold border-b-2 transition-colors',
                    benchTab === t.id
                      ? 'border-[var(--accent-blue)] text-[var(--text-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={145}
                    tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="primary"
                    name={
                      benchTab === 'prediction'
                        ? 'RMSE TTD (jam)'
                        : benchTab === 'clustering'
                        ? 'Containment Ratio (%)'
                        : 'Reduksi Stockout (%)'
                    }
                    radius={[0, 4, 4, 0]}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.isWinner ? '#0052a3' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-7 overflow-x-auto lg:border-l border-[var(--border-hairline)] lg:pl-8">
              {benchTab === 'prediction' && (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)] text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">Model Prediksi</th>
                      <th className="py-2.5 px-2 text-right">RMSE (KL/j)</th>
                      <th className="py-2.5 px-2 text-right">RMSE TTD</th>
                      <th className="py-2.5 px-2 text-right">MAPE</th>
                      <th className="py-2.5 px-2 text-right">R²</th>
                      <th className="py-2.5 px-2 text-right">Latensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {benchPrediction.map((m) => (
                      <tr
                        key={m.Model_Name}
                        className={m.Model_Rank === 1 ? 'bg-[var(--bg-subtle)]/75' : ''}
                      >
                        <td className="py-2.5 px-2 font-mono-num">#{m.Model_Rank}</td>
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-[var(--text-primary)]">{m.Model_Name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{m.Key_Diagnostic}</div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          {m.RMSE_Depletion_KL_Hr.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-bold">
                          {m.RMSE_TTD_Hours.toFixed(3)} j
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          {m.MAPE_Percent.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          {m.R2_Score.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          {m.Inference_Latency_ms.toFixed(1)} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {benchTab === 'clustering' && (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)] text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">Algoritma</th>
                      <th className="py-2.5 px-2 text-right">Kluster</th>
                      <th className="py-2.5 px-2 text-right">Outlier</th>
                      <th className="py-2.5 px-2 text-right">Silhouette</th>
                      <th className="py-2.5 px-2 text-right">DBI</th>
                      <th className="py-2.5 px-2 text-right">SCR (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {benchClustering.map((c) => (
                      <tr
                        key={c.Clustering_Model}
                        className={c.Algorithm_Rank === 1 ? 'bg-[var(--bg-subtle)]/75' : ''}
                      >
                        <td className="py-2.5 px-2 font-mono-num">#{c.Algorithm_Rank}</td>
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-[var(--text-primary)]">
                            {c.Clustering_Model}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {c.Operational_Evaluation}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">{c.Clusters_Formed}</td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          {c.Outlier_SPBU_Detected}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          {c.Road_Silhouette_Score.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          {c.Davies_Bouldin_Index_DBI.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-bold text-[var(--accent-blue)]">
                          {c.Spillover_Containment_Ratio_Pct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {benchTab === 'routing' && (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)] text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">Paradigma Solver</th>
                      <th className="py-2.5 px-2 text-right">Reduksi Stockout</th>
                      <th className="py-2.5 px-2 text-right">Km Dihemat/thn</th>
                      <th className="py-2.5 px-2 text-right">Utilisasi</th>
                      <th className="py-2.5 px-2 text-right">Pelanggaran Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {benchRouting.map((r) => (
                      <tr
                        key={r.Routing_Method}
                        className={r.Method_Rank === 1 ? 'bg-[var(--bg-subtle)]/75' : ''}
                      >
                        <td className="py-2.5 px-2 font-mono-num">#{r.Method_Rank}</td>
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-[var(--text-primary)]">
                            {r.Routing_Method}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {r.Solver_Paradigm}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-bold text-[var(--accent-green)]">
                          {r.Cascading_Stockout_Reduction_Pct.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          {r.Emergency_Km_Saved_Per_Yr.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          {r.Fleet_Compartment_Utilization_Pct.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">
                          <Badge variant={r.AMT_Shift_Violation_Rate_Pct === 0 ? 'green' : 'red'}>
                            {r.AMT_Shift_Violation_Rate_Pct.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BAND 3: HYBRID CRITIC-AHP INTERACTIVE MIXER & 15-SCENARIO SENSITIVITY */}
      <section className="bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Left Hybrid CRITIC-AHP Weight Simulator */}
            <div className="xl:col-span-6 space-y-6">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
                <EditorialHeader
                  eyebrow="Eksperimen Kalibrasi Bobot"
                  title="Penyeimbang Hybrid CRITIC–AHP (Parameter theta)"
                  description="Geser theta untuk mengamati perpaduan variansi objektif data CRITIC dan preferensi tata kelola AHP (lambda_max = 4,011 · CI = 0,0038 · CR = 0,0042)."
                />
                <Badge variant="green" className="shrink-0">
                  CR 0,0042 &lt; 0,05
                </Badge>
              </div>

              <div className="py-3 px-4 border-l-2 border-[var(--accent-blue)] bg-[var(--bg-subtle)]/70">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-sub font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                    theta (CRITIC Objektif vs AHP Pakar)
                  </span>
                  <span className="font-mono-num font-bold text-[var(--accent-blue)]">
                    theta = {theta.toFixed(2)} (
                    {theta === 0.5 ? 'Standar Paper' : 'Kustom'})
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={theta}
                  onChange={(e) => setTheta(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] font-sub text-[var(--text-muted)] mt-1">
                  <span>0,00 = 100% AHP Operasional</span>
                  <span>0,50 = Hibrida Terkalibrasi</span>
                  <span>1,00 = 100% CRITIC Data</span>
                </div>
              </div>

              <div className="divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
                {liveWeights.map((w) => (
                  <div key={w.Dimension_Code} className="py-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-[var(--text-primary)]">
                        <strong className="font-mono-num text-[var(--accent-blue)] mr-1.5">
                          {w.Dimension_Code}
                        </strong>
                        {w.Dimension_Name}
                      </span>
                      <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                        {(w.liveWeight * 100).toFixed(1)}%
                        <span className="text-[var(--text-muted)] font-normal ml-1.5">
                          (Paper: {(w.Weight_MUARA_Calibrated * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        style={{ width: `${w.liveWeight * 100}%` }}
                        className="h-full bg-[var(--accent-blue)] transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                  Top-6 Kluster Live Pada theta = {theta.toFixed(2)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 border-y border-[var(--border-hairline)]">
                  {liveTop6.map((c, idx) => (
                    <div
                      key={c.cluster_id}
                      className="flex items-center justify-between py-2.5 text-xs border-b border-[var(--border-hairline)]"
                    >
                      <span className="truncate pr-2 text-[var(--text-primary)]">
                        <span className="font-mono-num text-[var(--text-muted)] mr-1.5">
                          #{idx + 1}
                        </span>
                        <span className="font-mono-num font-semibold text-[var(--accent-blue)] mr-1">
                          {c.cluster_id}
                        </span>
                        {c.cluster_name}
                      </span>
                      <span className="font-mono-num font-bold text-[var(--text-primary)]">
                        {c.liveScore.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 15-Scenario Sensitivity Verification */}
            <div className="xl:col-span-6 xl:border-l border-[var(--border-hairline)] xl:pl-10 space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
                <EditorialHeader
                  eyebrow="Uji Ketahanan Lintas 15 Skenario"
                  title="Konsistensi Peringkat Top-5 & NPV pada Variasi Bobot & Shock"
                  description="Menguji kombinasi skema bobot (MUARA Calibrated, CRITIC Only, AHP Only, Equal) terhadap rezim Normal (1,00x), Peak Lebaran/Nataru (1,28x), dan Extreme Shock (1,45x)."
                />
                <Badge variant="green" className="shrink-0">
                  100% Top-5 Match
                </Badge>
              </div>

              <div className="max-h-[430px] overflow-y-auto overflow-x-auto border-y border-[var(--border-hairline)]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 border-b border-[var(--border-hairline)]">
                    <tr className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-2.5 px-2">Skema Bobot</th>
                      <th className="py-2.5 px-2">Skenario Beban</th>
                      <th className="py-2.5 px-2 text-right">Spearman rho</th>
                      <th className="py-2.5 px-2 text-right">Top-5 Stabil</th>
                      <th className="py-2.5 px-2 text-right">NPV Model C</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {sensitivityScenarios.map((sc, i) => (
                      <tr key={i} className="hover:bg-[var(--bg-subtle)]/50">
                        <td className="py-2.5 px-2 font-medium text-[var(--text-primary)]">
                          {sc.Weight_Scheme}
                        </td>
                        <td className="py-2.5 px-2 text-[var(--text-secondary)]">
                          {sc.Demand_Scenario}{' '}
                          <span className="font-mono-num text-[var(--text-muted)]">
                            ({sc.Demand_Multiplier.toFixed(2)}x)
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-bold text-[var(--accent-blue)]">
                          {sc.Spearman_Rank_Correlation_Rho.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-semibold text-[var(--accent-green)]">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {sc.Top5_Consistency_Pct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-semibold text-[var(--text-primary)]">
                          Rp{sc.Model_C_NPV10_Billion_IDR.toFixed(2)} M
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
    </div>
  );
}
