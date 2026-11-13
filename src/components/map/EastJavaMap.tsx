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
    <div className="flex flex-col border-t border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-lg overflow-hidden">
      {/* Map Header Controls */}
      <div className="px-4 py-3 border-b border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#004c97] dark:text-[#2d8cff]" />
          <span className="text-xs font-sub font-semibold text-zinc-900 dark:text-zinc-100">
            Peta Topologi Spasial Jawa Timur (WGS84 · Matriks OSRM 920×920)
          </span>
          {hoverLabel && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-sub text-zinc-700 dark:text-zinc-300">
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
                'px-2.5 py-1 rounded-full text-[11px] font-sub font-medium border transition-colors',
                layers[item.key]
                  ? 'bg-[#004c97]/10 text-[#004c97] border-[#004c97]/30 dark:bg-[#2d8cff]/15 dark:text-[#2d8cff] dark:border-[#2d8cff]/35'
                  : 'bg-transparent text-zinc-500 border-[var(--border-hairline)]'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div
        className="relative bg-[#efece4]/55 dark:bg-[#0b0d10] overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => setDragging({ x: e.clientX - pan.x, y: e.clientY - pan.y })}
        onMouseMove={(e) => {
          if (dragging) {
            setPan({ x: e.clientX - dragging.x, y: e.clientY - dragging.y });
          }
        }}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[380px] sm:h-[440px] block">
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
                      ? 'fill-[#004c97]/20 dark:fill-[#2d8cff]/20 stroke-[#004c97] dark:stroke-[#2d8cff]'
                      : 'fill-white dark:fill-[#141920] stroke-[#d6d2c7] dark:stroke-[#232933] hover:fill-[#f7f6f2] dark:hover:fill-[#1c232d]'
                  )}
                />
              );
            })}

            {/* Animated CVRPTW Multi-Drop Supply Arcs */}
            {layers.routes &&
              routeArcs.map((arc) =>
                arc ? (
                  <g key={arc.id}>
                    <path
                      d={arc.d}
                      fill="none"
                      stroke="#2d8cff"
                      strokeOpacity={0.22}
                      strokeWidth={1.5 / Math.sqrt(zoom)}
                    />
                    <path
                      d={arc.d}
                      fill="none"
                      stroke="#2d8cff"
                      strokeOpacity={0.78}
                      strokeWidth={1.4 / Math.sqrt(zoom)}
                      strokeDasharray="6 6"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="24"
                        to="0"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
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
                    ? '#e11d48'
                    : tier === 2
                    ? '#d97706'
                    : isEligible
                    ? '#2d8cff'
                    : '#16a34a';

                return (
                  <circle
                    key={s.id}
                    cx={pt[0]}
                    cy={pt[1]}
                    r={(isSelected ? 5.5 : 2.15) / Math.sqrt(zoom)}
                    fill={fill}
                    fillOpacity={isSelected ? 1 : 0.78}
                    stroke={isSelected ? '#ffffff' : 'none'}
                    strokeWidth={1.3 / Math.sqrt(zoom)}
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

            {/* 38 Cluster Centroid Rings with Pulse on Tier 1 */}
            {layers.clusters &&
              clustersRanking.map((c) => {
                const pt = projection([c.centroid_lon, c.centroid_lat]);
                if (!pt) return null;
                const isTier1 = c.Priority_Tier.startsWith('Tier 1');
                const isSelected =
                  selection?.type === 'cluster' && selection.data.cluster_id === c.cluster_id;
                const baseR = (isSelected ? 14 : isTier1 ? 10 : 6.5) / Math.sqrt(zoom);
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
                    {isTier1 && (
                      <circle
                        r={baseR}
                        fill="none"
                        stroke="#e11d48"
                        strokeWidth={1.2 / Math.sqrt(zoom)}
                        strokeOpacity={0.55}
                      >
                        <animate
                          attributeName="r"
                          from={String(baseR)}
                          to={String(baseR * 1.9)}
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-opacity"
                          from="0.55"
                          to="0"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    <circle
                      r={baseR}
                      fill={isTier1 ? 'rgba(225, 29, 72, 0.14)' : 'rgba(45, 140, 255, 0.08)'}
                      stroke={isSelected ? '#ffffff' : isTier1 ? '#e11d48' : '#2d8cff'}
                      strokeWidth={(isSelected ? 1.9 : 1) / Math.sqrt(zoom)}
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
                        points={`0,${-5 / Math.sqrt(zoom)} ${4.4 / Math.sqrt(zoom)},${3.6 / Math.sqrt(zoom)} ${-4.4 / Math.sqrt(zoom)},${3.6 / Math.sqrt(zoom)}`}
                        fill="#c81e1e"
                        stroke={isSelected ? '#ffffff' : '#0b0d10'}
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
                      fill="#004c97"
                      stroke="#ffffff"
                      strokeWidth={1.4 / Math.sqrt(zoom)}
                    />
                    <text
                      y={-sz - 4 / Math.sqrt(zoom)}
                      textAnchor="middle"
                      fontSize={9 / Math.sqrt(zoom)}
                      className="fill-zinc-900 dark:fill-zinc-100 font-sub font-bold pointer-events-none"
                    >
                      {t.tbbm_id}
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-[#12161c]/95 border border-[var(--border-hairline)] rounded-full p-1 shadow-sm">
          <button
            onClick={() => setZoom((z) => Math.min(4, Number((z + 0.4).toFixed(1))))}
            aria-label="Perbesar peta"
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(1, Number((z - 0.4).toFixed(1))))}
            aria-label="Perkecil peta"
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            aria-label="Reset tampilan peta"
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 hidden sm:flex flex-wrap items-center gap-3 bg-white/95 dark:bg-[#12161c]/95 border border-[var(--border-hairline)] rounded-full px-3.5 py-1.5 text-[11px] font-sub text-zinc-700 dark:text-zinc-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#004c97] border border-white inline-block" />
            7 TBBM
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#e11d48] inline-block" />
            Tier 1 Kritis
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Tier 2 Peak
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            Resilien
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[#c81e1e] font-bold leading-none">▲</span>
            18 Bottleneck (-1)
          </span>
          <span className="inline-flex items-center gap-1 text-zinc-400">
            <Maximize2 className="w-3 h-3" />
            Klik titik
          </span>
        </div>
      </div>
    </div>
  );
}
