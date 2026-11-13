import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, Fuel, Layers, MapPin, Search, X } from 'lucide-react';
import { allSpbus, clustersRanking, kabKotaQuotas, tbbmHubs } from '../../data';
import type { MapSelection, NavTabId } from '../../types/muara';
import { cn } from '../../utils/cn';
import { formatKL } from '../../utils/format';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectEntity: (selection: MapSelection, targetTab?: NavTabId) => void;
}

type SearchCategory = 'all' | 'kabkota' | 'cluster' | 'tbbm' | 'spbu';

const QUICK_CHIPS = ['Surabaya', 'Jember', 'Pacitan', 'Banyuwangi', 'TBBM'];

export function CommandPalette({ open, onClose, onSelectEntity }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');

  useEffect(() => {
    if (!open) {
      setQuery('');
      setCategory('all');
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchedKabKota =
      category === 'all' || category === 'kabkota'
        ? kabKotaQuotas
            .filter(
              (k) =>
                !q ||
                `${k.kabkota_name} ${k.primary_tbbm_name} ${k.bps_code}`.toLowerCase().includes(q)
            )
            .slice(0, category === 'kabkota' ? 12 : 4)
        : [];

    const matchedTbbms =
      category === 'all' || category === 'tbbm'
        ? tbbmHubs
            .filter(
              (t) =>
                !q || `${t.tbbm_id} ${t.name} ${t.region_corridor}`.toLowerCase().includes(q)
            )
            .slice(0, category === 'tbbm' ? 7 : 4)
        : [];

    const matchedClusters =
      category === 'all' || category === 'cluster'
        ? clustersRanking
            .filter(
              (c) =>
                !q ||
                `${c.cluster_id} ${c.cluster_name} ${c.primary_tbbm_name} ${c.Priority_Tier}`
                  .toLowerCase()
                  .includes(q)
            )
            .slice(0, category === 'cluster' ? 12 : 5)
        : [];

    const matchedSpbus =
      category === 'all' || category === 'spbu'
        ? allSpbus
            .filter((s) =>
              !q ? s.iso : `${s.id} ${s.name} ${s.kab} ${s.cl}`.toLowerCase().includes(q)
            )
            .slice(0, category === 'spbu' ? 14 : 6)
        : [];

    return { matchedKabKota, matchedTbbms, matchedClusters, matchedSpbus };
  }, [query, category]);

  const totalResults =
    results.matchedKabKota.length +
    results.matchedTbbms.length +
    results.matchedClusters.length +
    results.matchedSpbus.length;

  if (!open) return null;

  const choose = (selection: MapSelection) => {
    onSelectEntity(selection, 'overview');
    onClose();
    setTimeout(() => {
      document.getElementById('peta-utama')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-start justify-center pt-[8vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-hairline)]">
          <Search className="w-4 h-4 text-[var(--accent-blue)] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama kota, kabupaten, terminal TBBM, atau kode SPBU (mis. Malang, Jember, TBBM_01)..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[11px] font-sub text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1.5"
            >
              Hapus
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Tutup pencarian"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Tabs + Quick Examples */}
        <div className="px-4 py-2.5 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all' as const, label: 'Semua' },
              { id: 'kabkota' as const, label: '38 Kab/Kota' },
              { id: 'cluster' as const, label: '38 Kluster' },
              { id: 'tbbm' as const, label: '7 TBBM' },
              { id: 'spbu' as const, label: '920 SPBU' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-sub font-semibold transition-colors',
                  category === cat.id
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-sub text-[var(--text-muted)]">Coba:</span>
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setQuery(chip)}
                className="px-2 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[10px] font-sub text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[390px] overflow-y-auto p-3 space-y-4">
          {totalResults === 0 && (
            <div className="py-10 text-center space-y-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Tidak ada lokasi cocok dengan &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Coba ketik nama kabupaten/kota (mis. &ldquo;Kediri&rdquo;), kode kluster (&ldquo;CL_36&rdquo;), atau &ldquo;Isolated&rdquo;.
              </p>
            </div>
          )}

          {results.matchedKabKota.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-sub font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Wilayah Kabupaten / Kota (Kuota Tahunan BPH Migas)
              </div>
              {results.matchedKabKota.map((k) => (
                <button
                  key={k.bps_code}
                  onClick={() => choose({ type: 'kabkota', data: k })}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-md text-left hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {k.kabkota_name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        {k.spbu_count} SPBU · Pemasok Utama: {k.primary_tbbm_name}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono-num text-[var(--text-secondary)] shrink-0">
                    {formatKL(k.total_kuota_bbm_subsidi_kl_yr)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.matchedTbbms.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-sub font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Terminal Depot BBM (TBBM)
              </div>
              {results.matchedTbbms.map((t) => (
                <button
                  key={t.tbbm_id}
                  onClick={() => choose({ type: 'tbbm', data: t })}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-md text-left hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {t.tbbm_id} · {t.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        {t.region_corridor}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono-num text-[var(--text-secondary)] shrink-0">
                    {t.fleet_count} mobil tangki
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.matchedClusters.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-sub font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Kluster Penyangga Prioritas
              </div>
              {results.matchedClusters.map((c) => (
                <button
                  key={c.cluster_id}
                  onClick={() => choose({ type: 'cluster', data: c })}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-md text-left hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Layers className="w-3.5 h-3.5 text-[var(--accent-green)] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        <span className="font-mono-num mr-1.5 text-[var(--accent-blue)]">
                          {c.cluster_id}
                        </span>
                        {c.cluster_name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        {c.spbu_count} SPBU · Rata-rata tangki bertahan {c.mean_ttd_hr.toFixed(1)} jam
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono-num font-bold text-[var(--text-primary)] shrink-0">
                    Skor {c.MUARA_Score.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.matchedSpbus.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-sub font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {query.trim()
                  ? 'Stasiun Pengisian Bahan Bakar Umum (SPBU)'
                  : 'SPBU Terpencil Tanpa Tetangga Terdekat (Safety Buffer +20%)'}
              </div>
              {results.matchedSpbus.map((s) => (
                <button
                  key={s.id}
                  onClick={() => choose({ type: 'spbu', data: s })}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-md text-left hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {s.iso ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-red)] shrink-0" />
                    ) : (
                      <Fuel className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        <span className="font-mono-num mr-1.5">{s.id}</span>
                        {s.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        {s.kab} · {s.iso ? 'SPBU Terpencil (+20% Buffer Aman)' : `Kluster ${s.cl}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono-num text-[var(--text-secondary)] shrink-0">
                    {s.cap} KL
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[11px] font-sub text-[var(--text-muted)] flex items-center justify-between">
          <span>Klik hasil mana saja untuk langsung menyorot lokasi di Peta Jawa Timur.</span>
          <span className="hidden sm:inline font-mono-num">Esc untuk menutup</span>
        </div>
      </div>
    </div>
  );
}
