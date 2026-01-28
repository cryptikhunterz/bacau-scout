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

// Raw JSON format from Transfermarkt scrape
export interface RawPlayerData {
  Player: [string, string];  // [name, position]
  Age: string;
  Club: string;
  "Market value": string;
  givenUrl: string;
  "Nat.": string | string[];
}
