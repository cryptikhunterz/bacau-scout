export interface TeamListItem {
  id: string;
  n: string;       // team name
  comp: string;    // competition name
  tm: string;      // tmCode
  sm: number | null; // style match % to Bacau
}

export interface TeamRadarMetric {
  key: string;
  label: string;
  value: number;
  percentile: number | null;
  globalPercentile: number | null;
  invert?: boolean;
}

export interface SimilarTeam {
  id: string;
  name: string;
  competition: string;
  tmCode: string;
  score: number;
}

export interface WyscoutTeam {
  id: string;
  n: string;
  comp: string;
  tm: string;
  season: string;
  m: Record<string, number>;     // metrics
  ml: Record<string, string>;    // metric labels
  sm: Record<string, number>;    // sub-metrics
  p: Record<string, number>;     // league percentiles
  gp: Record<string, number>;    // global percentiles
  styleMatch: number | null;
  similar: SimilarTeam[];
  radar: TeamRadarMetric[];
}

export interface BacauReference {
  id: string;
  n: string;
  comp: string;
  tm: string;
  radar: TeamRadarMetric[];
  m: Record<string, number>;
  p: Record<string, number>;
  gp: Record<string, number>;
}
