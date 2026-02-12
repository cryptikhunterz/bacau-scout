'use client';

import { useEffect, useState } from 'react';
import { RadarChart } from '@/components/RadarChart';
import {
  getPositionMetrics,
  OVERALL_METRICS,
  extractRadarData,
} from '@/lib/wyscoutRadar';

interface WyscoutData {
  metrics: Record<string, string>;
  position: string;
  wyscoutPosition: string;
}

interface WyscoutRadarsProps {
  /** Transfermarkt player ID */
  playerId: string;
  /** Transfermarkt position (e.g. "Centre-Back", "Central Midfield") */
  tmPosition?: string;
}

/**
 * Fetches Wyscout data for a player and renders two radar charts:
 * 1. Position-specific radar (green)
 * 2. Overall radar (blue)
 *
 * Renders nothing if no Wyscout data is available.
 */
export function WyscoutRadars({ playerId, tmPosition }: WyscoutRadarsProps) {
  const [data, setData] = useState<WyscoutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      return;
    }

    fetch(`/api/players/${playerId}/wyscout`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (json && json.metrics) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-zinc-900 rounded-xl border border-zinc-800" />
    );
  }

  if (!data || !data.metrics) return null;

  // Use TM position if available, otherwise fall back to the one stored with Wyscout data
  const position = tmPosition || data.position || '';

  const posConfig = getPositionMetrics(position);
  const posData = posConfig.metrics.length >= 3
    ? extractRadarData(data.metrics, posConfig.metrics)
    : null;

  const overallData = extractRadarData(data.metrics, OVERALL_METRICS);

  // Don't render if we have no usable data (all zeros)
  const hasPositionData = posData && posData.values.some((v) => v > 0);
  const hasOverallData = overallData.values.some((v) => v > 0);

  if (!hasPositionData && !hasOverallData) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">
          Advanced Metrics (Wyscout)
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Position Radar */}
        {hasPositionData && posData && (
          <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <RadarChart
              labels={posData.labels}
              values={posData.values}
              maxValue={1}
              maxValues={posData.maxValues}
              color="#22c55e"
              title={`${posConfig.groupLabel} PROFILE`}
            />
          </div>
        )}

        {/* Overall Radar */}
        {hasOverallData && (
          <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <RadarChart
              labels={overallData.labels}
              values={overallData.values}
              maxValue={1}
              maxValues={overallData.maxValues}
              color="#3b82f6"
              title="ALL-ROUND PROFILE"
            />
          </div>
        )}
      </div>
    </div>
  );
}
