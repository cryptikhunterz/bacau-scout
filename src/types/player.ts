// Player type matching Supabase schema
export interface Player {
  id: string;
  tm_url: string | null;
  name: string;
  position: string | null;
  age: number | null;
  date_of_birth: string | null;
  current_club: string | null;
  market_value_raw: string | null;
  market_value_eur: number | null;
  nationality: string[];
  image_url: string | null;
  raw_data: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

// Search result player type (from API)
export interface SearchPlayer {
  name: string;
  position: string | null;
  age: string | null;
  club: string | null;
  marketValue: string | null;
  nationality: string[];
  url: string | null;
  playerId: string | null;
}

// Filter state for search filters
export interface FilterState {
  position: string;
  club: string;
  minAge: string;
  maxAge: string;
  minValue: string;
  maxValue: string;
}

// Format market value for display
export function formatMarketValue(value: string | null): string {
  if (!value) return '-';
  // If already formatted (from JSON), return as-is
  if (value.startsWith('€')) return value;

  const num = parseInt(value, 10);
  if (isNaN(num) || num === 0) return '-';
  if (num < 1000) return `€${num}`;
  if (num < 1000000) return `€${Math.round(num / 1000)}K`;
  return `€${(num / 1000000).toFixed(1)}M`;
}

// Raw JSON format from Transfermarkt scrape
export interface RawPlayerData {
  Player: [string, string];  // [name, position]
  Age: string;
  Club: string;
  "Market value": string;
  givenUrl: string;
  "Nat.": string | string[];
}
