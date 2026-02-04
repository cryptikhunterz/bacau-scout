'use client';

// Types for PlayerGrade fields
export type Status = "FM" | "U23" | "LOAN" | "WATCH";
export type Recommendation = "Sign" | "Monitor" | "Discard";
export type ScoutingLevel = "Basic" | "Impressive" | "Data only";
export type MetricRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Player grade interface - scout evaluation of a player
export interface PlayerGrade {
  playerId: string;
  playerName: string;
  position: string;
  club: string;
  gradedAt: string;

  // Status & Recommendation
  status: Status;
  recommendation: Recommendation;
  scoutingLevel: ScoutingLevel;

  // I. Technical Proficiency
  dribblingBallControl: MetricRating;
  oneVsOneDribbling: MetricRating;
  passingRangeCreation: MetricRating;
  crossingDelivery: MetricRating;

  // II. Athletic & Physical Profile
  accelerationPace: MetricRating;
  workRateStamina: MetricRating;
  physicalDuelingAerial: MetricRating;

  // III. Attacking Output & Efficiency
  goalContribution: MetricRating;
  carryingProgression: MetricRating;
  finishingShotPlacement: MetricRating;

  // IV. Tactical IQ & Character
  positionalIntelligence: MetricRating;
  defensivePressingIntensity: MetricRating;
  oneVsOneDuels: MetricRating;

  // Tags
  strengths: string[];
  weaknesses: string[];

  // Optional
  notes: string;
  transferFee?: string;
  salary?: string;
}

// Available tags for strengths/weaknesses
export const AVAILABLE_TAGS = [
  'Passing',
  'Work rate',
  'Header',
  'Duels',
  'Defensive awareness',
  'Speed',
  'Finishing',
  'Dribbling',
  'Vision',
  'Positioning',
  'Crossing',
  'Long shots',
  'Set pieces',
  'Leadership',
  'Aerial ability',
  'Tackling',
  'Interceptions',
  'Ball control',
  'First touch',
  'Decision making',
  'Composure',
  'Stamina',
  'Strength',
  'Agility',
  'Concentration',
];

// Rating scale labels (1-8)
export const RATING_LABELS: Record<number, string> = {
  1: "Liga 3a Player",
  2: "Relegation Player",
  3: "Mid-table Player (playout)",
  4: "Play-off player",
  5: "Promotion/championship player",
  6: "Superliga Player (Playout/Relegation)",
  7: "Superliga Midtable player",
  8: "Superliga playoff player"
};

// Metric definitions for UI
export const METRIC_CATEGORIES = {
  technical: {
    title: "I. Technical Proficiency",
    metrics: [
      { key: 'dribblingBallControl', label: 'Dribbling & Ball Control' },
      { key: 'oneVsOneDribbling', label: '1v1 Dribbling' },
      { key: 'passingRangeCreation', label: 'Passing Range (Creation)' },
      { key: 'crossingDelivery', label: 'Crossing & Delivery' },
    ]
  },
  athletic: {
    title: "II. Athletic & Physical Profile",
    metrics: [
      { key: 'accelerationPace', label: 'Acceleration & Pace' },
      { key: 'workRateStamina', label: 'Work Rate & Stamina' },
      { key: 'physicalDuelingAerial', label: 'Physical Dueling & Aerial Ability' },
    ]
  },
  attacking: {
    title: "III. Attacking Output & Efficiency",
    metrics: [
      { key: 'goalContribution', label: 'Goal Contribution (xG + xA)' },
      { key: 'carryingProgression', label: 'Carrying & Progression' },
      { key: 'finishingShotPlacement', label: 'Finishing & Shot Placement' },
    ]
  },
  tactical: {
    title: "IV. Tactical IQ & Character",
    metrics: [
      { key: 'positionalIntelligence', label: 'Positional Intelligence (Off-Ball)' },
      { key: 'defensivePressingIntensity', label: 'Defensive Pressing Intensity' },
      { key: 'oneVsOneDuels', label: '1v1 Duels' },
    ]
  }
};

// localStorage key for grades storage
const STORAGE_KEY = "bacau-scout-grades-v2";

/**
 * Get all grades from localStorage
 */
export function getAllGrades(): PlayerGrade[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get a single grade by player ID
 */
export function getGrade(playerId: string): PlayerGrade | null {
  const grades = getAllGrades();
  return grades.find(g => g.playerId === playerId) || null;
}

/**
 * Save or update a player grade
 */
export function saveGrade(grade: PlayerGrade): void {
  const grades = getAllGrades();
  const existingIndex = grades.findIndex(g => g.playerId === grade.playerId);

  if (existingIndex >= 0) {
    grades[existingIndex] = { ...grade, gradedAt: new Date().toISOString() };
  } else {
    grades.push({ ...grade, gradedAt: new Date().toISOString() });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
}

/**
 * Delete a player grade
 */
export function deleteGrade(playerId: string): void {
  const grades = getAllGrades().filter(g => g.playerId !== playerId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
}

/**
 * Get color class for rating value
 */
export function getRatingColor(rating: number): string {
  if (rating <= 2) return 'bg-red-500';
  if (rating <= 4) return 'bg-orange-500';
  if (rating <= 6) return 'bg-yellow-500';
  return 'bg-green-500';
}
