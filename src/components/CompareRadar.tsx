'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { WyscoutPlayer, WyscoutPositionMetrics } from '@/lib/wyscoutTypes';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const COMPARE_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.85)', point: 'rgba(59, 130, 246, 1)' },
  { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.85)', point: 'rgba(239, 68, 68, 1)' },
  { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.85)', point: 'rgba(34, 197, 94, 1)' },
];

const RAW_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.75)', point: 'rgba(59, 130, 246, 1)' },
  { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.75)', point: 'rgba(239, 68, 68, 1)' },
  { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.75)', point: 'rgba(16, 185, 129, 1)' },
];

interface CompareRadarProps {
  players: WyscoutPlayer[];
  positionMetrics: WyscoutPositionMetrics;
  height?: number;
  mode?: 'percentile' | 'raw';
  positionGroup?: string;
}

export default function CompareRadar({ players, positionMetrics, height = 450, mode = 'percentile', positionGroup }: CompareRadarProps) {
  if (players.length === 0) return null;

  const pg = positionGroup || players[0].pg;
  const metricsDef = positionMetrics[pg] || [];
  
  if (metricsDef.length < 3) {
    return <div className="text-zinc-500 text-center py-8">Not enough metrics defined</div>;
  }

  const labels = metricsDef.map(m => m.label);
  const colors = mode === 'raw' ? RAW_COLORS : COMPARE_COLORS;

  if (mode === 'raw') {
    const axisMaxes = metricsDef.map(m => {
      let max = 0;
      for (const player of players) {
        const v = player.m?.[m.key] ?? 0;
        if (v > max) max = v;
      }
      if (max <= 0) return 1;
      if (max <= 1) return Math.ceil(max * 10) / 10;
      if (max <= 10) return Math.ceil(max);
      return Math.ceil(max / 5) * 5;
    });

    const datasets = players.map((player, idx) => {
      const color = colors[idx % colors.length];
      const values = metricsDef.map((m, mi) => {
        const raw = player.m?.[m.key] ?? 0;
        return axisMaxes[mi] > 0 ? (raw / axisMaxes[mi]) * 100 : 0;
      });
      return {
        label: player.sn || player.n,
        data: values,
        backgroundColor: color.bg,
        borderColor: color.border,
        pointBackgroundColor: color.point,
        pointBorderColor: 'rgba(0,0,0,0.2)',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      };
    });

    const data = { labels, datasets };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: { color: '#a1a1aa', padding: 16, font: { size: 12 } },
        },
        tooltip: {
          backgroundColor: 'rgba(24, 24, 27, 0.95)',
          borderColor: 'rgba(63, 63, 70, 0.5)',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#a1a1aa',
          padding: 12,
          callbacks: {
            label: function(context: { dataset: { label?: string }; dataIndex: number }) {
              const playerIdx = datasets.indexOf(context.dataset as typeof datasets[0]);
              const metricKey = metricsDef[context.dataIndex]?.key;
              const player = players[playerIdx];
              const rawVal = player?.m?.[metricKey] ?? '—';
              return `${context.dataset.label ?? ''}: ${rawVal}`;
            },
          },
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          beginAtZero: true,
          ticks: { display: false },
          grid: { color: 'rgba(63, 63, 70, 0.4)' },
          angleLines: { color: 'rgba(63, 63, 70, 0.3)' },
          pointLabels: {
            color: '#a1a1aa',
            font: { size: 11, weight: 'bold' as const },
            padding: 8,
          },
        },
      },
    };

    return (
      <div style={{ height }}>
        <Radar data={data} options={options} />
      </div>
    );
  }

  // Percentile mode (default)
  const datasets = players.map((player, idx) => {
    const color = colors[idx % colors.length];
    const values = metricsDef.map(m => player.p?.[m.key] ?? 0);
    return {
      label: player.sn || player.n,
      data: values,
      backgroundColor: color.bg,
      borderColor: color.border,
      pointBackgroundColor: color.point,
      pointBorderColor: 'rgba(0,0,0,0.2)',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    };
  });

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#a1a1aa', padding: 16, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        borderColor: 'rgba(63, 63, 70, 0.5)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        padding: 12,
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 25,
          color: 'rgba(161, 161, 170, 0.4)',
          backdropColor: 'transparent',
          font: { size: 10 },
        },
        grid: { color: 'rgba(63, 63, 70, 0.4)' },
        angleLines: { color: 'rgba(63, 63, 70, 0.3)' },
        pointLabels: {
          color: '#a1a1aa',
          font: { size: 11, weight: 'bold' as const },
          padding: 8,
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Radar data={data} options={options} />
    </div>
  );
}
