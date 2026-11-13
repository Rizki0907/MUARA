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
  { id: 'overview', label: 'Ringkasan & Peta' },
  { id: 'spatial', label: 'Simulasi Kelangkaan' },
  { id: 'rag-routing', label: 'Asisten SOP & Rute Truk' },
  { id: 'benchmarks', label: 'Uji Akurasi Model' },
  { id: 'economics', label: 'Dampak Ekonomi & Tim' },
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
    <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/92 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-[76px] flex items-center justify-between gap-4">
        {/* Highlighted Enlarged Brand Wordmark */}
        <button
          onClick={() => onSelectTab('overview')}
          className="flex items-center gap-3.5 shrink-0 focus:outline-none group"
          aria-label="Kembali ke Ringkasan & Peta MUARA"
        >
          <img
            src={theme === 'dark' ? '/brand/logo-dark.png' : '/brand/logo-light.png'}
            alt="Logo Resmi MUARA"
            className="h-10 sm:h-11 lg:h-12 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.03]"
          />
          <span className="hidden 2xl:inline-flex flex-col text-left pl-3.5 border-l border-[var(--border-hairline)] leading-tight">
            <span className="text-[10px] font-sub uppercase tracking-[0.14em] text-[var(--accent-blue)] font-semibold">
              IKMS 2026
            </span>
            <span className="text-[11px] font-sub text-[var(--text-muted)]">
              Patra Niaga Jatim
            </span>
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
                  'relative px-3 py-2 text-[13px] font-sub font-semibold transition-colors duration-150 whitespace-nowrap',
                  active
                    ? 'text-[var(--accent-blue)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="top-nav-underline"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute left-3 right-3 -bottom-[22px] h-[2.5px] bg-[var(--accent-blue)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Plain-language search bar trigger */}
          <button
            onClick={onOpenCommandPalette}
            aria-label="Cari SPBU, Kota, Kluster, atau TBBM"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs font-sub text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" />
            <span className="hidden sm:inline">Cari SPBU, Kota, Kluster...</span>
            <span className="sm:hidden">Cari</span>
          </button>

          {/* Demand Condition Switcher */}
          <div
            className="hidden md:flex items-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] p-0.5 text-[11px] font-sub"
            role="group"
            aria-label="Simulasi Kondisi Permintaan"
            title="Pilih kondisi beban konsumsi BBM harian atau puncak mudik/libur"
          >
            <button
              onClick={() => onChangeRegime('normal')}
              className={cn(
                'px-2.5 py-1.5 rounded font-semibold transition-colors',
                regime === 'normal'
                  ? 'bg-[var(--accent-blue)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              Hari Normal
            </button>
            <button
              onClick={() => onChangeRegime('peak')}
              className={cn(
                'px-2.5 py-1.5 rounded font-semibold transition-colors',
                regime === 'peak'
                  ? 'bg-[var(--accent-red)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              Peak Mudik
            </button>
          </div>

          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition-colors active:scale-95"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu navigasi mobile"
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-hairline)]">
            <span className="text-[11px] font-sub text-[var(--text-muted)]">Kondisi Beban:</span>
            <button
              onClick={() => onChangeRegime('normal')}
              className={cn(
                'px-2.5 py-1 rounded text-[11px] font-sub font-semibold',
                regime === 'normal'
                  ? 'bg-[var(--accent-blue)] text-white'
                  : 'border border-[var(--border-strong)] text-[var(--text-secondary)]'
              )}
            >
              Hari Normal
            </button>
            <button
              onClick={() => onChangeRegime('peak')}
              className={cn(
                'px-2.5 py-1 rounded text-[11px] font-sub font-semibold',
                regime === 'peak'
                  ? 'bg-[var(--accent-red)] text-white'
                  : 'border border-[var(--border-strong)] text-[var(--text-secondary)]'
              )}
            >
              Peak Mudik
            </button>
          </div>
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
                  'w-full text-left px-3 py-2 rounded-md text-sm font-sub font-semibold transition-colors',
                  active
                    ? 'bg-[var(--bg-subtle)] text-[var(--accent-blue)]'
                    : 'text-[var(--text-secondary)]'
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
