'use client';

import { useMemo } from 'react';

interface RadarChartProps {
  labels: string[];
  values: number[];
  maxValue: number;
  color: string;       // e.g. '#22c55e'
  fillOpacity?: number; // 0-1, default 0.25
  title: string;
  size?: number;        // chart diameter in px, default 250
}

/**
 * SVG-based radar/spider chart.
 * Renders concentric grid polygons (1..maxValue), axis lines, a filled data polygon,
 * value labels at each axis, and text labels outside.
 */
export function RadarChart({
  labels,
  values,
  maxValue,
  color,
  fillOpacity = 0.25,
  title,
  size = 250,
}: RadarChartProps) {
  const n = labels.length;
  const cx = size / 2;
  const cy = size / 2;
  const chartRadius = size / 2 - 40; // leave room for labels

  // Pre-compute angle for each axis (start from top, go clockwise)
  const angles = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        // Start from -π/2 (top), go clockwise
        return -Math.PI / 2 + (2 * Math.PI * i) / n;
      }),
    [n],
  );

  /** Convert polar to cartesian */
  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  /** Build SVG polygon points string for a given radius */
  const polygonPoints = (radius: number) =>
    angles.map((a) => {
      const { x, y } = toXY(a, radius);
      return `${x},${y}`;
    }).join(' ');

  /** Build data polygon */
  const dataPoints = values.map((v, i) => {
    const r = (Math.min(v, maxValue) / maxValue) * chartRadius;
    return toXY(angles[i], r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Grid levels (1, 2, ..., maxValue)
  const gridLevels = Array.from({ length: maxValue }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        {title}
      </h4>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="w-full max-w-[250px]"
      >
        {/* Grid polygons */}
        {gridLevels.map((level) => {
          const r = (level / maxValue) * chartRadius;
          return (
            <polygon
              key={`grid-${level}`}
              points={polygonPoints(r)}
              fill="none"
              stroke="#3f3f46" // zinc-700
              strokeWidth={level === maxValue ? 1.5 : 0.5}
              opacity={level === maxValue ? 0.8 : 0.4}
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
              stroke="#3f3f46"
              strokeWidth={0.5}
              opacity={0.5}
            />
          );
        })}

        {/* Data polygon fill */}
        <polygon
          points={dataPolygon}
          fill={color}
          fillOpacity={fillOpacity}
          stroke={color}
          strokeWidth={2}
        />

        {/* Data points (dots) */}
        {dataPoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={color}
            stroke="#18181b" // zinc-900
            strokeWidth={1.5}
          />
        ))}

        {/* Value labels at each data point */}
        {dataPoints.map((p, i) => {
          // Offset the value label slightly towards center from the data point
          const val = values[i];
          if (val === 0) return null;
          const angle = angles[i];
          // Place value label between the dot and the outer label
          const labelR = (Math.min(val, maxValue) / maxValue) * chartRadius + 10;
          const { x, y } = toXY(angle, labelR);
          return (
            <text
              key={`val-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-zinc-300 text-[9px] font-bold"
            >
              {val.toFixed(1)}
            </text>
          );
        })}

        {/* Outer labels */}
        {angles.map((a, i) => {
          const labelR = chartRadius + 26;
          const { x, y } = toXY(a, labelR);
          // Determine text anchor based on position
          let anchor: 'start' | 'middle' | 'end' = 'middle';
          const cosA = Math.cos(a);
          if (cosA > 0.3) anchor = 'start';
          else if (cosA < -0.3) anchor = 'end';

          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              className="fill-zinc-300 text-[10px] font-medium"
            >
              {labels[i]}
            </text>
          );
        })}

        {/* Scale labels along the first axis (top) */}
        {gridLevels.map((level) => {
          const r = (level / maxValue) * chartRadius;
          const { x, y } = toXY(angles[0], r);
          return (
            <text
              key={`scale-${level}`}
              x={x + 8}
              y={y}
              textAnchor="start"
              dominantBaseline="central"
              className="fill-zinc-500 text-[8px]"
            >
              {level}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
