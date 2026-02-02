'use client';

// Types for PlayerGrade fields
export type Status = "FM" | "U23" | "LOAN" | "WATCH";
export type Recommendation = "Sign" | "Monitor" | "Discard";
export type ScoutingLevel = "Basic" | "Impressive" | "Data only";
export type PlayerCategory = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Player grade interface - scout evaluation of a player
export interface PlayerGrade {
  playerId: string;           // TM player ID
  playerName: string;         // For display
  position: string;           // From TM data
  club: string;               // From TM data
  gradedAt: string;           // ISO timestamp

  // Status & Recommendation
  status: Status;
  recommendation: Recommendation;
  scoutingLevel: ScoutingLevel;

  // Player Category (1-8)
  playerCategory: PlayerCategory;

  // Ability Ratings (1-5, 0.5 increments)
  abilityRating: number;
  potentialRating: number;

  // Star Ratings (1-5)
  technicalRating: number;
  tacticalRating: number;
  physicalRating: number;
  mentalRating: number;

  // Optional
  notes: string;
  transferFee?: string;
  salary?: string;
}

// Category labels for display
export const CATEGORY_LABELS: Record<number, string> = {
  1: "Liga 1a Player",
  2: "Relegated Player",
  3: "Adequate Player",
  4: "Pay-off player",
  5: "Promotion/championship player",
  6: "European Player",
  7: "Europa top leagues",
  8: "Europa top player"
};

// localStorage key for grades storage
const STORAGE_KEY = "bacau-scout-grades";

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
