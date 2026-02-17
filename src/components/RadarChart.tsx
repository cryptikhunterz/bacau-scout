'use client';

import { useMemo } from 'react';

// ─── Percentile color zones ────────────────────────────────────────────────

function percentileColor(p: number): string {
  if (p >= 90) return '#22c55e';     // green – elite
  if (p >= 65) return '#86efac';     // light green – above average
  if (p >= 35) return '#a1a1aa';     // gray – average
  return '#ef4444';                  // red – below average
}

function percentileZoneColor(p: number, opacity: number): string {
  if (p >= 90) return `rgba(34,197,94,${opacity})`;
  if (p >= 65) return `rgba(134,239,172,${opacity})`;
  if (p >= 35) return `rgba(161,161,170,${opacity})`;
  return `rgba(239,68,68,${opacity})`;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface OverlayData {
  values: number[];
  color: string;
}

interface RadarChartProps {
  labels: string[];
  values: number[];
  maxValue: number;
  color?: string;
  title?: string;
  size?: number;
  comparisonValues?: number[];
  comparisonColor?: string;
  /** Multiple comparison overlays (for 3+ player compare) */
  overlays?: OverlayData[];
  maxValues?: number[];
  /**
   * Percentile mode: values are treated as 0-100 percentiles.
   * Shows color-coded zones, percentage grid rings, and dot colors by zone.
   */
  mode?: 'raw' | 'percentile';
  /**
   * Raw display values shown in labels (used in percentile mode to show
   * the original metric value while the shape uses percentile).
   */
  displayValues?: number[];
  /**
   * Per-point percentiles for coloring dots/labels in percentile mode.
   * If not provided, values are used directly as percentiles.
   */
  percentiles?: number[];
}

/**
 * SVG radar chart with circular gridlines, filled polygon, dot markers,
 * and external labels. Supports both raw and percentile modes.
 */
export function RadarChart({
  labels,
  values,
  maxValue,
  color = '#22c55e',
  title,
  size = 550,
  comparisonValues,
  comparisonColor = '#3b82f6',
  overlays,
  maxValues,
  mode = 'raw',
  displayValues,
  percentiles,
}: RadarChartProps) {
  const n = labels.length;
  if (n < 3) return null;

  const isPercentile = mode === 'percentile';

  const viewBoxSize = size + 160;
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;
  const chartRadius = size / 2 - 20;

  const angles = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        return -Math.PI / 2 + (2 * Math.PI * i) / n;
      }),
    [n],
  );

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const axisMax = (i: number) => {
    if (isPercentile) return 100;
    return maxValues && maxValues[i] > 0 ? maxValues[i] : maxValue;
  };

  const buildPolygonPoints = (vals: number[]) =>
    vals
      .map((v, i) => {
        const m = axisMax(i);
        const r = (Math.min(v, m) / m) * chartRadius;
        const { x, y } = toXY(angles[i], r);
        return `${x},${y}`;
      })
      .join(' ');

  const buildDataPoints = (vals: number[]) =>
    vals.map((v, i) => {
      const m = axisMax(i);
      const r = (Math.min(v, m) / m) * chartRadius;
      return toXY(angles[i], r);
    });

  const dataPolygon = buildPolygonPoints(values);
  const dataPoints = buildDataPoints(values);

  const comparisonPolygon = comparisonValues ? buildPolygonPoints(comparisonValues) : null;
  const comparisonPoints = comparisonValues ? buildDataPoints(comparisonValues) : null;

  // Grid rings
  const usePerAxisScaling = isPercentile || (!!maxValues && maxValues.length === n);
  const gridLevels = usePerAxisScaling
    ? [0.25, 0.5, 0.75, 1.0]
    : Array.from({ length: maxValue }, (_, i) => i + 1);
  const gridMax = usePerAxisScaling ? 1.0 : maxValue;

  // Percentile zone background wedges (drawn as colored ring segments)
  const zoneRings = isPercentile
    ? [
        { from: 0, to: 0.35, color: 'rgba(239,68,68,0.06)' },     // red zone
        { from: 0.35, to: 0.65, color: 'rgba(161,161,170,0.06)' }, // gray zone
        { from: 0.65, to: 0.90, color: 'rgba(134,239,172,0.06)' }, // light green
        { from: 0.90, to: 1.0, color: 'rgba(34,197,94,0.08)' },    // green zone
      ]
    : [];

  const fillColor = isPercentile ? '#3b82f6' : color;

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
        style={{ maxWidth: '100%' }}
      >
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={chartRadius + 8} fill="#18181b" opacity={0.6} />

        {/* Percentile zone rings */}
        {zoneRings.map((zone, zi) => (
          <circle
            key={`zone-${zi}`}
            cx={cx}
            cy={cy}
            r={((zone.from + zone.to) / 2) * chartRadius}
            fill="none"
            stroke={zone.color}
            strokeWidth={(zone.to - zone.from) * chartRadius * 2}
            opacity={1}
          />
        ))}

        {/* Concentric grid lines */}
        {gridLevels.map((level) => {
          const r = (level / gridMax) * chartRadius;
          return (
            <circle
              key={`grid-${level}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#3f3f46"
              strokeWidth={level === gridMax ? 1.5 : 0.8}
              opacity={0.3}
            />
          );
        })}

        {/* Axis lines */}
        {angles.map((a, i) => {
          const { x, y } = toXY(a, chartRadius);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#52525b"
              strokeWidth={0.8}
              opacity={0.3}
            />
          );
        })}

        {/* Scale labels */}
        {isPercentile && gridLevels.map((level) => {
          const r = (level / gridMax) * chartRadius;
          const { x, y } = toXY(angles[0], r);
          const pctLabel = Math.round(level * 100);
          return (
            <text
              key={`scale-${level}`}
              x={x + 10}
              y={y + 1}
              textAnchor="start"
              dominantBaseline="central"
              fill="#71717a"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
            >
              {pctLabel}
            </text>
          );
        })}

        {!isPercentile && !usePerAxisScaling && gridLevels.map((level) => {
          const r = (level / gridMax) * chartRadius;
          const { x, y } = toXY(angles[0], r);
          return (
            <text
              key={`scale-${level}`}
              x={x + 10}
              y={y + 1}
              textAnchor="start"
              dominantBaseline="central"
              fill="#71717a"
              fontSize={10}
              fontFamily="system-ui, sans-serif"
            >
              {level}
            </text>
          );
        })}

        {/* Comparison polygon (legacy single overlay) */}
        {comparisonPolygon && !overlays && (
          <>
            <polygon
              points={comparisonPolygon}
              fill={comparisonColor}
              fillOpacity={0.1}
              stroke={comparisonColor}
              strokeWidth={1.5}
              strokeDasharray="6,3"
              strokeLinejoin="round"
            />
            {comparisonPoints!.map((p, i) => (
              <circle key={`comp-dot-${i}`} cx={p.x} cy={p.y} r={3} fill={comparisonColor} opacity={0.7} />
            ))}
          </>
        )}

        {/* Multiple overlay polygons (for 3+ player compare) */}
        {overlays && overlays.map((ov, oi) => {
          const ovPolygon = buildPolygonPoints(ov.values);
          const ovPoints = buildDataPoints(ov.values);
          return (
            <g key={`overlay-${oi}`}>
              <polygon
                points={ovPolygon}
                fill={ov.color}
                fillOpacity={0.1}
                stroke={ov.color}
                strokeWidth={1.5}
                strokeDasharray={oi > 0 ? "4,4" : "6,3"}
                strokeLinejoin="round"
              />
              {ovPoints.map((p, i) => (
                <circle key={`ov-${oi}-dot-${i}`} cx={p.x} cy={p.y} r={3} fill={ov.color} opacity={0.7} />
              ))}
            </g>
          );
        })}

        {/* Main data polygon */}
        <polygon
          points={dataPolygon}
          fill={fillColor}
          fillOpacity={0.2}
          stroke={fillColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data point dots — colored by percentile zone in percentile mode */}
        {dataPoints.map((p, i) => {
          const pctVal = percentiles ? percentiles[i] : values[i];
          const dotColor = isPercentile ? percentileColor(pctVal) : color;
          return (
            <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} fill={dotColor} />
          );
        })}

        {/* External labels */}
        {angles.map((a, i) => {
          const labelR = chartRadius + 24;
          const { x, y } = toXY(a, labelR);

          let anchor: 'start' | 'middle' | 'end' = 'middle';
          const cosA = Math.cos(a);
          if (cosA > 0.25) anchor = 'start';
          else if (cosA < -0.25) anchor = 'end';

          const sinA = Math.sin(a);
          const yOffset = sinA < -0.7 ? -6 : sinA > 0.7 ? 8 : 0;

          // In percentile mode, show raw value; in raw mode, show the chart value
          const dv = displayValues ? displayValues[i] : values[i];
          const displayStr = dv !== undefined && dv !== null
            ? (Number.isInteger(dv) ? dv.toString() : dv.toFixed(1))
            : '0';

          const pctVal = percentiles ? percentiles[i] : values[i];
          const valueColor = isPercentile ? percentileColor(pctVal) : color;

          return (
            <g key={`label-${i}`}>
              <text
                x={x}
                y={y + yOffset}
                textAnchor={anchor}
                dominantBaseline="central"
                fill="#d4d4d8"
                fontSize={13}
                fontWeight={500}
                fontFamily="system-ui, sans-serif"
              >
                {labels[i]}
              </text>
              <text
                x={x}
                y={y + yOffset + 16}
                textAnchor={anchor}
                dominantBaseline="central"
                fill={valueColor}
                fontSize={13}
                fontWeight={700}
                fontFamily="system-ui, sans-serif"
              >
                {displayStr}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
