'use client';

import { useMemo } from 'react';

/**
 * Enrichment-style percentile radar with green zone backgrounds.
 *
 * Visual style:
 * - Circular green-zone backgrounds (Top 10% dark outer, Above Avg, Average, Below Avg innermost)
 * - Blue polygon for the player's percentile stats
 * - Optional comparison polygon (dashed, different color)
 * - Metric labels around the outside with raw values in color-coded text
 * - Legend: Top 10%, Above Avg, Average, Below Avg
 */

// ─── Zone colors ────────────────────────────────────────────────────────────

function percentileDotColor(p: number): string {
  if (p >= 90) return '#22c55e';     // green – Top 10%
  if (p >= 65) return '#4ade80';     // light green – Above Avg
  if (p >= 35) return '#94a3b8';     // slate – Average
  return '#ef4444';                   // red – Below Avg
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface PercentileRadarProps {
  labels: string[];
  /** Percentile values 0-100 (used for polygon shape) */
  values: number[];
  /** Raw metric values for label display */
  displayValues?: number[];
  /** Percentiles for coloring dots/values (defaults to values) */
  percentiles?: number[];
  /** Optional comparison overlay values (percentiles) */
  comparisonValues?: number[];
  comparisonColor?: string;
  title?: string;
  size?: number;
}

export function PercentileRadar({
  labels,
  values,
  displayValues,
  percentiles,
  comparisonValues,
  comparisonColor = '#ef4444',
  title,
  size = 420,
}: PercentileRadarProps) {
  const n = labels.length;
  if (n < 3) return null;

  const viewBoxSize = size + 180;
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;
  const chartRadius = size / 2 - 20;

  const angles = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => -Math.PI / 2 + (2 * Math.PI * i) / n),
    [n],
  );

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  // Build polygon points from percentile values
  const buildPolygonPoints = (vals: number[]) =>
    vals
      .map((v, i) => {
        const r = (Math.min(Math.max(v, 0), 100) / 100) * chartRadius;
        const { x, y } = toXY(angles[i], r);
        return `${x},${y}`;
      })
      .join(' ');

  const buildDataPoints = (vals: number[]) =>
    vals.map((v, i) => {
      const r = (Math.min(Math.max(v, 0), 100) / 100) * chartRadius;
      return toXY(angles[i], r);
    });

  const dataPolygon = buildPolygonPoints(values);
  const dataPoints = buildDataPoints(values);

  const compPolygon = comparisonValues ? buildPolygonPoints(comparisonValues) : null;
  const compPoints = comparisonValues ? buildDataPoints(comparisonValues) : null;

  // ── Zone definitions (drawn as concentric filled circles) ──
  // Outermost = Top 10% (90-100), then Above Avg (65-90), Average (35-65), Below Avg (0-35)
  const zones = [
    { maxPct: 100, color: '#166534', opacity: 0.25 },  // Top 10% — dark green
    { maxPct: 90,  color: '#15803d', opacity: 0.20 },  // Above avg — medium green
    { maxPct: 65,  color: '#1e3a2f', opacity: 0.18 },  // Average — dark muted green
    { maxPct: 35,  color: '#18181b', opacity: 0.40 },  // Below avg — dark (zinc-900)
  ];

  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center w-full">
      {title && (
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          {title}
        </h4>
      )}
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full"
        style={{ maxWidth: `${viewBoxSize}px` }}
      >
        {/* ── Green zone background rings ── */}
        {zones.map((zone, zi) => {
          const r = (zone.maxPct / 100) * chartRadius;
          return (
            <circle
              key={`zone-${zi}`}
              cx={cx}
              cy={cy}
              r={r}
              fill={zone.color}
              opacity={zone.opacity}
            />
          );
        })}

        {/* ── Concentric grid lines ── */}
        {gridLevels.map((level) => {
          const r = (level / 100) * chartRadius;
          return (
            <circle
              key={`grid-${level}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#4ade80"
              strokeWidth={level === 100 ? 1.5 : 0.6}
              opacity={0.15}
            />
          );
        })}

        {/* ── Spoke lines ── */}
        {angles.map((a, i) => {
          const { x, y } = toXY(a, chartRadius);
          return (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#4ade80"
              strokeWidth={0.5}
              opacity={0.12}
            />
          );
        })}

        {/* ── Grid ring labels ── */}
        {gridLevels.map((level) => {
          const r = (level / 100) * chartRadius;
          const { x, y } = toXY(angles[0], r);
          return (
            <text
              key={`label-${level}`}
              x={x + 8}
              y={y + 1}
              textAnchor="start"
              dominantBaseline="central"
              fill="#6ee7b7"
              fontSize={8}
              opacity={0.4}
              fontFamily="system-ui, sans-serif"
            >
              {level}
            </text>
          );
        })}

        {/* ── Comparison polygon (dashed) ── */}
        {compPolygon && (
          <>
            <polygon
              points={compPolygon}
              fill={comparisonColor}
              fillOpacity={0.08}
              stroke={comparisonColor}
              strokeWidth={1.5}
              strokeDasharray="6,3"
              strokeLinejoin="round"
            />
            {compPoints!.map((p, i) => (
              <circle
                key={`comp-dot-${i}`}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={comparisonColor}
                opacity={0.6}
              />
            ))}
          </>
        )}

        {/* ── Player data polygon ── */}
        <polygon
          points={dataPolygon}
          fill="#3b82f6"
          fillOpacity={0.22}
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* ── Data point dots (colored by zone) ── */}
        {dataPoints.map((p, i) => {
          const pctVal = percentiles ? percentiles[i] : values[i];
          const dotColor = percentileDotColor(pctVal);
          return (
            <g key={`dot-${i}`}>
              <circle cx={p.x} cy={p.y} r={6} fill={dotColor} opacity={0.2} />
              <circle cx={p.x} cy={p.y} r={3.5} fill={dotColor} />
            </g>
          );
        })}

        {/* ── External labels (metric name + raw value) ── */}
        {angles.map((a, i) => {
          const labelR = chartRadius + 28;
          const { x, y } = toXY(a, labelR);

          let anchor: 'start' | 'middle' | 'end' = 'middle';
          const cosA = Math.cos(a);
          if (cosA > 0.25) anchor = 'start';
          else if (cosA < -0.25) anchor = 'end';

          const sinA = Math.sin(a);
          const yOffset = sinA < -0.7 ? -6 : sinA > 0.7 ? 8 : 0;

          const dv = displayValues ? displayValues[i] : values[i];
          const displayStr =
            dv !== undefined && dv !== null
              ? Number.isInteger(dv)
                ? dv.toString()
                : dv.toFixed(1)
              : '—';

          const pctVal = percentiles ? percentiles[i] : values[i];
          const valueColor = percentileDotColor(pctVal);

          return (
            <g key={`label-${i}`}>
              <text
                x={x}
                y={y + yOffset}
                textAnchor={anchor}
                dominantBaseline="central"
                fill="#d4d4d8"
                fontSize={10}
                fontWeight={500}
                fontFamily="system-ui, sans-serif"
              >
                {labels[i]}
              </text>
              <text
                x={x}
                y={y + yOffset + 14}
                textAnchor={anchor}
                dominantBaseline="central"
                fill={valueColor}
                fontSize={11}
                fontWeight={700}
                fontFamily="system-ui, sans-serif"
              >
                {displayStr}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Legend ── */}
      <div className="flex flex-wrap justify-center gap-3 mt-2 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Top 10%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70 inline-block" /> Above Avg
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400/50 inline-block" /> Average
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Below Avg
        </span>
      </div>
    </div>
  );
}
