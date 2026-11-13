import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface KpiCardProps {
  label: string;
  value: string;
  deltaText: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  subtext: string;
  sparkline: number[];
  accentColor?: 'blue' | 'green' | 'red' | 'amber';
}

const sparkColors = {
  blue: '#2589f5',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
};

export function KpiCard({
  label,
  value,
  deltaText,
  deltaType = 'positive',
  subtext,
  sparkline,
  accentColor = 'blue',
}: KpiCardProps) {
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline);
  const range = max - min || 1;
  const width = 92;
  const height = 32;

  const points = sparkline
    .map((v, i) => {
      const x = (i / Math.max(1, sparkline.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const stroke = sparkColors[accentColor];

  return (
    <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 transition-colors duration-150 hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono-num font-medium',
            deltaType === 'positive' &&
              'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
            deltaType === 'negative' &&
              'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
            deltaType === 'neutral' &&
              'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
          )}
        >
          {deltaType === 'positive' && <ArrowUpRight className="w-3 h-3" />}
          {deltaType === 'negative' && <ArrowDownRight className="w-3 h-3" />}
          {deltaText}
        </span>
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-bold tracking-tight font-mono-num text-zinc-950 dark:text-zinc-50">
            {value}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtext}</div>
        </div>

        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="shrink-0 overflow-visible"
          aria-hidden="true"
        >
          <polyline
            fill="none"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
}

