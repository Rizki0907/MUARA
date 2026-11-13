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
import { Award, GraduationCap, Leaf, Users } from 'lucide-react';
import { cashflowSchedule, financialModels, sensitivityScenarios } from '../../data';
import { cn } from '../../utils/cn';
import { formatNumberId } from '../../utils/format';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { Badge } from '../ui/Badge';
import { EditorialHeader, Reveal } from '../ui/MotionPrimitives';

const TEAM_MEMBERS = [
  {
    order: '01',
    name: 'Rizki Piji Fathoni',
    role: 'Arsitektur Spasial-Temporal, RAG Copilot & Integrasi Sistem',
    focus: 'HDBSCAN · XGBoost + Modified Huff · Web Dashboard',
    email: '24031554029@mhs.unesa.ac.id',
  },
  {
    order: '02',
    name: 'Muhammad Habib Nur Aiman',
    role: 'Pemodelan Gravitasi Spillover & Kalibrasi CRITIC–AHP',
    focus: 'Multi-Criteria Prioritization · Uji Sensitivitas 15 Skenario',
    email: 'Prodi Sains Data · UNESA',
  },
  {
    order: '03',
    name: 'Daffa Ahmad Pangreksa',
    role: 'Optimasi Rute MILP CVRPTW & Analisis Finansial 10-Tahun',
    focus: 'OR-Tools GLS · HSSE 8h Constraint · NPV / IRR / ESG',
    email: 'Prodi Sains Data · UNESA',
  },
  {
    order: '04',
    name: 'Faishal Muflih Irfanu Tsaqib',
    role: 'Disagregasi Kuota Spasial VIIRS–GHSL & Basis Pengetahuan SOP',
    focus: 'Mass-Balance JBT/JBKP · Collective Intelligence Taxonomies',
    email: 'Prodi Sains Data · UNESA',
  },
];

export function EconomicsEsgView() {
  const [demandScenario, setDemandScenario] = useState<'baseline' | 'conservative' | 'shock'>(
    'baseline'
  );

  const scenarioRows = useMemo(
    () =>
      sensitivityScenarios.filter((s) => s.Weight_Scheme.startsWith('W1_Hybrid_CRITIC_AHP')),
    []
  );

  const activeScenarioRow = useMemo(() => {
    const idx = demandScenario === 'conservative' ? 0 : demandScenario === 'shock' ? 2 : 1;
    return scenarioRows[idx] ?? scenarioRows[1];
  }, [demandScenario, scenarioRows]);

  const npvSeries = useMemo(() => {
    const baseRow = scenarioRows[1];
    const targetRow = activeScenarioRow;

    const getFactor = (
      capex: number,
      baseNpv10: number,
      targetNpv10: number
    ) => {
      if (demandScenario === 'baseline') return 1;
      return (targetNpv10 + capex) / Math.max(0.01, baseNpv10 + capex);
    };

    const mA = financialModels.find((m) => m.Model_Code === 'Model A');
    const mB = financialModels.find((m) => m.Model_Code === 'Model B');
    const mC = financialModels.find((m) => m.Model_Code === 'Model C');

    const fA = getFactor(
      mA?.CAPEX_Billion_IDR ?? 2.88,
      baseRow?.Model_A_NPV10_Billion_IDR ?? 12.85,
      targetRow?.Model_A_NPV10_Billion_IDR ?? 12.85
    );
    const fB = getFactor(
      mB?.CAPEX_Billion_IDR ?? 9.92,
      baseRow?.Model_B_NPV10_Billion_IDR ?? 55.77,
      targetRow?.Model_B_NPV10_Billion_IDR ?? 55.77
    );
    const fC = getFactor(
      mC?.CAPEX_Billion_IDR ?? 18.4,
      baseRow?.Model_C_NPV10_Billion_IDR ?? 92.26,
      targetRow?.Model_C_NPV10_Billion_IDR ?? 92.26
    );

    const years = Array.from({ length: 11 }, (_, i) => i);
    return years.map((yr) => {
      const a0 =
        cashflowSchedule.find((c) => c.Model_Code === 'Model A' && c.Year === 0)
          ?.Cumulative_NPV_Billion_IDR ?? -2.88;
      const b0 =
        cashflowSchedule.find((c) => c.Model_Code === 'Model B' && c.Year === 0)
          ?.Cumulative_NPV_Billion_IDR ?? -9.92;
      const c0 =
        cashflowSchedule.find((c) => c.Model_Code === 'Model C' && c.Year === 0)
          ?.Cumulative_NPV_Billion_IDR ?? -18.4;

      const a = cashflowSchedule.find((c) => c.Model_Code === 'Model A' && c.Year === yr);
      const b = cashflowSchedule.find((c) => c.Model_Code === 'Model B' && c.Year === yr);
      const c = cashflowSchedule.find((c) => c.Model_Code === 'Model C' && c.Year === yr);

      const scaleCum = (val: number | undefined, y0: number, f: number) => {
        if (val === undefined) return 0;
        if (yr === 0) return Number(val.toFixed(2));
        return Number((y0 + (val - y0) * f).toFixed(2));
      };

      return {
        year: `Thn ${yr}`,
        modelA: scaleCum(a?.Cumulative_NPV_Billion_IDR, a0, fA),
        modelB: scaleCum(b?.Cumulative_NPV_Billion_IDR, b0, fB),
        modelC: scaleCum(c?.Cumulative_NPV_Billion_IDR, c0, fC),
      };
    });
  }, [demandScenario, scenarioRows, activeScenarioRow]);

  const modelC = useMemo(
    () => financialModels.find((m) => m.Model_Code === 'Model C') ?? financialModels[2],
    []
  );

  return (
    <div className="w-full">
      {/* BAND 1: TECHNO-ECONOMIC & ESG EXECUTIVE NARRATIVE */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <Reveal>
                <EditorialHeader
                  eyebrow="Modul 06 · Kelayakan Tekno-Ekonomi (WACC 10%) & ESG"
                  title="Investasi Rp18,40 Miliar Menghasilkan NPV Rp92,26 Miliar dalam 10 Tahun"
                  description="Studi ablasi finansial membandingkan sistem ambang statis (Model A), prediksi tanpa RAG (Model B), hingga arsitektur penuh MUARA (Model C). Penghematan muncul dari pemangkasan ritase darurat 1,65x/km, pemulihan margin yang hilang saat stockout, serta penurunan emisi armada tangki."
                  accent="green"
                />
              </Reveal>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-5 border-t lg:border-t-0 lg:border-l border-[var(--border-hairline)] pt-5 lg:pt-0 lg:pl-8">
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Net Benefit / Thn
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-green)] mt-1">
                  <AnimatedCounter
                    value={modelC.Net_Annual_Benefit_CF_Billion_IDR}
                    decimals={2}
                    prefix="Rp"
                    suffix=" M"
                  />
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Gross Rp{modelC.Gross_Annual_Savings_Billion_IDR.toFixed(2)} M/thn
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Payback Period
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--text-primary)] mt-1">
                  <AnimatedCounter value={modelC.Payback_Period_Years} decimals={2} suffix=" thn" />
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  IRR {modelC.IRR_Estimated_Pct.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                  Emisi CO₂e / 10 Thn
                </div>
                <div className="font-mono-num text-2xl font-bold text-[var(--accent-blue)] mt-1">
                  <AnimatedCounter
                    value={modelC.CO2e_Emission_Reduction_Ton_Yr * 10}
                    decimals={0}
                    suffix=" t"
                  />
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {modelC.CO2e_Emission_Reduction_Ton_Yr.toFixed(1)} ton/tahun
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Open Hairline Comparison (Model A vs B vs C) */}
          <div className="mt-10 pt-8 border-t border-[var(--border-hairline)] grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0 lg:divide-x divide-[var(--border-hairline)]">
            {financialModels.map((m, idx) => {
              const isModelC = m.Model_Code === 'Model C';
              return (
                <div
                  key={m.Model_Code}
                  className={cn(
                    'space-y-4',
                    idx === 0 && 'lg:pr-8',
                    idx === 1 && 'lg:px-8',
                    idx === 2 && 'lg:pl-8'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-mono-num uppercase tracking-wider text-[var(--text-muted)]">
                        {m.Model_Code}
                      </div>
                      <h3 className="font-display text-xl text-[var(--text-primary)] mt-0.5">
                        {m.Model_Name}
                      </h3>
                    </div>
                    <Badge variant={isModelC ? 'blue' : 'neutral'}>
                      {isModelC ? 'Rekomendasi Penuh' : 'Ablasi Baseline'}
                    </Badge>
                  </div>

                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {m.System_Description}
                  </p>

                  <dl className="divide-y divide-[var(--border-hairline)] text-xs border-t border-b border-[var(--border-hairline)]">
                    <div className="py-2 flex justify-between">
                      <dt className="text-[var(--text-muted)]">CAPEX / OPEX Tahunan</dt>
                      <dd className="font-mono-num font-medium">
                        Rp{m.CAPEX_Billion_IDR.toFixed(2)} M / Rp
                        {m.OPEX_Annual_Billion_IDR.toFixed(2)} M
                      </dd>
                    </div>
                    <div className="py-2 flex justify-between">
                      <dt className="text-[var(--text-muted)]">Reduksi Stockout &amp; Jarak</dt>
                      <dd className="font-mono-num font-semibold text-[var(--accent-blue)]">
                        {m.Cascading_Stockout_Reduction_Pct.toFixed(1)}% ·{' '}
                        {formatNumberId(m.Emergency_Km_Saved_Per_Yr)} km
                      </dd>
                    </div>
                    <div className="py-2 flex justify-between">
                      <dt className="text-[var(--text-muted)]">Net Cash Flow (CF_t)</dt>
                      <dd className="font-mono-num font-semibold text-[var(--accent-green)]">
                        Rp{m.Net_Annual_Benefit_CF_Billion_IDR.toFixed(2)} M/thn
                      </dd>
                    </div>
                    <div className="py-2 flex justify-between items-baseline">
                      <dt className="text-[var(--text-muted)]">10-Year NPV (WACC 10%)</dt>
                      <dd
                        className={cn(
                          'font-mono-num font-bold text-base',
                          isModelC ? 'text-[var(--accent-green)]' : 'text-[var(--text-primary)]'
                        )}
                      >
                        Rp{m.NPV_10Yr_WACC10_Billion_IDR.toFixed(2)} M
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BAND 2: INTERACTIVE 10-YEAR NPV CURVE & ESG BREAKDOWN */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
            <div className="xl:col-span-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
                <EditorialHeader
                  eyebrow="Analisis Arus Kas Terdiskonto (2026–2036)"
                  title="Kurva Kumulatif NPV 10 Tahun Lintas Rezim Permintaan"
                  description="Pilih skenario stres permintaan untuk menguji titik impas dan daya tahan nilai bersih investasi Model A, Model B, dan Model C."
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  {[
                    { id: 'conservative' as const, label: 'Konservatif (-15%)' },
                    { id: 'baseline' as const, label: 'Baseline (1,00x)' },
                    { id: 'shock' as const, label: 'Extreme Shock (+25%)' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setDemandScenario(btn.id)}
                      className={cn(
                        'px-3 py-1.5 rounded text-[11px] font-sub font-semibold transition-colors border',
                        demandScenario === btn.id
                          ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={npvSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                      unit=" M"
                    />
                    <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="4 4" />
                    <Tooltip
                      formatter={(value) => [`Rp${Number(value).toFixed(2)} Miliar`, '']}
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-strong)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="modelC"
                      name={`Model C Full MUARA (Rp${activeScenarioRow?.Model_C_NPV10_Billion_IDR.toFixed(2)} M)`}
                      stroke="#15803d"
                      strokeWidth={2.75}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="modelB"
                      name={`Model B No-RAG (Rp${activeScenarioRow?.Model_B_NPV10_Billion_IDR.toFixed(2)} M)`}
                      stroke="#0052a3"
                      strokeWidth={2}
                      dot={{ r: 2.5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="modelA"
                      name={`Model A Threshold (Rp${activeScenarioRow?.Model_A_NPV10_Billion_IDR.toFixed(2)} M)`}
                      stroke="#94a3b8"
                      strokeWidth={1.6}
                      strokeDasharray="4 3"
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right ESG & Value Attribution Breakdown */}
            <div className="xl:col-span-4 xl:border-l border-[var(--border-hairline)] xl:pl-8 space-y-6">
              <div className="space-y-2 pb-4 border-b border-[var(--border-hairline)]">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-sub uppercase tracking-wider text-[var(--accent-green)] font-semibold">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>Atribusi Manfaat Ekonomi &amp; ESG Model C</span>
                </div>
                <h3 className="font-display text-2xl text-[var(--text-primary)]">
                  Rp21,85 Miliar Bruto / Tahun
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">
                      Penghematan Dispatch Darurat
                    </span>
                    <span className="font-mono-num font-bold text-[var(--text-primary)]">
                      Rp{modelC.Emergency_Dispatch_Savings_Billion_IDR.toFixed(2)} M
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div style={{ width: '85.7%' }} className="h-full bg-[var(--accent-blue)]" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Menghilangkan biaya ritase insidental 1,65x/km melalui konsolidasi multi-drop.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">
                      Pemulihan Margin Hilang (Stockout)
                    </span>
                    <span className="font-mono-num font-bold text-[var(--text-primary)]">
                      Rp{modelC.Lost_Margin_Recovery_Billion_IDR.toFixed(2)} M
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div style={{ width: '14.3%' }} className="h-full bg-[var(--accent-green)]" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Penjualan terselamatkan karena 6.626 insiden kekosongan tangki tercegah.
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border-hairline)] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">
                      Faktor Emisi Truk Tangki IPCC
                    </span>
                    <span className="font-mono-num font-semibold">0,92 kg CO₂e / km</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">
                      Valuasi Karbon Tahunan (Bursa IDXCarbon)
                    </span>
                    <span className="font-mono-num font-semibold text-[var(--accent-green)]">
                      Rp{modelC.Carbon_Valuation_Million_IDR_Yr.toFixed(2)} Jt/thn
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">
                      OPEX Tahunan Sistem (Cloud + RAG API)
                    </span>
                    <span className="font-mono-num font-semibold">
                      Rp{modelC.OPEX_Annual_Billion_IDR.toFixed(2)} M (USD 240k)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 3: TEAM IDENTITY & RESEARCH ATTRIBUTION (FROM PAPER) */}
      <section className="bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <EditorialHeader
                eyebrow="Identitas Peneliti & Afiliasi"
                title="Tim Universitas Negeri Surabaya — IKMS 2026"
                description="Dikembangkan untuk Kompetisi Karya Tulis Ilmiah Inovasi Kemandirian Manajemen Energi & Solusi Bisnis (IKMS) 2026 yang diselenggarakan oleh Human Capital PT Pertamina Patra Niaga."
                accent="blue"
              />

              <div className="pt-2 space-y-2 text-xs text-[var(--text-secondary)]">
                <div className="inline-flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-[var(--accent-blue)] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[var(--text-primary)]">
                      Program Studi Sains Data
                    </strong>
                    <br />
                    Fakultas Matematika dan Ilmu Pengetahuan Alam, Universitas Negeri Surabaya
                    <br />
                    Jl. Ketintang, Gayungan, Kota Surabaya, Jawa Timur 60231
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 pt-1">
                  <Award className="w-4 h-4 text-[var(--accent-green)] shrink-0" />
                  <span>Tema Resmi: Fueling Sustainable Energy Transition through Innovation &amp; Collective Intelligence</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
              <div className="py-3 flex items-center justify-between text-[11px] font-sub uppercase tracking-wider text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                  Susunan Anggota Tim (Sesuai Naskah Paper)
                </span>
                <span className="font-mono-num">4 Penulis</span>
              </div>
              {TEAM_MEMBERS.map((member) => (
                <div
                  key={member.order}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono-num text-xs font-bold text-[var(--accent-blue)] pt-0.5">
                      {member.order}
                    </span>
                    <div>
                      <div className="font-display text-lg text-[var(--text-primary)] leading-tight">
                        {member.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {member.role}
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right pl-6 sm:pl-0">
                    <div className="font-mono-num text-[11px] text-[var(--text-primary)]">
                      {member.focus}
                    </div>
                    <div className="text-[11px] font-mono-num text-[var(--text-muted)]">
                      {member.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
