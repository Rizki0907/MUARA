import { useEffect, useState } from 'react';
import { CommandPalette } from './components/layout/CommandPalette';
import { TopNav } from './components/layout/TopNav';
import { BenchmarksView } from './components/views/BenchmarksView';
import { EconomicsEsgView } from './components/views/EconomicsEsgView';
import { OverviewView } from './components/views/OverviewView';
import { RagRoutingView } from './components/views/RagRoutingView';
import { SpatialDominoView } from './components/views/SpatialDominoView';
import { clustersRanking } from './data';
import { useTheme } from './hooks/useTheme';
import type { MapSelection, NavTabId, PeriodRegime } from './types/muara';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [regime, setRegime] = useState<PeriodRegime>('normal');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selection, setSelection] = useState<MapSelection | null>({
    type: 'cluster',
    data: clustersRanking[0],
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectTab = (tab: NavTabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaletteSelect = (sel: MapSelection, tab?: NavTabId) => {
    setSelection(sel);
    if (tab) handleSelectTab(tab);
  };

  const handleInspectOnMap = (sel: MapSelection) => {
    setSelection(sel);
    handleSelectTab('overview');
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <TopNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        regime={regime}
        onChangeRegime={setRegime}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={() => setPaletteOpen(true)}
      />

      <main className="flex-1 w-full">
        {activeTab === 'overview' && (
          <OverviewView
            regime={regime}
            selection={selection}
            onSelect={setSelection}
            onNavigate={handleSelectTab}
          />
        )}
        {activeTab === 'spatial' && (
          <SpatialDominoView onInspectMap={handleInspectOnMap} />
        )}
        {activeTab === 'rag-routing' && <RagRoutingView />}
        {activeTab === 'benchmarks' && <BenchmarksView />}
        {activeTab === 'economics' && <EconomicsEsgView />}
      </main>

      <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-xs text-[var(--text-secondary)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <img
                src={theme === 'dark' ? '/brand/logo-dark.png' : '/brand/logo-light.png'}
                alt="MUARA Wordmark"
                className="h-6 sm:h-7 w-auto object-contain"
              />
              <span className="font-sub text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                Multi-Tier Urban Adaptive Refueling &amp; Allocation
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Tim Sains Data Universitas Negeri Surabaya (Rizki Piji Fathoni, Muhammad Habib Nur
              Aiman, Daffa Ahmad Pangreksa, Faishal Muflih Irfanu Tsaqib) · IKMS 2026 PT Pertamina
              Patra Niaga.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:text-right text-[11px] text-[var(--text-muted)]">
            <span className="font-mono-num">
              Dataset: 38 Kab/Kota · 7 TBBM · 920 SPBU (Seed = 42)
            </span>
            <span className="hidden sm:inline text-[var(--border-strong)]">|</span>
            <span>
              Kredit Foto Lapangan SPBU: Wikimedia Commons (CC BY-SA 3.0 / CC BY-SA 4.0)
            </span>
          </div>
        </div>
      </footer>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectEntity={handlePaletteSelect}
      />
    </div>
  );
}

export default App;
