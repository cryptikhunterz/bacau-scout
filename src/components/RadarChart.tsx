'use client';

import { useMemo } from 'react';

interface RadarChartProps {
  labels: string[];
  values: number[];
  maxValue: number;
  color?: string;        // e.g. '#22c55e'
  title?: string;
  size?: number;          // chart diameter in px, default 400
  // Optional second dataset for comparison overlay
  comparisonValues?: number[];
  comparisonColor?: string;
  /**
   * Per-axis max values for independent scaling (e.g. Wyscout per-90 stats).
   * When provided, each axis is scaled by its own max instead of the global maxValue.
   * The raw value is displayed in labels instead of a scaled number.
   */
  maxValues?: number[];
}

/**
 * Wyscout-quality SVG radar chart with circular concentric gridlines,
 * filled data polygon, dot markers, and external labels.
 */
export function RadarChart({
  labels,
  values,
  maxValue,
  color = '#22c55e',
  title,
  size = 400,
  comparisonValues,
  comparisonColor = '#3b82f6',
  maxValues,
}: RadarChartProps) {
  const n = labels.length;
  if (n < 3) return null;

  // Viewbox is larger than chart to accommodate labels outside
  const viewBoxSize = size + 160;
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;
  const chartRadius = size / 2 - 20;

  // Pre-compute angle for each axis (start from top, go clockwise)
  const angles = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        return -Math.PI / 2 + (2 * Math.PI * i) / n;
      }),
    [n],
  );

  /** Convert polar to cartesian */
  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  /** Resolve effective max for axis i */
  const axisMax = (i: number) => (maxValues && maxValues[i] > 0 ? maxValues[i] : maxValue);

  /** Build SVG polygon points string for data values */
  const buildPolygonPoints = (vals: number[]) =>
    vals
      .map((v, i) => {
        const m = axisMax(i);
        const r = (Math.min(v, m) / m) * chartRadius;
        const { x, y } = toXY(angles[i], r);
        return `${x},${y}`;
      })
      .join(' ');

  /** Build data points array for dot markers */
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

  // Grid levels: when using per-axis maxValues, show percentage rings (25%, 50%, 75%, 100%)
  // Otherwise, integer steps (1, 2, ..., maxValue)
  const usePerAxisScaling = !!maxValues && maxValues.length === n;
  const gridLevels = usePerAxisScaling
    ? [0.25, 0.5, 0.75, 1.0]
    : Array.from({ length: maxValue }, (_, i) => i + 1);
  const gridMax = usePerAxisScaling ? 1.0 : maxValue;

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
        style={{ maxWidth: `${size + 160}px` }}
      >
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={chartRadius + 8}
          fill="#18181b"
          opacity={0.6}
        />

        {/* Concentric CIRCULAR grid lines */}
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

        {/* Axis lines from center to each vertex */}
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

        {/* Scale labels along the first axis (top) — hidden when using per-axis scaling */}
        {!usePerAxisScaling && gridLevels.map((level) => {
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

        {/* Comparison data polygon (behind main) */}
        {comparisonPolygon && (
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
              <circle
                key={`comp-dot-${i}`}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={comparisonColor}
                opacity={0.7}
              />
            ))}
          </>
        )}

        {/* Main data polygon fill */}
        <polygon
          points={dataPolygon}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data point dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={color}
          />
        ))}

        {/* Outer labels: attribute name + value */}
        {angles.map((a, i) => {
          const labelR = chartRadius + 24;
          const { x, y } = toXY(a, labelR);

          // Determine text anchor based on angle position
          let anchor: 'start' | 'middle' | 'end' = 'middle';
          const cosA = Math.cos(a);
          if (cosA > 0.25) anchor = 'start';
          else if (cosA < -0.25) anchor = 'end';

          // Vertical offset for labels at top/bottom
          const sinA = Math.sin(a);
          const yOffset = sinA < -0.7 ? -6 : sinA > 0.7 ? 8 : 0;

          const val = values[i];
          const displayVal = val !== undefined && val !== null
            ? (Number.isInteger(val) ? val.toString() : val.toFixed(1))
            : '0';

          return (
            <g key={`label-${i}`}>
              {/* Attribute name */}
              <text
                x={x}
                y={y + yOffset}
                textAnchor={anchor}
                dominantBaseline="central"
                fill="#d4d4d8"
                fontSize={11}
                fontWeight={500}
                fontFamily="system-ui, sans-serif"
              >
                {labels[i]}
              </text>
              {/* Value below the name */}
              <text
                x={x}
                y={y + yOffset + 14}
                textAnchor={anchor}
                dominantBaseline="central"
                fill={color}
                fontSize={11}
                fontWeight={700}
                fontFamily="system-ui, sans-serif"
              >
                {displayVal}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
