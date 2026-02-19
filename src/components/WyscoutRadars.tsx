'use client';

import { useEffect, useState } from 'react';
import { RadarChart } from '@/components/RadarChart';
import { PercentileRadar } from '@/components/PercentileRadar';
import {
  getPositionMetrics,
  OVERALL_METRICS,
  extractRadarData,
} from '@/lib/wyscoutRadar';
import { loadWyscoutPositionMetrics } from '@/lib/wyscoutData';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RadarMetric {
  key: string;
  label: string;
  value: number;
  percentile: number;
  gp: number;
}

interface TemplateData {
  radar: RadarMetric[];
  allround: RadarMetric[];
}

interface PercentileWyscoutData {
  hasPercentiles: true;
  pg: string;
  comp: string;
  radar: RadarMetric[];
  allround: RadarMetric[];
  templates?: Record<string, TemplateData>;
}

interface LegacyWyscoutData {
  hasPercentiles: false;
  metrics: Record<string, string>;
  position: string;
  wyscoutPosition: string;
}

type WyscoutData = PercentileWyscoutData | LegacyWyscoutData;

// ─── Position group labels ──────────────────────────────────────────────────

const PG_LABELS: Record<string, string> = {
  GK: 'GOALKEEPER',
  CB: 'CENTRE-BACK',
  FB: 'FULLBACK',
  WB: 'WING-BACK',
  DM: 'DEF. MIDFIELD',
  CM: 'CENTRAL MIDFIELD',
  AM: 'ATT. MIDFIELD',
  W: 'WINGER',
  FW: 'FORWARD',
  CF: 'CENTRE-FORWARD',
};

const POSITION_GROUPS = ['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'FW'];

// ─── Component ──────────────────────────────────────────────────────────────

interface WyscoutRadarsProps {
  playerId: string;
  tmPosition?: string;
}

export function WyscoutRadars({ playerId, tmPosition }: WyscoutRadarsProps) {
  const [data, setData] = useState<WyscoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [compMode, setCompMode] = useState<'league' | 'global'>('league');
  const [radarTemplate, setRadarTemplate] = useState<string>('');
  const [posMetrics, setPosMetrics] = useState<Record<string, { key: string; label: string }[]> | null>(null);

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/players/${playerId}/wyscout`).then((res) => res.ok ? res.json() : null),
      loadWyscoutPositionMetrics(),
    ])
      .then(([json, pm]) => {
        if (json) setData(json);
        if (pm) setPosMetrics(pm);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-zinc-900 rounded-xl border border-zinc-800" />
    );
  }

  if (!data) return null;

  // ─── Percentile mode ────────────────────────────────────────────────────

  if (data.hasPercentiles) {
    const { pg, comp, radar, allround } = data;
    const activePg = radarTemplate || pg;

    // Pick percentile field based on comparison mode
    const getPercentile = (m: RadarMetric) =>
      compMode === 'league' ? (m.percentile ?? m.gp) : (m.gp ?? m.percentile);

    // Resolve effective radar/allround from pre-computed templates if available
    let effectiveRadar = radar;
    let effectiveAllround = allround;

    if (radarTemplate && data.templates && data.templates[radarTemplate]) {
      // Use pre-computed template data (percentiles computed against target position pool)
      effectiveRadar = data.templates[radarTemplate].radar;
      effectiveAllround = data.templates[radarTemplate].allround;
    } else if (radarTemplate && posMetrics && posMetrics[radarTemplate]) {
      // Fallback: rebuild radar labels from position-metrics (legacy behavior)
      const allMetricsMap = new Map<string, RadarMetric>();
      for (const m of [...radar, ...allround]) {
        if (!allMetricsMap.has(m.key)) allMetricsMap.set(m.key, m);
      }
      const templateKeys = posMetrics[radarTemplate];
      effectiveRadar = templateKeys
        .map((tk: { key: string; label: string }) => {
          const existing = allMetricsMap.get(tk.key);
          if (existing) return { ...existing, label: tk.label || existing.label };
          return null;
        })
        .filter((m: RadarMetric | null): m is RadarMetric => m !== null);
    }

    let templateRadar = effectiveRadar;

    // Supplement sparse radars: ensure at least 3 meaningful data points each
    const MIN_RADAR_POINTS = 3;

    const supplementRadar = (primary: RadarMetric[], pool: RadarMetric[]): RadarMetric[] => {
      const meaningful = primary.filter(m => m.value !== 0 || (m.percentile !== undefined && m.percentile !== 50));
      if (meaningful.length >= MIN_RADAR_POINTS) return primary;

      const primaryKeys = new Set(primary.map(m => m.key));
      const candidates = pool
        .filter(m => !primaryKeys.has(m.key) && (m.value !== 0 || (m.percentile !== undefined && m.percentile !== 50)))
        .sort((a, b) => getPercentile(b) - getPercentile(a));

      const supplemented = [...primary];
      for (const candidate of candidates) {
        if (supplemented.filter(m => m.value !== 0 || (m.percentile !== undefined && m.percentile !== 50)).length >= MIN_RADAR_POINTS) break;
        supplemented.push(candidate);
      }
      return supplemented;
    };

    const supplementedRadar = supplementRadar(templateRadar, effectiveAllround);
    const supplementedAllround = supplementRadar(effectiveAllround, templateRadar);

    // Filter out metrics with no data (value=0 and percentile=50 means missing)
    const hasPositionData = supplementedRadar.length >= 3 && supplementedRadar.some((m) => m.value !== 0 || m.percentile !== 50);
    const hasAllroundData = supplementedAllround.length >= 3 && supplementedAllround.some((m) => m.value !== 0 || m.percentile !== 50);

    if (!hasPositionData && !hasAllroundData) return null;

    const posLabel = PG_LABELS[activePg] || activePg;

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

        {/* Comparison toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCompMode('league')}
            className={`px-3 py-1 text-xs font-medium rounded-l-md border transition-colors ${
              compMode === 'league'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            🏆 League
          </button>
          <button
            onClick={() => setCompMode('global')}
            className={`px-3 py-1 text-xs font-medium rounded-r-md border transition-colors ${
              compMode === 'global'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            🌍 Global
          </button>
          <span className="ml-2 text-[10px] text-zinc-500 max-w-[180px] truncate" title={comp}>
            {compMode === 'league' ? comp : 'All leagues, same position'}
          </span>
        </div>

        {/* Position template selector */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-zinc-500">Template:</span>
          <select
            value={activePg}
            onChange={(e) => setRadarTemplate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            {POSITION_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g} — {PG_LABELS[g] || g}
              </option>
            ))}
          </select>
          {radarTemplate && radarTemplate !== pg && (
            <button
              onClick={() => setRadarTemplate('')}
              className="text-xs text-zinc-500 hover:text-white underline"
            >
              Reset to {pg}
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> ≥90th
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-300 inline-block" /> 65–89th
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" /> 35–64th
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;35th
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Position Radar */}
          {hasPositionData && (
            <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <RadarChart
                labels={supplementedRadar.map((m) => m.label)}
                values={supplementedRadar.map((m) => getPercentile(m))}
                maxValue={100}
                mode="percentile"
                displayValues={supplementedRadar.map((m) => m.value)}
                percentiles={supplementedRadar.map((m) => getPercentile(m))}
                title={`${posLabel} PROFILE`}
              />
            </div>
          )}

          {/* Enrichment-style Percentile Radar */}
          {hasAllroundData && (
            <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <PercentileRadar
                labels={supplementedAllround.map((m) => m.label)}
                values={supplementedAllround.map((m) => getPercentile(m))}
                displayValues={supplementedAllround.map((m) => m.value)}
                percentiles={supplementedAllround.map((m) => getPercentile(m))}
                title="PERCENTILE PROFILE"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Legacy raw mode (fallback) ─────────────────────────────────────────

  const position = tmPosition || data.position || '';
  const posConfig = getPositionMetrics(position);
  const posData = posConfig.metrics.length >= 3
    ? extractRadarData(data.metrics, posConfig.metrics)
    : null;

  const overallData = extractRadarData(data.metrics, OVERALL_METRICS);

  const hasPositionData = posData && posData.values.some((v) => v > 0);
  const hasOverallData = overallData.values.some((v) => v > 0);

  if (!hasPositionData && !hasOverallData) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">
          Advanced Metrics (Wyscout)
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
