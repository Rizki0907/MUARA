import { Menu, Moon, Search, Sun } from 'lucide-react';
import type { NavTabId, PeriodRegime } from '../../types/muara';
import type { Theme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';

interface TopBarProps {
  activeTab: NavTabId;
  regime: PeriodRegime;
  onChangeRegime: (r: PeriodRegime) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenMobileMenu: () => void;
}

const TAB_META: Record<NavTabId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Command Overview — Regional Jatimbalinus',
    subtitle: 'Pemantauan stok ATG terintegrasi, 38 kluster penyangga HDBSCAN, dan 18 Isolated Bottleneck SPBU',
  },
  spatial: {
    title: 'Spatial Clustering & Modified Huff Spillover',
    subtitle: 'Simulasi efek domino peluberan permintaan antar-SPBU dan prediksi Time-to-Depletion (TTD)',
  },
  'rag-routing': {
    title: 'RAG Dispatcher Copilot & MILP CVRPTW',
    subtitle: 'Human-in-the-loop penerjemah SOP krisis TBBM, bobot jalan dinamis, dan rute multi-kompartemen',
  },
  benchmarks: {
    title: 'Multi-Model Benchmarking & Hybrid CRITIC-AHP',
    subtitle: 'Komparasi objektif klustering, prediksi TTD, solver armada, serta uji sensitivitas 15 skenario',
  },
  economics: {
    title: 'Studi Ablasi Operasional, Tekno-Ekonomi & ESG',
    subtitle: 'Evaluasi finansial 10 tahun (WACC 10%) dan reduksi emisi CO2e pada skenario Model A, B, dan C',
  },
};

export function TopBar({
  activeTab,
  regime,
  onChangeRegime,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenMobileMenu,
}: TopBarProps) {
  const meta = TAB_META[activeTab];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Buka navigasi"
          className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 truncate">
            {meta.title}
          </h1>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Demand Regime Switcher */}
        <div
          className="hidden md:flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 text-[11px]"
          role="group"
          aria-label="Mode Beban Permintaan"
        >
          <button
            onClick={() => onChangeRegime('normal')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              regime === 'normal'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            Normal (P1)
          </button>
          <button
            onClick={() => onChangeRegime('peak')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              regime === 'peak'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            Peak / Shock (P2)
          </button>
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cari SPBU / Kluster...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono-num bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
            Ctrl+K
          </kbd>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors active:scale-[0.98]"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}

