import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Compass,
  Leaf,
  MapPin,
  Route,
} from 'lucide-react';
import type { NavTabId } from '../../types/muara';
import type { Theme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  theme: Theme;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavTabId;
  label: string;
  shortDesc: string;
  icon: typeof Activity;
  group: 'command' | 'models';
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Command Overview',
    shortDesc: 'Jatimbalinus 7 TBBM · 920 SPBU',
    icon: MapPin,
    group: 'command',
  },
  {
    id: 'spatial',
    label: 'Spillover & Domino',
    shortDesc: 'HDBSCAN · Huff · TTD',
    icon: Activity,
    group: 'command',
  },
  {
    id: 'rag-routing',
    label: 'RAG Copilot & CVRPTW',
    shortDesc: 'HITL SOP · Multi-Drop',
    icon: Route,
    group: 'command',
  },
  {
    id: 'benchmarks',
    label: 'Benchmark & CRITIC-AHP',
    shortDesc: 'Komparasi Model · Sensitivitas',
    icon: BarChart3,
    group: 'models',
  },
  {
    id: 'economics',
    label: 'Tekno-Ekonomi & ESG',
    shortDesc: 'Ablasi A/B/C · NPV · CO2e',
    icon: Leaf,
    group: 'models',
  },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  theme,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const commandItems = NAV_ITEMS.filter((i) => i.group === 'command');
  const modelItems = NAV_ITEMS.filter((i) => i.group === 'models');

  const renderGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      {!collapsed && (
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onSelectTab(item.id);
              onCloseMobile();
            }}
            title={collapsed ? item.label : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-all duration-150 active:scale-[0.99]',
              collapsed && 'justify-center px-0',
              active
                ? 'bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-600/20 dark:border-blue-500/25'
                : 'text-zinc-600 dark:text-zinc-400 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-zinc-100'
            )}
          >
            <Icon className={cn('w-4 h-4 shrink-0', active && 'text-blue-600 dark:text-blue-400')} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">{item.label}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">
                  {item.shortDesc}
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-[#0c0c0f] border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-150 shrink-0',
          collapsed ? 'w-[68px]' : 'w-[244px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
          <button
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-2.5 min-w-0 focus:outline-none"
            aria-label="Beranda MUARA"
          >
            {collapsed ? (
              <img
                src="./brand/favicon.svg"
                alt="MUARA"
                className="w-8 h-8 rounded-lg shrink-0"
              />
            ) : (
              <img
                src={theme === 'dark' ? './brand/logo-dark.png' : './brand/logo-light.png'}
                alt="MUARA Wordmark"
                className="h-7 w-auto object-contain"
              />
            )}
          </button>

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className="hidden lg:inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
          {renderGroup('Operasional Rantai Pasok', commandItems)}
          {renderGroup('Riset, Validasi & ESG', modelItems)}
        </div>

        {/* Bottom System Context */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          {collapsed ? (
            <div className="flex justify-center" title="Regional Jatimbalinus · IKMS 2026">
              <Compass className="w-4 h-4 text-emerald-500" />
            </div>
          ) : (
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Jatimbalinus Grid
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono-num text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  SYNC
                </span>
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                38 Kab/Kota · 7 TBBM · 920 SPBU
                <br />
                <span className="font-mono-num text-[10px] text-zinc-500">
                  Kuota: 11.340.955,3 KL/thn
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

