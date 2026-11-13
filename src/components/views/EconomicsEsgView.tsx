import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DollarSign, Leaf, TrendingUp } from 'lucide-react';
import { cashflowSchedule, financialModels, sensitivityScenarios } from '../../data';
import { cn } from '../../utils/cn';
import { formatIDRBillion, formatNumberId } from '../../utils/format';
import { Badge } from '../ui/Badge';

export function EconomicsEsgView() {
  const [demandScenario, setDemandScenario] = useState<'baseline' | 'conservative' | 'shock'>('baseline');

  const multiplier = demandScenario === 'conservative' ? 0.7817 : demandScenario === 'shock' ? 1.3638 : 1.0;

  const npvSeries = useMemo(() => {
    const years = Array.from({ length: 11 }, (_, i) => i);
    return years.map((yr) => {
      const a = cashflowSchedule.find((c) => c.Model_Code === 'Model A' && c.Year === yr);
      const b = cashflowSchedule.find((c) => c.Model_Code === 'Model B' && c.Year === yr);
      const c = cashflowSchedule.find((c) => c.Model_Code === 'Model C' && c.Year === yr);

      const scale = (val: number | undefined) => {
        if (val === undefined) return 0;
        if (yr === 0) return val;
        return Number((val * (demandScenario === 'baseline' ? 1 : multiplier)).toFixed(2));
      };

      return {
        year: `Thn ${yr}`,
        modelA: scale(a?.Cumulative_NPV_Billion_IDR),
        modelB: scale(b?.Cumulative_NPV_Billion_IDR),
        modelC: scale(c?.Cumulative_NPV_Billion_IDR),
      };
    });
  }, [demandScenario, multiplier]);

  const scenarioRows = useMemo(
    () =>
      sensitivityScenarios.filter((s) =>
        s.Weight_Scheme.startsWith('W1_Hybrid_CRITIC_AHP')
      ),
    []
  );

  return (
    <div className="space-y-5">
      {/* 3-Scenario Ablation Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {financialModels.map((m) => {
          const isModelC = m.Model_Code === 'Model C';
          return (
            <div
              key={m.Model_Code}
              className={cn(
                'rounded-xl p-4 border space-y-3 transition-colors',
                isModelC
                  ? 'bg-white dark:bg-[#111114] border-blue-600/40 dark:border-blue-500/40'
                  : 'bg-white dark:bg-[#111114] border-zinc-200 dark:border-zinc-800'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono-num uppercase text-zinc-500">
                    {m.Model_Code}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    {m.Model_Name}
                  </h3>
                </div>
                <Badge variant={isModelC ? 'green' : m.Model_Code === 'Model B' ? 'blue' : 'neutral'}>
                  {isModelC ? 'Full MUARA' : m.Model_Code === 'Model B' ? 'Spatial AI' : 'Baseline'}
                </Badge>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {m.System_Description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] uppercase text-zinc-500">NPV 10 Tahun</div>
                  <div className="font-mono-num font-bold text-sm text-zinc-950 dark:text-zinc-50 mt-0.5">
                    {formatIDRBillion(m.NPV_10Yr_WACC10_Billion_IDR)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] uppercase text-zinc-500">Payback Period</div>
                  <div className="font-mono-num font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {m.Payback_Period_Years.toFixed(2)} thn
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-zinc-500">CAPEX / OPEX Tahunan</span>
                  <span className="font-mono-num">
                    Rp{m.CAPEX_Billion_IDR.toFixed(2)} M / Rp{m.OPEX_Annual_Billion_IDR.toFixed(2)} M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Net Annual Benefit (CFt)</span>
                  <span className="font-mono-num font-semibold">
                    {formatIDRBillion(m.Net_Annual_Benefit_CF_Billion_IDR)}/thn
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reduksi Stockout / Emisi</span>
                  <span className="font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                    -{m.Cascading_Stockout_Reduction_Pct}% / {m.CO2e_Emission_Reduction_Ton_Yr} tCO2e
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 10-Year Cumulative Discounted Cash Flow Chart */}
      <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Kurva Kumulatif Discounted Cash Flow / NPV 10 Tahun (WACC 10%)
              </h2>
              <p className="text-xs text-zinc-500">
                Seluruh skenario menunjukkan kelayakan finansial positif dengan break-even cepat (~1 tahun)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: 'conservative' as const, label: 'Konservatif (-15%)' },
              { id: 'baseline' as const, label: 'Baseline (Normal)' },
              { id: 'shock' as const, label: 'Extreme Shock (+25%)' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setDemandScenario(s.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium border transition-colors',
                  demandScenario === s.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={npvSeries} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,113,122,0.2)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} unit=" M" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fafafa',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="modelC"
                name="Model C: Full MUARA System (Rp M)"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="modelB"
                name="Model B: Spatial AI Only (Rp M)"
                stroke="#2589f5"
                strokeWidth={2}
                dot={{ r: 2.5 }}
              />
              <Line
                type="monotone"
                dataKey="modelA"
                name="Model A: Reactive Baseline (Rp M)"
                stroke="#a1a1aa"
                strokeWidth={1.75}
                strokeDasharray="5 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ESG & Value Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold">Dekomposisi Penghematan Tahunan (Model C)</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              {
                label: 'Eliminasi Perjalanan Darurat (782.500 km/thn)',
                val: 'Rp18,72 Miliar/thn',
                pct: 85.7,
                color: 'bg-blue-500',
              },
              {
                label: 'Penyelamatan Margin Ritel (Cegah Stockout)',
                val: 'Rp3,13 Miliar/thn',
                pct: 14.3,
                color: 'bg-emerald-500',
              },
              {
                label: 'Valuasi Reduksi Emisi Karbon (719,9 tCO2e/thn)',
                val: 'Rp172,78 Juta/thn',
                pct: 3.5,
                color: 'bg-amber-500',
              },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">{item.label}</span>
                  <span className="font-mono-num font-semibold">{item.val}</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Sensitivitas NPV 10 Tahun Lintas Skenario</h3>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase text-zinc-500">
              <tr>
                <th className="py-2">Skenario Permintaan</th>
                <th className="py-2 text-right">Model A</th>
                <th className="py-2 text-right">Model B</th>
                <th className="py-2 text-right">Model C</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 font-mono-num">
              {scenarioRows.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 font-sans text-zinc-700 dark:text-zinc-300">
                    {r.Demand_Scenario}
                  </td>
                  <td className="py-2 text-right">Rp{formatNumberId(r.Model_A_NPV10_Billion_IDR, 2)} M</td>
                  <td className="py-2 text-right">Rp{formatNumberId(r.Model_B_NPV10_Billion_IDR, 2)} M</td>
                  <td className="py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    Rp{formatNumberId(r.Model_C_NPV10_Billion_IDR, 2)} M
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

