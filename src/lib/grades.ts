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

// API-based grade functions

/**
 * Get all grades from database
 */
export async function getAllGradesAsync(): Promise<PlayerGrade[]> {
  try {
    const response = await fetch('/api/grades');
    if (!response.ok) throw new Error('Failed to fetch grades');
    const gradesMap = await response.json();
    
    // Convert from map to array format
    return Object.entries(gradesMap).map(([playerId, data]: [string, any]) => ({
      playerId,
      playerName: data.playerName || '',
      position: data.position || '',
      club: data.club || '',
      gradedAt: data.updatedAt || new Date().toISOString(),
      status: data.status || 'WATCH',
      recommendation: data.recommendation || 'Monitor',
      scoutingLevel: data.scoutingLevel || 'Basic',
      dribblingBallControl: data.metrics?.ballControl || 0,
      oneVsOneDribbling: data.metrics?.dribbling || 0,
      passingRangeCreation: data.metrics?.passing || 0,
      crossingDelivery: data.metrics?.creativity || 0,
      accelerationPace: data.metrics?.pace || 0,
      workRateStamina: data.metrics?.stamina || 0,
      physicalDuelingAerial: data.metrics?.strength || 0,
      goalContribution: data.metrics?.finishing || 0,
      carryingProgression: data.metrics?.movement || 0,
      finishingShotPlacement: data.metrics?.positioning || 0,
      positionalIntelligence: data.metrics?.decisionMaking || 0,
      defensivePressingIntensity: data.metrics?.workRate || 0,
      oneVsOneDuels: data.metrics?.discipline || 0,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      notes: data.notes || '',
    }));
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    return [];
  }
}

/**
 * Get a single grade by player ID
 */
export async function getGradeAsync(playerId: string): Promise<PlayerGrade | null> {
  try {
    const response = await fetch(`/api/grades/${playerId}`);
    if (!response.ok) throw new Error('Failed to fetch grade');
    const data = await response.json();
    if (!data) return null;
    
    return {
      playerId,
      playerName: data.playerName || '',
      position: data.position || '',
      club: data.club || '',
      gradedAt: data.updatedAt || new Date().toISOString(),
      status: data.status || 'WATCH',
      recommendation: data.recommendation || 'Monitor',
      scoutingLevel: data.scoutingLevel || 'Basic',
      dribblingBallControl: data.metrics?.ballControl || 0,
      oneVsOneDribbling: data.metrics?.dribbling || 0,
      passingRangeCreation: data.metrics?.passing || 0,
      crossingDelivery: data.metrics?.creativity || 0,
      accelerationPace: data.metrics?.pace || 0,
      workRateStamina: data.metrics?.stamina || 0,
      physicalDuelingAerial: data.metrics?.strength || 0,
      goalContribution: data.metrics?.finishing || 0,
      carryingProgression: data.metrics?.movement || 0,
      finishingShotPlacement: data.metrics?.positioning || 0,
      positionalIntelligence: data.metrics?.decisionMaking || 0,
      defensivePressingIntensity: data.metrics?.workRate || 0,
      oneVsOneDuels: data.metrics?.discipline || 0,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      notes: data.notes || '',
    };
  } catch (error) {
    console.error('Failed to fetch grade:', error);
    return null;
  }
}

/**
 * Save or update a player grade
 */
export async function saveGradeAsync(grade: PlayerGrade): Promise<boolean> {
  try {
    const response = await fetch(`/api/grades/${grade.playerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: {
          ballControl: grade.dribblingBallControl,
          passing: grade.passingRangeCreation,
          dribbling: grade.oneVsOneDribbling,
          finishing: grade.goalContribution,
          pace: grade.accelerationPace,
          stamina: grade.workRateStamina,
          strength: grade.physicalDuelingAerial,
          positioning: grade.finishingShotPlacement,
          movement: grade.carryingProgression,
          creativity: grade.crossingDelivery,
          decisionMaking: grade.positionalIntelligence,
          workRate: grade.defensivePressingIntensity,
          discipline: grade.oneVsOneDuels,
        },
        recommendation: grade.recommendation?.toLowerCase(),
        strengths: grade.strengths,
        weaknesses: grade.weaknesses,
        notes: grade.notes,
        scoutName: grade.scoutingLevel,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to save grade:', error);
    return false;
  }
}

/**
 * Delete a player grade
 */
export async function deleteGradeAsync(playerId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/grades/${playerId}`, { method: 'DELETE' });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete grade:', error);
    return false;
  }
}

// Legacy localStorage functions (for backward compatibility during transition)
const STORAGE_KEY = "bacau-scout-grades-v2";

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
  // Save to both localStorage and database
  const grades = getAllGrades();
  const existingIndex = grades.findIndex(g => g.playerId === grade.playerId);

  if (existingIndex >= 0) {
    grades[existingIndex] = { ...grade, gradedAt: new Date().toISOString() };
  } else {
    grades.push({ ...grade, gradedAt: new Date().toISOString() });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
  
  // Also save to database
  saveGradeAsync(grade).catch(console.error);
}

export function deleteGrade(playerId: string): void {
  const grades = getAllGrades().filter(g => g.playerId !== playerId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
  
  // Also delete from database
  deleteGradeAsync(playerId).catch(console.error);
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
