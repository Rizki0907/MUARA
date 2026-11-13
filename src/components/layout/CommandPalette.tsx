import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, Fuel, Layers, Search, X } from 'lucide-react';
import { allSpbus, clustersRanking, tbbmHubs } from '../../data';
import type { MapSelection, NavTabId } from '../../types/muara';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectEntity: (selection: MapSelection, targetTab?: NavTabId) => void;
}

export function CommandPalette({ open, onClose, onSelectEntity }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchedTbbms = tbbmHubs
      .filter((t) => !q || `${t.tbbm_id} ${t.name} ${t.region_corridor}`.toLowerCase().includes(q))
      .slice(0, 4);
    const matchedClusters = clustersRanking
      .filter((c) => !q || `${c.cluster_id} ${c.cluster_name} ${c.Priority_Tier}`.toLowerCase().includes(q))
      .slice(0, 6);
    const matchedSpbus = allSpbus
      .filter((s) => !q ? s.iso : `${s.id} ${s.name} ${s.kab} ${s.cl}`.toLowerCase().includes(q))
      .slice(0, 8);
    return { matchedTbbms, matchedClusters, matchedSpbus };
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari 920 SPBU, 38 Kluster HDBSCAN (mis. CL_36), atau 7 TBBM..."
            className="w-full bg-transparent text-sm text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Tutup pencarian"
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
          {results.matchedTbbms.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Terminal BBM (TBBM)
              </div>
              {results.matchedTbbms.map((t) => (
                <button
                  key={t.tbbm_id}
                  onClick={() => {
                    onSelectEntity({ type: 'tbbm', data: t }, 'overview');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">{t.region_corridor}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono-num text-zinc-500">{t.fleet_count} truk</span>
                </button>
              ))}
            </div>
          )}

          {results.matchedClusters.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Kluster Penyangga HDBSCAN
              </div>
              {results.matchedClusters.map((c) => (
                <button
                  key={c.cluster_id}
                  onClick={() => {
                    onSelectEntity({ type: 'cluster', data: c }, 'overview');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Layers className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        <span className="font-mono-num mr-1.5 text-blue-500">{c.cluster_id}</span>
                        {c.cluster_name}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {c.spbu_count} SPBU · TTD {c.mean_ttd_hr} jam
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono-num font-semibold text-zinc-700 dark:text-zinc-300">
                    Score {c.MUARA_Score.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.matchedSpbus.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {query.trim() ? 'Stasiun Pengisian (SPBU)' : 'Isolated Bottleneck SPBU (Label -1)'}
              </div>
              {results.matchedSpbus.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectEntity({ type: 'spbu', data: s }, 'overview');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {s.iso ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    ) : (
                      <Fuel className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        <span className="font-mono-num mr-1.5">{s.id}</span>
                        {s.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {s.kab} · {s.iso ? 'Isolated Bottleneck (+20% Buffer)' : `Kluster ${s.cl}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono-num text-zinc-500">{s.cap} KL</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Pilih entitas untuk memeriksa telemetri langsung di peta</span>
          <span className="font-mono-num">ESC untuk tutup</span>
        </div>
      </div>
    </div>
  );
}

