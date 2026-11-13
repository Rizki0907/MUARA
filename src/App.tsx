import { useEffect, useState } from 'react';
import { CommandPalette } from './components/layout/CommandPalette';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const handlePaletteSelect = (sel: MapSelection, tab?: NavTabId) => {
    setSelection(sel);
    if (tab) setActiveTab(tab);
  };

  const handleInspectOnMap = (sel: MapSelection) => {
    setSelection(sel);
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen flex bg-[#fafafa] dark:bg-[#09090b] text-zinc-950 dark:text-zinc-50">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        theme={theme}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeTab={activeTab}
          regime={regime}
          onChangeRegime={setRegime}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCommandPalette={() => setPaletteOpen(true)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              regime={regime}
              selection={selection}
              onSelect={setSelection}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'spatial' && (
            <SpatialDominoView onInspectMap={handleInspectOnMap} />
          )}
          {activeTab === 'rag-routing' && <RagRoutingView />}
          {activeTab === 'benchmarks' && <BenchmarksView />}
          {activeTab === 'economics' && <EconomicsEsgView />}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectEntity={handlePaletteSelect}
      />
    </div>
  );
}

export default App;

