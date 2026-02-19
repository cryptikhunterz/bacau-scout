/**
 * Wyscout radar chart configuration.
 *
 * Maps Transfermarkt positions to position-specific metrics and provides
 * the "overall" metric set shared by all outfield players.
 *
 * Position groups based on Crypwalk methodology:
 * GK, CB, FB, DM, CM, AM, W (Winger), CF (Centre-Forward)
 */

// ─── Position-specific radar configs ────────────────────────────────────────

export interface RadarMetricDef {
  /** Key in the Wyscout metrics object (display format, e.g. "Passes per 90") */
  key: string;
  /** The ws_ key in players.json embedded data */
  wsKey: string;
  /** Short label for the radar axis */
  label: string;
  /** Reasonable max value for scaling this axis */
  max: number;
}

// ─── GK (Goalkeeper) ────────────────────────────────────────────────────────

const GK_METRICS: RadarMetricDef[] = [
  { key: 'Accurate long passes, %', wsKey: 'ws_accurate_long_passes', label: 'Long Pass %', max: 100 },
  { key: 'Shots against per 90', wsKey: 'ws_shots_against_per_90', label: 'Shots Against', max: 8 },
  { key: 'Conceded goals per 90', wsKey: 'ws_conceded_goals_per_90', label: 'Goals Conceded', max: 3 },
  { key: 'Save rate, %', wsKey: 'ws_save_rate', label: 'Save %', max: 100 },
  { key: 'Aerial duels won, %', wsKey: 'ws_aerial_duels_won', label: 'Aerial Won %', max: 100 },
];

// ─── CB (Centre-Back) ───────────────────────────────────────────────────────

const CB_METRICS: RadarMetricDef[] = [
  { key: 'Accurate passes, %', wsKey: 'ws_accurate_passes', label: 'Pass Acc %', max: 100 },
  { key: 'PAdj Interceptions', wsKey: 'ws_padj_interceptions', label: 'PAdj Int', max: 12 },
  { key: 'Defensive duels won, %', wsKey: 'ws_defensive_duels_won', label: 'Tackle %', max: 100 },
  { key: 'Fouls per 90', wsKey: 'ws_fouls_per_90', label: 'Fouls', max: 4 },
  { key: 'Aerial duels per 90', wsKey: 'ws_aerial_duels_per_90', label: 'Aerial Duels', max: 10 },
  { key: 'Aerial duels won, %', wsKey: 'ws_aerial_duels_won', label: 'Aerial Won %', max: 100 },
  { key: 'Long passes per 90', wsKey: 'ws_long_passes_per_90', label: 'Long Pass /90', max: 12 },
  { key: 'Accurate long passes, %', wsKey: 'ws_accurate_long_passes', label: 'Long Pass %', max: 100 },
];

// ─── FB (Fullback) ──────────────────────────────────────────────────────────

const FB_METRICS: RadarMetricDef[] = [
  { key: 'Accurate passes, %', wsKey: 'ws_accurate_passes', label: 'Pass Acc %', max: 100 },
  { key: 'Key passes per 90', wsKey: 'ws_key_passes_per_90', label: 'Key Pass /90', max: 4 },
  { key: 'Crosses per 90', wsKey: 'ws_crosses_per_90', label: 'Crosses /90', max: 10 },
  { key: 'Accurate crosses, %', wsKey: 'ws_accurate_crosses', label: 'Cross Acc %', max: 100 },
  { key: 'Dribbles per 90', wsKey: 'ws_dribbles_per_90', label: 'Dribbles /90', max: 10 },
  { key: 'Successful dribbles, %', wsKey: 'ws_successful_dribbles', label: 'Dribble %', max: 100 },
  { key: 'PAdj Interceptions', wsKey: 'ws_padj_interceptions', label: 'PAdj Int', max: 12 },
  { key: 'Fouls per 90', wsKey: 'ws_fouls_per_90', label: 'Fouls', max: 4 },
  { key: 'Aerial duels per 90', wsKey: 'ws_aerial_duels_per_90', label: 'Aerial Duels', max: 10 },
  { key: 'Aerial duels won, %', wsKey: 'ws_aerial_duels_won', label: 'Aerial Won %', max: 100 },
];

// ─── DM (Defensive Midfielder) ─────────────────────────────────────────────

const DM_METRICS: RadarMetricDef[] = [
  { key: 'PAdj Interceptions', wsKey: 'ws_padj_interceptions', label: 'PAdj Int', max: 12 },
  { key: 'Accurate passes, %', wsKey: 'ws_accurate_passes', label: 'Pass Acc %', max: 100 },
  { key: 'Passes per 90', wsKey: 'ws_passes_per_90', label: 'Passes /90', max: 65 },
  { key: 'Defensive duels per 90', wsKey: 'ws_defensive_duels_per_90', label: 'Def Duels /90', max: 12 },
  { key: 'Defensive duels won, %', wsKey: 'ws_defensive_duels_won', label: 'Def Duels %', max: 100 },
  { key: 'Fouls per 90', wsKey: 'ws_fouls_per_90', label: 'Fouls', max: 4 },
];

// ─── CM (Central Midfielder) ────────────────────────────────────────────────

const CM_METRICS: RadarMetricDef[] = [
  { key: 'Duels won, %', wsKey: 'ws_duels_won', label: 'Duels Won %', max: 100 },
  { key: 'PAdj Interceptions', wsKey: 'ws_padj_interceptions', label: 'PAdj Int', max: 12 },
  { key: 'Accurate forward passes, %', wsKey: 'ws_accurate_forward_passes', label: 'Fwd Pass %', max: 100 },
  { key: 'Key passes per 90', wsKey: 'ws_key_passes_per_90', label: 'Key Pass /90', max: 4 },
  { key: 'Long passes per 90', wsKey: 'ws_long_passes_per_90', label: 'Long Pass /90', max: 12 },
  { key: 'Passes to final third per 90', wsKey: 'ws_passes_to_final_third_per_90', label: 'Final 3rd /90', max: 12 },
  { key: 'Assists per 90', wsKey: 'ws_assists_per_90', label: 'Assists /90', max: 0.5 },
];

// ─── AM (Attacking Midfielder) ──────────────────────────────────────────────

const AM_METRICS: RadarMetricDef[] = [
  { key: 'Goals per 90', wsKey: 'ws_goals_per_90', label: 'Goals /90', max: 1.0 },
  { key: 'Shots per 90', wsKey: 'ws_shots_per_90', label: 'Shots /90', max: 5 },
  { key: 'Touches in box per 90', wsKey: 'ws_touches_in_box_per_90', label: 'Box Touches', max: 8 },
  { key: 'Assists per 90', wsKey: 'ws_assists_per_90', label: 'Assists /90', max: 0.5 },
  { key: 'Key passes per 90', wsKey: 'ws_key_passes_per_90', label: 'Key Pass /90', max: 4 },
  { key: 'Passes to final third per 90', wsKey: 'ws_passes_to_final_third_per_90', label: 'Final 3rd /90', max: 12 },
  { key: 'Accurate passes, %', wsKey: 'ws_accurate_passes', label: 'Pass Acc %', max: 100 },
  { key: 'Dribbles per 90', wsKey: 'ws_dribbles_per_90', label: 'Dribbles /90', max: 10 },
  { key: 'Successful dribbles, %', wsKey: 'ws_successful_dribbles', label: 'Dribble %', max: 100 },
];

// ─── W (Winger) ─────────────────────────────────────────────────────────────

const WINGER_METRICS: RadarMetricDef[] = [
  { key: 'Crosses per 90', wsKey: 'ws_crosses_per_90', label: 'Crosses /90', max: 10 },
  { key: 'Accurate crosses, %', wsKey: 'ws_accurate_crosses', label: 'Cross Acc %', max: 100 },
  { key: 'Goals per 90', wsKey: 'ws_goals_per_90', label: 'Goals /90', max: 1.0 },
  { key: 'Shots per 90', wsKey: 'ws_shots_per_90', label: 'Shots /90', max: 5 },
  { key: 'Goal conversion, %', wsKey: 'ws_goal_conversion', label: 'Goal Conv %', max: 100 },
  { key: 'Touches in box per 90', wsKey: 'ws_touches_in_box_per_90', label: 'Box Touches', max: 8 },
  { key: 'Assists per 90', wsKey: 'ws_assists_per_90', label: 'Assists /90', max: 0.5 },
  { key: 'Key passes per 90', wsKey: 'ws_key_passes_per_90', label: 'Key Pass /90', max: 4 },
  { key: 'Passes to final third per 90', wsKey: 'ws_passes_to_final_third_per_90', label: 'Final 3rd /90', max: 12 },
  { key: 'Accurate passes, %', wsKey: 'ws_accurate_passes', label: 'Pass Acc %', max: 100 },
  { key: 'Dribbles per 90', wsKey: 'ws_dribbles_per_90', label: 'Dribbles /90', max: 10 },
  { key: 'Successful dribbles, %', wsKey: 'ws_successful_dribbles', label: 'Dribble %', max: 100 },
];

// ─── CF (Centre-Forward) ────────────────────────────────────────────────────

const CF_METRICS: RadarMetricDef[] = [
  { key: 'Goals per 90', wsKey: 'ws_goals_per_90', label: 'Goals /90', max: 1.0 },
  { key: 'Shots per 90', wsKey: 'ws_shots_per_90', label: 'Shots /90', max: 6 },
  { key: 'Shots on target, %', wsKey: 'ws_shots_on_target', label: 'On Target %', max: 100 },
  { key: 'Goal conversion, %', wsKey: 'ws_goal_conversion', label: 'Goal Conv %', max: 100 },
  { key: 'Touches in box per 90', wsKey: 'ws_touches_in_box_per_90', label: 'Box Touches', max: 8 },
  { key: 'Assists per 90', wsKey: 'ws_assists_per_90', label: 'Assists /90', max: 0.5 },
  { key: 'Key passes per 90', wsKey: 'ws_key_passes_per_90', label: 'Key Pass /90', max: 4 },
  { key: 'Accurate passes, %', wsKey: 'ws_accurate_passes', label: 'Pass Acc %', max: 100 },
  { key: 'Dribbles per 90', wsKey: 'ws_dribbles_per_90', label: 'Dribbles /90', max: 10 },
  { key: 'Successful dribbles, %', wsKey: 'ws_successful_dribbles', label: 'Dribble %', max: 100 },
];

// ─── Overall radar (all outfield) ───────────────────────────────────────────

export const OVERALL_METRICS: RadarMetricDef[] = [
  { key: 'Goals per 90', wsKey: 'ws_goals_per_90', label: 'Goals /90', max: 1.0 },
  { key: 'xG per 90', wsKey: 'ws_xg_per_90', label: 'xG /90', max: 0.6 },
  { key: 'Assists per 90', wsKey: 'ws_assists_per_90', label: 'Assists /90', max: 0.5 },
  { key: 'xA per 90', wsKey: 'ws_xa_per_90', label: 'xA /90', max: 0.4 },
  { key: 'Key passes per 90', wsKey: 'ws_key_passes_per_90', label: 'Key Pass /90', max: 4 },
  { key: 'Accurate passes, %', wsKey: 'ws_accurate_passes', label: 'Pass Acc %', max: 100 },
  { key: 'Dribbles per 90', wsKey: 'ws_dribbles_per_90', label: 'Dribbles /90', max: 10 },
  { key: 'Defensive duels per 90', wsKey: 'ws_defensive_duels_per_90', label: 'Def Duels /90', max: 12 },
  { key: 'Aerial duels per 90', wsKey: 'ws_aerial_duels_per_90', label: 'Aerial /90', max: 10 },
  { key: 'Touches in box per 90', wsKey: 'ws_touches_in_box_per_90', label: 'Box Touches', max: 8 },
];

// ─── Position mapping ───────────────────────────────────────────────────────

export type PositionGroup = 'gk' | 'cb' | 'fb' | 'dm' | 'cm' | 'am' | 'winger' | 'forward';

/**
 * Map Transfermarkt position strings to a fine-grained position group.
 */
export function mapTmPositionToGroup(position: string): PositionGroup {
  const p = position.toLowerCase().trim();

  // Goalkeeper
  if (p.includes('goalkeeper') || p === 'gk') return 'gk';

  // Fullback / Wing-back
  if (
    p.includes('left-back') ||
    p.includes('right-back') ||
    p.includes('wing-back') ||
    p.includes('wingback') ||
    p === 'lb' ||
    p === 'rb' ||
    p === 'lwb' ||
    p === 'rwb' ||
    p === 'wb'
  )
    return 'fb';

  // Centre-back
  if (
    p.includes('centre-back') ||
    p.includes('center-back') ||
    p.includes('defender') ||
    p === 'cb'
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

  // Centre-Forward / Striker
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

  // Attacking Midfield
  if (
    p.includes('attacking midfield') ||
    p === 'am' ||
    p === 'cam' ||
    p === 'amf'
  )
    return 'am';

  // Defensive Midfield
  if (
    p.includes('defensive midfield') ||
    p === 'dm' ||
    p === 'cdm' ||
    p === 'dmf'
  )
    return 'dm';

  // Central Midfield (generic midfield falls here)
  if (
    p.includes('midfield') ||
    p.includes('central midfield') ||
    p === 'cm' ||
    p === 'cmf'
  )
    return 'cm';

  // Fallback: try to infer from keywords
  if (p.includes('attack') || p.includes('forward')) return 'forward';
  if (p.includes('defen') || p.includes('back')) return 'cb';

  // Default to central midfield
  return 'cm';
}

/**
 * Get the position-specific metrics for a given TM position.
 */
export function getPositionMetrics(position: string): { metrics: RadarMetricDef[]; groupLabel: string } {
  const group = mapTmPositionToGroup(position);
  switch (group) {
    case 'gk':
      return { metrics: GK_METRICS, groupLabel: 'GOALKEEPER' };
    case 'cb':
      return { metrics: CB_METRICS, groupLabel: 'CENTRE-BACK' };
    case 'fb':
      return { metrics: FB_METRICS, groupLabel: 'FULLBACK' };
    case 'dm':
      return { metrics: DM_METRICS, groupLabel: 'DEF. MIDFIELD' };
    case 'cm':
      return { metrics: CM_METRICS, groupLabel: 'CENTRAL MIDFIELD' };
    case 'am':
      return { metrics: AM_METRICS, groupLabel: 'ATT. MIDFIELD' };
    case 'winger':
      return { metrics: WINGER_METRICS, groupLabel: 'WINGER' };
    case 'forward':
      return { metrics: CF_METRICS, groupLabel: 'FORWARD' };
  }
}

/**
 * Get all position group definitions (used for template selectors in UI).
 */
export function getAllPositionGroups(): { group: PositionGroup; label: string; metrics: RadarMetricDef[] }[] {
  return [
    { group: 'gk', label: 'GK — Goalkeeper', metrics: GK_METRICS },
    { group: 'cb', label: 'CB — Centre-Back', metrics: CB_METRICS },
    { group: 'fb', label: 'FB — Fullback', metrics: FB_METRICS },
    { group: 'dm', label: 'DM — Def. Midfield', metrics: DM_METRICS },
    { group: 'cm', label: 'CM — Central Midfield', metrics: CM_METRICS },
    { group: 'am', label: 'AM — Att. Midfield', metrics: AM_METRICS },
    { group: 'winger', label: 'W — Winger', metrics: WINGER_METRICS },
    { group: 'forward', label: 'CF — Forward', metrics: CF_METRICS },
  ];
}

// ─── ws_ key ↔ display key mapping ─────────────────────────────────────────

/**
 * Complete mapping from ws_ keys (in players.json) to display-format keys
 * used by the radar and stats components.
 */
export const WS_KEY_TO_DISPLAY: Record<string, string> = {
  ws_matches_played: 'Matches played',
  ws_minutes_played: 'Minutes played',
  ws_goals: 'Goals',
  ws_xg: 'xG',
  ws_assists: 'Assists',
  ws_xa: 'xA',
  ws_duels_per_90: 'Duels per 90',
  ws_duels_won: 'Duels won, %',
  ws_successful_defensive_actions_per_90: 'Successful defensive actions per 90',
  ws_defensive_duels_per_90: 'Defensive duels per 90',
  ws_defensive_duels_won: 'Defensive duels won, %',
  ws_aerial_duels_per_90: 'Aerial duels per 90',
  ws_aerial_duels_won: 'Aerial duels won, %',
  ws_sliding_tackles_per_90: 'Sliding tackles per 90',
  ws_padj_sliding_tackles: 'PAdj Sliding tackles',
  ws_shots_blocked_per_90: 'Shots blocked per 90',
  ws_interceptions_per_90: 'Interceptions per 90',
  ws_padj_interceptions: 'PAdj Interceptions',
  ws_fouls_per_90: 'Fouls per 90',
  ws_yellow_cards: 'Yellow cards',
  ws_yellow_cards_per_90: 'Yellow cards per 90',
  ws_red_cards: 'Red cards',
  ws_red_cards_per_90: 'Red cards per 90',
  ws_successful_attacking_actions_per_90: 'Successful attacking actions per 90',
  ws_goals_per_90: 'Goals per 90',
  ws_non_penalty_goals: 'Non-penalty goals',
  ws_non_penalty_goals_per_90: 'Non-penalty goals per 90',
  ws_xg_per_90: 'xG per 90',
  ws_head_goals: 'Head goals',
  ws_head_goals_per_90: 'Head goals per 90',
  ws_shots: 'Shots',
  ws_shots_per_90: 'Shots per 90',
  ws_shots_on_target: 'Shots on target, %',
  ws_goal_conversion: 'Goal conversion, %',
  ws_assists_per_90: 'Assists per 90',
  ws_crosses_per_90: 'Crosses per 90',
  ws_accurate_crosses: 'Accurate crosses, %',
  ws_dribbles_per_90: 'Dribbles per 90',
  ws_successful_dribbles: 'Successful dribbles, %',
  ws_offensive_duels_per_90: 'Offensive duels per 90',
  ws_offensive_duels_won: 'Offensive duels won, %',
  ws_touches_in_box_per_90: 'Touches in box per 90',
  ws_progressive_runs_per_90: 'Progressive runs per 90',
  ws_passes_per_90: 'Passes per 90',
  ws_accurate_passes: 'Accurate passes, %',
  ws_forward_passes_per_90: 'Forward passes per 90',
  ws_accurate_forward_passes: 'Accurate forward passes, %',
  ws_back_passes_per_90: 'Back passes per 90',
  ws_accurate_back_passes: 'Accurate back passes, %',
  ws_lateral_passes_per_90: 'Lateral passes per 90',
  ws_accurate_lateral_passes: 'Accurate lateral passes, %',
  ws_short_medium_passes_per_90: 'Short / medium passes per 90',
  ws_accurate_short_medium_passes: 'Accurate short / medium passes, %',
  ws_long_passes_per_90: 'Long passes per 90',
  ws_accurate_long_passes: 'Accurate long passes, %',
  ws_average_pass_length_m: 'Average pass length, m',
  ws_average_long_pass_length_m: 'Average long pass length, m',
  ws_xa_per_90: 'xA per 90',
  ws_second_assists_per_90: 'Second assists per 90',
  ws_third_assists_per_90: 'Third assists per 90',
  ws_smart_passes_per_90: 'Smart passes per 90',
  ws_accurate_smart_passes: 'Accurate smart passes, %',
  ws_key_passes_per_90: 'Key passes per 90',
  ws_passes_to_final_third_per_90: 'Passes to final third per 90',
  ws_accurate_passes_to_final_third: 'Accurate passes to final third, %',
  ws_passes_to_penalty_area_per_90: 'Passes to penalty area per 90',
  ws_accurate_passes_to_penalty_area: 'Accurate passes to penalty area, %',
  ws_through_passes_per_90: 'Through passes per 90',
  ws_accurate_through_passes: 'Accurate through passes, %',
  ws_deep_completions_per_90: 'Deep completions per 90',
  ws_deep_completed_crosses_per_90: 'Deep completed crosses per 90',
  ws_progressive_passes_per_90: 'Progressive passes per 90',
  ws_accurate_progressive_passes: 'Accurate progressive passes, %',
  ws_corners_per_90: 'Corners per 90',
  ws_free_kicks_per_90: 'Free kicks per 90',
  ws_direct_free_kicks_per_90: 'Direct free kicks per 90',
  ws_direct_free_kicks_on_target: 'Direct free kicks on target, %',
  ws_penalties_taken: 'Penalties taken',
  ws_penalty_conversion: 'Penalty conversion, %',
  // Goalkeeping
  ws_clean_sheets: 'Clean sheets',
  ws_conceded_goals: 'Conceded goals',
  ws_conceded_goals_per_90: 'Conceded goals per 90',
  ws_shots_against: 'Shots against',
  ws_shots_against_per_90: 'Shots against per 90',
  ws_save_rate: 'Save rate, %',
  ws_xg_against: 'xG against',
  ws_xg_against_per_90: 'xG against per 90',
  ws_prevented_goals: 'Prevented goals',
  ws_prevented_goals_per_90: 'Prevented goals per 90',
  ws_exits_per_90: 'Exits per 90',
};

/** Reverse mapping: display key → ws_ key */
export const DISPLAY_TO_WS_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(WS_KEY_TO_DISPLAY).map(([ws, display]) => [display, ws])
);

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

    // Try display-format key first, then ws_ key
    const raw = rawMetrics[def.key] ?? rawMetrics[def.wsKey];
    if (raw !== undefined && raw !== null && raw !== '' && raw !== '-') {
      const parsed = parseFloat(raw);
      values.push(isNaN(parsed) ? 0 : parsed);
    } else {
      values.push(0);
    }
  }

  return { labels, values, maxValues };
}
