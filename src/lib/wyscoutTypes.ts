export interface WyscoutPlayer {
  id: number;
  n: string;       // full name
  sn: string;      // short name
  cl: string;      // club
  tm?: string;     // team (wyscout) — only in full player data
  pos: string;     // full position
  pg: string;      // position group: GK, CB, WB, DM, CM, AM, FW
  age: number;
  min: number;     // minutes
  mp: number;      // matches played
  comp: string;    // competition
  lg: string;      // league
  mv: string | null;   // market value string
  mvn: number;     // market value numeric
  nat: string[];   // nationality
  dob: string | null;  // date of birth
  pid: string;     // transfermarkt player id
  m?: Record<string, number>;   // metrics (non-null only) — only in full player data
  p?: Record<string, number>;   // league percentiles (non-null only) — only in full player data
  gp?: Record<string, number>;  // global percentiles (cross-league, non-null only) — only in full player data
  r?: WyscoutRadarMetric[];             // radar metrics — only in full player data
}

export interface WyscoutRadarMetric {
  key: string;
  label: string;
  value: number | null;
  percentile: number | null;
  invert?: boolean;
}

export interface WyscoutLeague {
  id: number;
  name: string;
  count: number;
  competition: string;
}

export interface WyscoutPositionMetrics {
  [posGroup: string]: {
    key: string;
    label: string;
    invert?: boolean;
  }[];
}

export type WyscoutSortField = 'n' | 'cl' | 'pos' | 'lg' | 'mvn' | 'min' | 'mp' | 'age';
export type WyscoutSortDir = 'asc' | 'desc';
