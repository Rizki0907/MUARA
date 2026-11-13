import { motion } from 'framer-motion';
import { Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useState } from 'react';
import type { Theme } from '../../hooks/useTheme';
import type { NavTabId, PeriodRegime } from '../../types/muara';
import { cn } from '../../utils/cn';

interface TopNavProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  regime: PeriodRegime;
  onChangeRegime: (r: PeriodRegime) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
}

const NAV_ITEMS: { id: NavTabId; label: string }[] = [
  { id: 'overview', label: 'Beranda & Solusi' },
  { id: 'spatial', label: 'Spillover & Domino' },
  { id: 'rag-routing', label: 'RAG & Rute CVRPTW' },
  { id: 'benchmarks', label: 'Validasi & CRITIC-AHP' },
  { id: 'economics', label: 'Ekonomi, ESG & Tim' },
];

export function TopNav({
  activeTab,
  onSelectTab,
  regime,
  onChangeRegime,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
}: TopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-[#f7f6f2]/90 dark:bg-[#0b0d10]/90 backdrop-blur-md">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <button
          onClick={() => onSelectTab('overview')}
          className="flex items-center gap-3 shrink-0 focus:outline-none group"
          aria-label="Beranda MUARA"
        >
          <img
            src={theme === 'dark' ? './brand/logo-dark.png' : './brand/logo-light.png'}
            alt="MUARA Wordmark"
            className="h-7 sm:h-8 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.02]"
          />
          <span className="hidden xl:inline-flex items-center pl-3 border-l border-[var(--border-hairline)] text-[11px] font-sub uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            IKMS 2026 · Pertamina Patra Niaga
          </span>
        </button>

        {/* Horizontal Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Navigasi Utama">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  'relative px-3 py-2 text-[13px] font-sub font-medium transition-colors duration-150 whitespace-nowrap',
                  active
                    ? 'text-[#004c97] dark:text-[#2d8cff]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="top-nav-underline"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute left-3 right-3 -bottom-[17px] h-[2px] bg-[#004c97] dark:bg-[#2d8cff]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="hidden sm:flex items-center rounded-full border border-[var(--border-hairline)] bg-white/70 dark:bg-[#12161c] p-0.5 text-[11px] font-sub"
            role="group"
            aria-label="Mode Beban Permintaan"
          >
            <button
              onClick={() => onChangeRegime('normal')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors',
                regime === 'normal'
                  ? 'bg-[#004c97] dark:bg-[#2d8cff] text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              Normal
            </button>
            <button
              onClick={() => onChangeRegime('peak')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors',
                regime === 'peak'
                  ? 'bg-[#c81e1e] dark:bg-[#f43f5e] text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              Peak Shock
            </button>
          </div>

          <button
            onClick={onOpenCommandPalette}
            aria-label="Cari SPBU, Kluster, atau TBBM"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--border-hairline)] bg-white/70 dark:bg-[#12161c] text-xs font-sub text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cari</span>
            <kbd className="hidden md:inline text-[10px] text-zinc-400">⌘K</kbd>
          </button>

          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[var(--border-hairline)] bg-white/70 dark:bg-[#12161c] text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors active:scale-95"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu navigasi mobile"
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-full border border-[var(--border-hairline)] bg-white/70 dark:bg-[#12161c] text-zinc-700 dark:text-zinc-300"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--border-hairline)] bg-[#f7f6f2] dark:bg-[#0b0d10] px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-sub font-medium transition-colors',
                  active
                    ? 'bg-[#004c97]/10 text-[#004c97] dark:bg-[#2d8cff]/15 dark:text-[#2d8cff]'
                    : 'text-zinc-600 dark:text-zinc-400'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

