/**
 * Wyscout radar chart configuration.
 *
 * Maps Transfermarkt positions to position-specific metrics and provides
 * the "overall" metric set shared by all outfield players.
 */

// ─── Position-specific radar configs ────────────────────────────────────────

export interface RadarMetricDef {
  /** Key in the Wyscout metrics object */
  key: string;
  /** Short label for the radar axis */
  label: string;
  /** Reasonable max value for scaling this axis (based on league top percentiles) */
  max: number;
}

const CB_METRICS: RadarMetricDef[] = [
  { key: 'Defensive duels per 90', label: 'Def Duels', max: 12 },
  { key: 'Defensive duels won, %', label: 'Def Duels %', max: 100 },
  { key: 'Aerial duels per 90', label: 'Aerial Duels', max: 10 },
  { key: 'Aerial duels won, %', label: 'Aerial %', max: 100 },
  { key: 'Interceptions per 90', label: 'Interceptions', max: 10 },
  { key: 'Shots blocked per 90', label: 'Blocks', max: 3 },
  { key: 'Fouls per 90', label: 'Fouls', max: 4 },
  { key: 'Sliding tackles per 90', label: 'Tackles', max: 3 },
];

const MID_METRICS: RadarMetricDef[] = [
  { key: 'Passes per 90', label: 'Passes', max: 65 },
  { key: 'Accurate passes, %', label: 'Pass Acc', max: 100 },
  { key: 'Progressive passes per 90', label: 'Prog Passes', max: 12 },
  { key: 'Forward passes per 90', label: 'Fwd Passes', max: 30 },
  { key: 'Key passes per 90', label: 'Key Passes', max: 4 },
  { key: 'Defensive duels per 90', label: 'Def Duels', max: 12 },
  { key: 'Interceptions per 90', label: 'Interceptions', max: 10 },
  { key: 'Successful dribbles, %', label: 'Dribble %', max: 100 },
];

const WINGER_METRICS: RadarMetricDef[] = [
  { key: 'Crosses per 90', label: 'Crosses', max: 10 },
  { key: 'Dribbles per 90', label: 'Dribbles', max: 10 },
  { key: 'Successful dribbles, %', label: 'Dribble %', max: 100 },
  { key: 'Offensive duels per 90', label: 'Off Duels', max: 15 },
  { key: 'Offensive duels won, %', label: 'Off Duels %', max: 100 },
  { key: 'Key passes per 90', label: 'Key Passes', max: 4 },
  { key: 'Shots per 90', label: 'Shots', max: 5 },
  { key: 'xG per 90', label: 'xG', max: 0.6 },
];

const FORWARD_METRICS: RadarMetricDef[] = [
  { key: 'Goals', label: 'Goals', max: 20 },
  { key: 'Shots per 90', label: 'Shots', max: 6 },
  { key: 'Shots on target, %', label: 'On Target %', max: 100 },
  { key: 'xG', label: 'xG', max: 15 },
  { key: 'Offensive duels per 90', label: 'Off Duels', max: 15 },
  { key: 'Offensive duels won, %', label: 'Off Duels %', max: 100 },
  { key: 'Touches in box per 90', label: 'Box Touches', max: 8 },
  { key: 'Aerial duels won, %', label: 'Aerial %', max: 100 },
];

// ─── Overall radar (all outfield) ───────────────────────────────────────────

export const OVERALL_METRICS: RadarMetricDef[] = [
  { key: 'Passes per 90', label: 'Passes', max: 65 },
  { key: 'Accurate passes, %', label: 'Pass Acc', max: 100 },
  { key: 'Progressive passes per 90', label: 'Prog Passes', max: 12 },
  { key: 'Crosses per 90', label: 'Crosses', max: 10 },
  { key: 'Offensive duels won, %', label: 'Off Duels %', max: 100 },
  { key: 'Defensive duels per 90', label: 'Def Duels', max: 12 },
  { key: 'Aerial duels per 90', label: 'Aerial Duels', max: 10 },
  { key: 'Touches in box per 90', label: 'Box Touches', max: 8 },
  { key: 'Fouls per 90', label: 'Fouls', max: 4 },
  { key: 'Key passes per 90', label: 'Key Passes', max: 4 },
];

// ─── Position mapping ───────────────────────────────────────────────────────

type PositionGroup = 'cb' | 'mid' | 'winger' | 'forward' | 'gk';

/**
 * Map Transfermarkt position strings to a position group.
 */
export function mapTmPositionToGroup(position: string): PositionGroup {
  const p = position.toLowerCase().trim();

  // Goalkeeper
  if (p.includes('goalkeeper') || p === 'gk') return 'gk';

  // Centre-back / defender
  if (
    p.includes('centre-back') ||
    p.includes('center-back') ||
    p.includes('left-back') ||
    p.includes('right-back') ||
    p.includes('defender') ||
    p === 'cb' ||
    p === 'lb' ||
    p === 'rb'
  )
    return 'cb';

  // Winger
  if (
    p.includes('left winger') ||
    p.includes('right winger') ||
    p.includes('left midfield') ||
    p.includes('right midfield') ||
    p === 'lw' ||
    p === 'rw' ||
    p === 'lm' ||
    p === 'rm'
  )
    return 'winger';

  // Forward / striker
  if (
    p.includes('centre-forward') ||
    p.includes('center-forward') ||
    p.includes('striker') ||
    p.includes('second striker') ||
    p === 'cf' ||
    p === 'st' ||
    p === 'ss'
  )
    return 'forward';

  // Midfield (default for all remaining midfield positions)
  if (
    p.includes('midfield') ||
    p.includes('attacking midfield') ||
    p.includes('defensive midfield') ||
    p.includes('central midfield') ||
    p === 'cm' ||
    p === 'dm' ||
    p === 'am' ||
    p === 'cdm' ||
    p === 'cam'
  )
    return 'mid';

  // Fallback: try to infer from keywords
  if (p.includes('attack') || p.includes('forward')) return 'forward';
  if (p.includes('defen') || p.includes('back')) return 'cb';

  // Default to midfield
  return 'mid';
}

/**
 * Get the position-specific metrics for a given TM position.
 */
export function getPositionMetrics(position: string): { metrics: RadarMetricDef[]; groupLabel: string } {
  const group = mapTmPositionToGroup(position);
  switch (group) {
    case 'cb':
      return { metrics: CB_METRICS, groupLabel: 'DEFENSIVE' };
    case 'mid':
      return { metrics: MID_METRICS, groupLabel: 'MIDFIELD' };
    case 'winger':
      return { metrics: WINGER_METRICS, groupLabel: 'WINGER' };
    case 'forward':
      return { metrics: FORWARD_METRICS, groupLabel: 'FORWARD' };
    case 'gk':
      // For GKs, return empty — skip for now
      return { metrics: [], groupLabel: 'GOALKEEPER' };
  }
}

/**
 * Extract radar data from raw Wyscout metrics.
 *
 * Returns arrays of labels, values, and maxValues for independent-axis scaling.
 * Metrics that are missing from the player's data are set to 0.
 */
export function extractRadarData(
  rawMetrics: Record<string, string>,
  metricDefs: RadarMetricDef[],
): { labels: string[]; values: number[]; maxValues: number[] } {
  const labels: string[] = [];
  const values: number[] = [];
  const maxValues: number[] = [];

  for (const def of metricDefs) {
    labels.push(def.label);
    maxValues.push(def.max);

    const raw = rawMetrics[def.key];
    if (raw !== undefined && raw !== null && raw !== '' && raw !== '-') {
      const parsed = parseFloat(raw);
      values.push(isNaN(parsed) ? 0 : parsed);
    } else {
      values.push(0);
    }
  }

  return { labels, values, maxValues };
}
