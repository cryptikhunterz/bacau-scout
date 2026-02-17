'use client';

import { useRef, useEffect } from 'react';
import { WyscoutRadarMetric } from '@/lib/wyscoutTypes';

interface WyscoutRadarCanvasProps {
  metrics: WyscoutRadarMetric[];
  playerName?: string;
  clubName?: string;
  height?: number;
  mode?: 'percentile' | 'raw';
  title?: string;
}

function getZoneColor(pct: number): string {
  if (pct >= 90) return '#22c55e';
  if (pct >= 65) return '#4ade80';
  if (pct >= 35) return '#94a3b8';
  return '#ef4444';
}

function drawPolygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number, startAngle: number) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const angle = startAngle + (i % n) * ((2 * Math.PI) / n);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export default function WyscoutRadarCanvas({ metrics, clubName, height = 600, mode = 'percentile' }: WyscoutRadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const validMetrics = mode === 'raw'
    ? metrics.filter(m => m.value !== null && m.value !== undefined)
    : metrics.filter(m => m.percentile !== null);

  useEffect(() => {
    if (!canvasRef.current || validMetrics.length < 3) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;

    const n = validMetrics.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;
    const maxRadius = Math.min(w, h) * 0.31;

    ctx.clearRect(0, 0, w, h);

    // Color-banded background zones (percentile mode only)
    if (mode === 'percentile') {
      drawPolygon(ctx, cx, cy, maxRadius, n, startAngle);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
      ctx.fill();

      drawPolygon(ctx, cx, cy, maxRadius * 0.90, n, startAngle);
      ctx.fillStyle = 'rgba(74, 222, 128, 0.05)';
      ctx.fill();

      drawPolygon(ctx, cx, cy, maxRadius * 0.65, n, startAngle);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.04)';
      ctx.fill();

      drawPolygon(ctx, cx, cy, maxRadius * 0.35, n, startAngle);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.04)';
      ctx.fill();
    } else {
      drawPolygon(ctx, cx, cy, maxRadius, n, startAngle);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.03)';
      ctx.fill();
    }

    // Compute per-axis max for raw mode
    const rawMaxes = validMetrics.map(m => {
      const v = m.value ?? 0;
      if (v <= 0) return 1;
      if (v <= 1) return Math.ceil(v * 10) / 10;
      if (v <= 10) return Math.ceil(v);
      return Math.ceil(v / 5) * 5;
    });

    // Grid rings
    const gridLevels = [0.25, 0.50, 0.75, 1.0];
    for (const level of gridLevels) {
      const r = maxRadius * level;
      drawPolygon(ctx, cx, cy, r, n, startAngle);
      ctx.strokeStyle = level === 0.5 
        ? 'rgba(113, 113, 122, 0.3)' 
        : 'rgba(63, 63, 70, 0.25)';
      ctx.lineWidth = level === 0.5 ? 1 : 0.6;
      ctx.setLineDash(level === 0.5 ? [] : [3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Spoke lines
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxRadius * Math.cos(angle), cy + maxRadius * Math.sin(angle));
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.18)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Grid ring labels
    if (mode === 'percentile') {
      for (const level of [25, 50, 75]) {
        const r = maxRadius * (level / 100);
        ctx.fillStyle = 'rgba(113, 113, 122, 0.45)';
        ctx.font = '8px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(level.toString(), cx + 3, cy - r - 1);
      }
    }

    // Data polygon fill
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      let ratio: number;
      if (mode === 'raw') {
        const v = validMetrics[i].value ?? 0;
        ratio = rawMaxes[i] > 0 ? v / rawMaxes[i] : 0;
      } else {
        ratio = (validMetrics[i].percentile ?? 0) / 100;
      }
      const r = Math.max(ratio * maxRadius, 2);
      const angle = startAngle + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const fillColor = mode === 'raw' ? 'rgba(16, 185, 129, 0.20)' : 'rgba(59, 130, 246, 0.20)';
    const strokeColor = mode === 'raw' ? 'rgba(16, 185, 129, 0.75)' : 'rgba(59, 130, 246, 0.75)';
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Data points with labels
    for (let i = 0; i < n; i++) {
      let ratio: number;
      if (mode === 'raw') {
        const v = validMetrics[i].value ?? 0;
        ratio = rawMaxes[i] > 0 ? v / rawMaxes[i] : 0;
      } else {
        ratio = (validMetrics[i].percentile ?? 0) / 100;
      }
      const r = Math.max(ratio * maxRadius, 2);
      const angle = startAngle + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      const pct = validMetrics[i].percentile ?? 0;
      const dotColor = mode === 'raw' ? '#10b981' : getZoneColor(pct);

      // Glow
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = dotColor + '30';
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(24, 24, 27, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Outer labels
    for (let i = 0; i < n; i++) {
      const metric = validMetrics[i];
      const pct = metric.percentile ?? 0;
      const angle = startAngle + i * angleStep;

      const labelR = maxRadius + 18;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);

      let textAlign: CanvasTextAlign = 'center';
      const cosA = Math.cos(angle);
      if (cosA > 0.25) textAlign = 'left';
      else if (cosA < -0.25) textAlign = 'right';

      ctx.textAlign = textAlign;

      ctx.fillStyle = '#d4d4d8';
      ctx.font = '10px system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';

      let label = metric.label;
      if (label.length > 22) {
        label = label.replace('Successful ', '').replace('Accurate ', 'Acc. ');
      }

      const rawStr = metric.value !== null && metric.value !== undefined
        ? (Number.isInteger(metric.value) ? metric.value.toString() : metric.value.toFixed(2))
        : '—';

      const lineGap = 13;
      ctx.fillText(label, lx, ly - lineGap / 2);

      if (mode === 'raw') {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillText(rawStr, lx, ly + lineGap / 2);
      } else {
        ctx.fillStyle = getZoneColor(pct);
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillText(rawStr, lx, ly + lineGap / 2);
      }
    }

  }, [validMetrics, clubName, mode]);

  if (validMetrics.length < 3) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-500">
        Not enough data for radar chart
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px` }}
    />
  );
}
