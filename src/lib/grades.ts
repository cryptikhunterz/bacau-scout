'use client';

// ─── Types ──────────────────────────────────────────────────────────

export type Status = "FM" | "U23" | "LOAN" | "WATCH";
export type Verdict = "Sign" | "Observe" | "Monitor" | "Not a priority" | "Out of reach";
export type ScoutingLevel = "Basic" | "Impressive" | "Data only";
export type AttributeRating = 1 | 2 | 3 | 4 | 5;
export type PotentialRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Keep for backward compat
export type MetricRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Recommendation = Verdict;

// ─── Player Grade Interface ─────────────────────────────────────────

export interface PlayerGrade {
  playerId: string;
  playerName: string;
  position: string;
  club: string;
  gradedAt: string;

  // Status & Scouting Level
  status: Status;
  scoutingLevel: ScoutingLevel;

  // Ability & Potential
  ability: AttributeRating;      // 1-5
  potential: PotentialRating;    // 1-8

  // Report (FCB Scale 1-5)
  report: AttributeRating;

  // Physical (1-5)
  physStrength: AttributeRating;
  physSpeed: AttributeRating;
  physAgility: AttributeRating;
  physCoordination: AttributeRating;

  // Technique (1-5)
  techControl: AttributeRating;
  techShortPasses: AttributeRating;
  techLongPasses: AttributeRating;
  techAerial: AttributeRating;
  techCrossing: AttributeRating;
  techFinishing: AttributeRating;
  techDribbling: AttributeRating;
  techOneVsOneOffense: AttributeRating;
  techOneVsOneDefense: AttributeRating;

  // Tactic (1-5)
  tacPositioning: AttributeRating;
  tacTransition: AttributeRating;
  tacDecisions: AttributeRating;
  tacAnticipations: AttributeRating;
  tacDuels: AttributeRating;
  tacSetPieces: AttributeRating;

  // Scouting Tags (3 max)
  scoutingTags: string[];

  // Tags
  strengths: string[];
  weaknesses: string[];

  // Verdict
  verdict: Verdict;

  // Role & Conclusion
  role: string;
  conclusion: string;
  notes: string;

  // Optional
  transferFee?: string;
  salary?: string;
}

// ─── Rating Scales ──────────────────────────────────────────────────

// Potential scale (1-8) — Romanian league levels
export const POTENTIAL_LABELS: Record<number, string> = {
  1: "Liga 3a Player",
  2: "Relegation Player",
  3: "Mid-table Player (playout)",
  4: "Play-off player",
  5: "Promotion/championship player",
  6: "Superliga Player (Playout/Relegation)",
  7: "Superliga Midtable player",
  8: "Superliga playoff player",
};

// Keep old name for backward compat
export const RATING_LABELS = POTENTIAL_LABELS;

// Report scale (1-5) — FCB standard
export const REPORT_LABELS: Record<number, string> = {
  1: "Well below FCB / Liga 2 standard",
  2: "Below FCB standard (relegation Liga 2)",
  3: "At same level of FCB (squad player)",
  4: "Above FCB standard",
  5: "Well above FCB (Above Liga 2 standard)",
};

// Ability scale (1-5) — general ability assessment
export const ABILITY_LABELS: Record<number, string> = {
  1: "Very Low",
  2: "Low",
  3: "Average",
  4: "High",
  5: "Very High",
};

// ─── Attribute Categories ───────────────────────────────────────────

export const ATTRIBUTE_CATEGORIES = {
  physical: {
    title: "Physical",
    scale: 5,
    metrics: [
      { key: 'physStrength', label: 'Strength' },
      { key: 'physSpeed', label: 'Speed' },
      { key: 'physAgility', label: 'Agility' },
      { key: 'physCoordination', label: 'Coordination' },
    ],
  },
  technique: {
    title: "Technique",
    scale: 5,
    metrics: [
      { key: 'techControl', label: 'Control' },
      { key: 'techShortPasses', label: 'Short passes' },
      { key: 'techLongPasses', label: 'Long passes' },
      { key: 'techAerial', label: 'Aerial' },
      { key: 'techCrossing', label: 'Crossing' },
      { key: 'techFinishing', label: 'Finishing' },
      { key: 'techDribbling', label: 'Dribbling' },
      { key: 'techOneVsOneOffense', label: '1v1 Offensive' },
      { key: 'techOneVsOneDefense', label: '1v1 Defensive' },
    ],
  },
  tactic: {
    title: "Tactic",
    scale: 5,
    metrics: [
      { key: 'tacPositioning', label: 'Positioning' },
      { key: 'tacTransition', label: 'Transition' },
      { key: 'tacDecisions', label: 'Decisions' },
      { key: 'tacAnticipations', label: 'Anticipations' },
      { key: 'tacDuels', label: 'Duels' },
      { key: 'tacSetPieces', label: 'Set pieces' },
    ],
  },
};

// Keep old name for backward compat
export const METRIC_CATEGORIES = ATTRIBUTE_CATEGORIES;

// ─── Scouting Tags (categorized, 3 max) ────────────────────────────

export const SCOUTING_TAG_CATEGORIES = {
  defensive: {
    title: "Defensive Actions",
    tags: [
      "1v1 defending", "Anticipation", "Interceptions",
      "Ball recoveries", "Aerial duels", "Shot blocking",
    ],
  },
  offensive: {
    title: "Offensive Actions",
    tags: [
      "Runs in behind", "Hold-up play", "Key passes",
      "Chance conversion", "Long-range shooting",
    ],
  },
  physical: {
    title: "Physical",
    tags: [
      "Height / body build", "Strength", "Acceleration",
      "Top speed", "Agility", "Explosiveness",
      "Mobility", "Endurance / work rate",
    ],
  },
  technical: {
    title: "Technical",
    tags: [
      "Ball control", "First touch", "Technique under pressure",
      "Passing quality", "Progressive passing", "Two-footed ability",
      "Aerial striking", "Ball striking", "Crossing", "Finishing",
      "Secure handling (GK)", "Short distribution (GK)", "Long distribution (GK)",
    ],
  },
  tactical: {
    title: "Tactical",
    tags: [
      "Game intelligence", "Spatial awareness", "Scanning",
      "Timing", "Role understanding", "Tactical adaptability",
      "Tempo control", "Build-up play", "Playing between lines",
      "Defensive balance", "Pressing",
    ],
  },
  mental: {
    title: "Mental / Behavioral",
    tags: [
      "Competitive mentality", "Concentration", "Decision-making",
      "Leadership", "Communication", "Tactical discipline",
      "Bravery", "Reaction to mistakes", "Determination", "Creativity",
    ],
  },
};

// Flat list of all scouting tags
export const ALL_SCOUTING_TAGS = Object.values(SCOUTING_TAG_CATEGORIES)
  .flatMap(cat => cat.tags);

// Legacy AVAILABLE_TAGS — keep for backward compat
export const AVAILABLE_TAGS = [
  'Passing', 'Work rate', 'Header', 'Duels', 'Defensive awareness',
  'Speed', 'Finishing', 'Dribbling', 'Vision', 'Positioning',
  'Crossing', 'Long shots', 'Set pieces', 'Leadership', 'Aerial ability',
  'Tackling', 'Interceptions', 'Ball control', 'First touch',
  'Decision making', 'Composure', 'Stamina', 'Strength', 'Agility',
  'Concentration',
];

// ─── Verdict Options ────────────────────────────────────────────────

export const VERDICT_OPTIONS: { value: Verdict; color: string }[] = [
  { value: 'Sign', color: 'bg-green-600' },
  { value: 'Observe', color: 'bg-blue-600' },
  { value: 'Monitor', color: 'bg-yellow-500' },
  { value: 'Not a priority', color: 'bg-zinc-600' },
  { value: 'Out of reach', color: 'bg-red-600' },
];

// ─── Helpers ────────────────────────────────────────────────────────

export function getRatingColor(rating: number): string {
  if (rating <= 1) return 'bg-red-600';
  if (rating <= 2) return 'bg-orange-500';
  if (rating <= 3) return 'bg-yellow-500';
  if (rating <= 4) return 'bg-green-500';
  return 'bg-green-400';
}

export function getPotentialColor(rating: number): string {
  if (rating <= 2) return 'bg-red-600 text-white';
  if (rating <= 4) return 'bg-orange-500 text-white';
  if (rating <= 6) return 'bg-yellow-500 text-black';
  return 'bg-green-500 text-white';
}

export function getAttributeColor(value: number): string {
  if (value >= 5) return 'bg-green-500 text-white';
  if (value >= 4) return 'bg-green-600 text-white';
  if (value >= 3) return 'bg-yellow-500 text-black';
  if (value >= 2) return 'bg-orange-500 text-white';
  return 'bg-red-600 text-white';
}

// ─── API Functions ──────────────────────────────────────────────────

export async function getAllGradesAsync(): Promise<PlayerGrade[]> {
  try {
    const response = await fetch('/api/grades');
    if (!response.ok) throw new Error('Failed to fetch grades');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    return [];
  }
}

export async function getGradeAsync(playerId: string): Promise<PlayerGrade | null> {
  try {
    const response = await fetch(`/api/grades/${playerId}`);
    if (!response.ok) throw new Error('Failed to fetch grade');
    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error('Failed to fetch grade:', error);
    return null;
  }
}

export async function saveGradeAsync(grade: PlayerGrade): Promise<boolean> {
  try {
    const response = await fetch(`/api/grades/${grade.playerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grade),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to save grade:', error);
    return false;
  }
}

export async function deleteGradeAsync(playerId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/grades/${playerId}`, { method: 'DELETE' });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete grade:', error);
    return false;
  }
}

// ─── Local Storage (legacy, saves to both) ──────────────────────────

const STORAGE_KEY = "bacau-scout-grades-v3";

export function getAllGrades(): PlayerGrade[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getGrade(playerId: string): PlayerGrade | null {
  const grades = getAllGrades();
  return grades.find(g => g.playerId === playerId) || null;
}

export function saveGrade(grade: PlayerGrade): void {
  const grades = getAllGrades();
  const existingIndex = grades.findIndex(g => g.playerId === grade.playerId);

  if (existingIndex >= 0) {
    grades[existingIndex] = { ...grade, gradedAt: new Date().toISOString() };
  } else {
    grades.push({ ...grade, gradedAt: new Date().toISOString() });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
  saveGradeAsync(grade).catch(console.error);
}

export function deleteGrade(playerId: string): void {
  const grades = getAllGrades().filter(g => g.playerId !== playerId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
  deleteGradeAsync(playerId).catch(console.error);
}
