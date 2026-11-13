import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { Layers, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import {
  allSpbus,
  clustersRanking,
  cvrptwRoutes,
  jatimPolygons,
  kabKotaQuotas,
  tbbmHubs,
} from '../../data';
import type { MapSelection, PeriodRegime } from '../../types/muara';
import { cn } from '../../utils/cn';

interface EastJavaMapProps {
  regime: PeriodRegime;
  selection: MapSelection | null;
  onSelect: (sel: MapSelection) => void;
}

const WIDTH = 920;
const HEIGHT = 480;

export function EastJavaMap({ regime, selection, onSelect }: EastJavaMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ x: number; y: number } | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  const [layers, setLayers] = useState({
    spbus: true,
    bottlenecks: true,
    clusters: true,
    routes: true,
    tbbms: true,
  });

  const { projection, pathGen } = useMemo(() => {
    const proj = geoMercator().fitExtent(
      [
        [24, 20],
        [WIDTH - 24, HEIGHT - 20],
      ],
      jatimPolygons
    );
    return { projection: proj, pathGen: geoPath().projection(proj) };
  }, []);

  const clusterTierMap = useMemo(() => {
    const m = new Map<string, number>();
    clustersRanking.forEach((c) => {
      const tierNum = c.Priority_Tier.startsWith('Tier 1')
        ? 1
        : c.Priority_Tier.startsWith('Tier 2')
        ? 2
        : c.Priority_Tier.startsWith('Tier 3')
        ? 3
        : 4;
      m.set(c.cluster_id, tierNum);
    });
    return m;
  }, []);

  const routeArcs = useMemo(() => {
    const tbbmMap = new Map(tbbmHubs.map((t) => [t.tbbm_id, t]));
    const clMap = new Map(clustersRanking.map((c) => [c.cluster_id, c]));
    return cvrptwRoutes.slice(0, 18).map((r) => {
      const orig = tbbmMap.get(r.tbbm_origin);
      const dest = clMap.get(r.target_cluster_id);
      if (!orig || !dest) return null;
      const p1 = projection([orig.lon, orig.lat]);
      const p2 = projection([dest.centroid_lon, dest.centroid_lat]);
      if (!p1 || !p2) return null;
      const mx = (p1[0] + p2[0]) / 2;
      const my = (p1[1] + p2[1]) / 2 - Math.abs(p1[0] - p2[0]) * 0.14;
      return {
        id: r.route_id,
        d: `M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`,
        clusterId: r.target_cluster_id,
      };
    });
  }, [projection]);

  const quotaByBps = useMemo(() => {
    return new Map(kabKotaQuotas.map((q) => [String(q.bps_code), q]));
  }, []);

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      {/* Map Header Controls */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Peta Topologi Spasial Jawa Timur (WGS84 · OSRM)
          </span>
          {hoverLabel && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono-num text-zinc-700 dark:text-zinc-300">
              {hoverLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'spbus' as const, label: '920 SPBU' },
            { key: 'bottlenecks' as const, label: '18 Bottleneck' },
            { key: 'clusters' as const, label: '38 Kluster' },
            { key: 'routes' as const, label: 'Rute CVRPTW' },
            { key: 'tbbms' as const, label: '7 TBBM' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setLayers((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-medium border transition-colors',
                layers[item.key]
                  ? 'bg-blue-600/10 text-blue-700 border-blue-600/25 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div
        className="relative bg-zinc-50 dark:bg-[#09090b] overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => setDragging({ x: e.clientX - pan.x, y: e.clientY - pan.y })}
        onMouseMove={(e) => {
          if (dragging) {
            setPan({ x: e.clientX - dragging.x, y: e.clientY - dragging.y });
          }
        }}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[360px] sm:h-[420px] block">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: 'center' }}>
            {/* 38 Kab/Kota Polygons */}
            {jatimPolygons.features.map((feat, idx) => {
              const props = feat.properties as {
                bps_code: string;
                kabkota_name: string;
                primary_tbbm_id: string;
              };
              const d = pathGen(feat) || '';
              const isSelected =
                selection?.type === 'kabkota' &&
                String(selection.data.bps_code) === String(props.bps_code);
              return (
                <path
                  key={`${props.bps_code}-${idx}`}
                  d={d}
                  onClick={() => {
                    const q = quotaByBps.get(String(props.bps_code));
                    if (q) onSelect({ type: 'kabkota', data: q });
                  }}
                  onMouseEnter={() => setHoverLabel(`${props.kabkota_name} (${props.primary_tbbm_id})`)}
                  onMouseLeave={() => setHoverLabel(null)}
                  className={cn(
                    'transition-colors duration-150 cursor-pointer stroke-[0.8]',
                    isSelected
                      ? 'fill-blue-500/20 stroke-blue-500'
                      : 'fill-white dark:fill-[#141418] stroke-zinc-300 dark:stroke-zinc-800 hover:fill-zinc-100 dark:hover:fill-zinc-800/80'
                  )}
                />
              );
            })}

            {/* CVRPTW Multi-Drop Supply Arcs */}
            {layers.routes &&
              routeArcs.map((arc) =>
                arc ? (
                  <path
                    key={arc.id}
                    d={arc.d}
                    fill="none"
                    stroke="#2589f5"
                    strokeOpacity={0.45}
                    strokeWidth={1.35 / Math.sqrt(zoom)}
                    strokeDasharray="4 3"
                  />
                ) : null
              )}

            {/* 920 SPBU Points */}
            {layers.spbus &&
              allSpbus.map((s) => {
                if (s.iso) return null;
                const pt = projection([s.lon, s.lat]);
                if (!pt) return null;
                const tier = clusterTierMap.get(s.cl) ?? 4;
                const isEligible = regime === 'peak' ? s.p2 === 1 : s.p1 === 1;
                const isSelected = selection?.type === 'spbu' && selection.data.id === s.id;
                const fill =
                  tier === 1
                    ? '#ef4444'
                    : tier === 2
                    ? '#f59e0b'
                    : isEligible
                    ? '#3b82f6'
                    : '#10b981';

                return (
                  <circle
                    key={s.id}
                    cx={pt[0]}
                    cy={pt[1]}
                    r={(isSelected ? 5.2 : 2.1) / Math.sqrt(zoom)}
                    fill={fill}
                    fillOpacity={isSelected ? 1 : 0.72}
                    stroke={isSelected ? '#ffffff' : 'none'}
                    strokeWidth={1.2 / Math.sqrt(zoom)}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({ type: 'spbu', data: s });
                    }}
                    onMouseEnter={() => setHoverLabel(`${s.id} · ${s.kab} (${s.cl})`)}
                    onMouseLeave={() => setHoverLabel(null)}
                  />
                );
              })}

            {/* 38 Cluster Centroid Rings */}
            {layers.clusters &&
              clustersRanking.map((c) => {
                const pt = projection([c.centroid_lon, c.centroid_lat]);
                if (!pt) return null;
                const isTier1 = c.Priority_Tier.startsWith('Tier 1');
                const isSelected =
                  selection?.type === 'cluster' && selection.data.cluster_id === c.cluster_id;
                return (
                  <g
                    key={c.cluster_id}
                    transform={`translate(${pt[0]}, ${pt[1]})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({ type: 'cluster', data: c });
                    }}
                    onMouseEnter={() =>
                      setHoverLabel(`${c.cluster_id} · ${c.cluster_name} (Score ${c.MUARA_Score})`)
                    }
                    onMouseLeave={() => setHoverLabel(null)}
                  >
                    <circle
                      r={(isSelected ? 14 : isTier1 ? 10 : 6.5) / Math.sqrt(zoom)}
                      fill={isTier1 ? 'rgba(239, 68, 68, 0.14)' : 'rgba(37, 137, 245, 0.08)'}
                      stroke={isSelected ? '#fafafa' : isTier1 ? '#ef4444' : '#3b82f6'}
                      strokeWidth={(isSelected ? 1.8 : 1) / Math.sqrt(zoom)}
                    />
                  </g>
                );
              })}

            {/* 18 Isolated Bottleneck SPBUs (Label = -1) */}
            {layers.bottlenecks &&
              allSpbus
                .filter((s) => s.iso)
                .map((s) => {
                  const pt = projection([s.lon, s.lat]);
                  if (!pt) return null;
                  const isSelected = selection?.type === 'spbu' && selection.data.id === s.id;
                  return (
                    <g
                      key={s.id}
                      transform={`translate(${pt[0]}, ${pt[1]})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect({ type: 'spbu', data: s });
                      }}
                      onMouseEnter={() =>
                        setHoverLabel(`ISOLATED BOTTLENECK: ${s.id} · ${s.kab} (+20% Buffer)`)
                      }
                      onMouseLeave={() => setHoverLabel(null)}
                    >
                      <polygon
                        points={`0,${-4.8 / Math.sqrt(zoom)} ${4.2 / Math.sqrt(zoom)},${3.4 / Math.sqrt(zoom)} ${-4.2 / Math.sqrt(zoom)},${3.4 / Math.sqrt(zoom)}`}
                        fill="#ef4444"
                        stroke={isSelected ? '#ffffff' : '#09090b'}
                        strokeWidth={1 / Math.sqrt(zoom)}
                      />
                    </g>
                  );
                })}

            {/* 7 TBBM Terminal Hubs */}
            {layers.tbbms &&
              tbbmHubs.map((t) => {
                const pt = projection([t.lon, t.lat]);
                if (!pt) return null;
                const isSelected = selection?.type === 'tbbm' && selection.data.tbbm_id === t.tbbm_id;
                const sz = (isSelected ? 7.5 : 5.5) / Math.sqrt(zoom);
                return (
                  <g
                    key={t.tbbm_id}
                    transform={`translate(${pt[0]}, ${pt[1]})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({ type: 'tbbm', data: t });
                    }}
                    onMouseEnter={() => setHoverLabel(`${t.tbbm_id} · ${t.name} (${t.fleet_count} truk)`)}
                    onMouseLeave={() => setHoverLabel(null)}
                  >
                    <rect
                      x={-sz}
                      y={-sz}
                      width={sz * 2}
                      height={sz * 2}
                      rx={2 / Math.sqrt(zoom)}
                      fill="#0057b8"
                      stroke="#ffffff"
                      strokeWidth={1.4 / Math.sqrt(zoom)}
                    />
                    <text
                      y={-sz - 4 / Math.sqrt(zoom)}
                      textAnchor="middle"
                      fontSize={9 / Math.sqrt(zoom)}
                      className="fill-zinc-900 dark:fill-zinc-100 font-mono-num font-bold pointer-events-none"
                    >
                      {t.tbbm_id}
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setZoom((z) => Math.min(4, Number((z + 0.4).toFixed(1))))}
            aria-label="Perbesar peta"
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(1, Number((z - 0.4).toFixed(1))))}
            aria-label="Perkecil peta"
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            aria-label="Reset tampilan peta"
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 hidden sm:flex flex-wrap items-center gap-3 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0057b8] border border-white inline-block" />
            7 TBBM
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Tier 1 Kritis
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Tier 2 Peak
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Resilien
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-red-500 font-bold leading-none">▲</span>
            18 Isolated Bottleneck (-1)
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-400">
            <Maximize2 className="w-3 h-3" />
            Klik titik untuk inspeksi
          </span>
        </div>
      </div>
    </div>
  );
}

