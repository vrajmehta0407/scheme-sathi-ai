'use client';

import { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { StateMetric } from '@/lib/analytics';
import { formatINR } from '@/lib/benefits';

interface IndiaCoverageMapProps {
  states: StateMetric[];
  selectedState?: string;
  onSelectState?: (state: string) => void;
}

export function IndiaCoverageMap({
  states,
  selectedState,
  onSelectState,
}: IndiaCoverageMapProps) {
  const [topo, setTopo] = useState<Topology | null>(null);
  const [hovered, setHovered] = useState<StateMetric | null>(null);

  useEffect(() => {
    fetch('/india-topo.json')
      .then((r) => r.json())
      .then((data) => setTopo(data as Topology))
      .catch(() => {});
  }, []);

  const metricMap = useMemo(
    () => new Map(states.map((s) => [s.state, s])),
    [states]
  );

  const paths = useMemo(() => {
    if (!topo) return [];
    const obj = topo.objects.states as GeometryCollection<{ name: string; code: string }>;
    const geo = feature(topo, obj);
    const projection = geoMercator().fitSize([460, 460], geo);
    const pathGen = geoPath().projection(projection);

    return geo.features.map((f) => ({
      name: f.properties?.name ?? '',
      code: f.properties?.code ?? '',
      d: pathGen(f) ?? '',
    }));
  }, [topo]);

  function getFill(name: string): string {
    if (hovered?.state === name || selectedState === name) return '#FFC20E';
    const m = metricMap.get(name);
    if (!m || m.suppressed) return '#EAF3FF';
    const gap = m.coverageGapPct;
    if (gap >= 55) return '#0B57C4';
    if (gap >= 40) return '#1479FF';
    if (gap >= 25) return '#66A7FF';
    return '#D1E5FF';
  }

  return (
    <div className="relative flex flex-col items-center">
      <svg
        viewBox="0 0 460 460"
        className="w-full max-w-[420px] select-none"
        role="img"
        aria-label="India State Eligibility & Document Coverage Gap Map"
      >
        {paths.map((p) => {
          const m = metricMap.get(p.name) ?? null;
          return (
            <path
              key={p.name}
              d={p.d}
              fill={getFill(p.name)}
              stroke="#0A1A3C"
              strokeWidth={selectedState === p.name ? 2 : 0.9}
              className="cursor-pointer transition-colors duration-200"
              onMouseEnter={() => m && setHovered(m)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectState?.(p.name)}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-ink/80">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-[#D1E5FF] border border-blue/30" /> &lt;25% gap
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-[#66A7FF]" /> 25–40%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-[#1479FF]" /> 40–55%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-[#0B57C4]" /> 55%+ gap
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-yellow" /> Active / Hover
        </span>
      </div>

      {/* Tooltip card */}
      {hovered && (
        <div className="glass-yellow mt-3 w-full rounded-chip p-3 text-xs text-ink">
          <div className="flex items-center justify-between font-bold">
            <span>{hovered.state} (Synthetic n={hovered.households})</span>
            <span>{hovered.suppressed ? 'Suppressed (<30)' : `${hovered.coverageGapPct}% Doc Gap`}</span>
          </div>
          {!hovered.suppressed && (
            <div className="mt-1 flex flex-wrap gap-3 font-mono-num">
              <span>Elig. Rate: {hovered.eligibilityRatePct}%</span>
              <span>Unclaimed: {formatINR(hovered.unclaimedBenefitRs)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

