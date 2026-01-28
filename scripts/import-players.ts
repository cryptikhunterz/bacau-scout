import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Player type for database
interface Player {
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
}

// Parse market value string to EUR (€2.00m -> 2000000, €900k -> 900000)
function parseMarketValue(value: string | undefined): number {
  if (!value) return 0;

  const cleaned = value.replace('€', '').trim();
  const match = cleaned.match(/^([\d.]+)(m|k)?$/i);

  if (!match) return 0;

  const num = parseFloat(match[1]);
  const suffix = match[2]?.toLowerCase();

  if (suffix === 'm') return Math.round(num * 1000000);
  if (suffix === 'k') return Math.round(num * 1000);
  return Math.round(num);
}

// Parse age from "Date of birth/Age" format: "15/05/2002 (23)"
function parseAge(value: string | undefined): number | null {
  if (!value) return null;

  // Try to extract age from parentheses
  const ageMatch = value.match(/\((\d+)\)/);
  if (ageMatch) return parseInt(ageMatch[1], 10);

  // Try plain number
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

// Parse date of birth from "15/05/2002 (23)" format
function parseDateOfBirth(value: string | undefined): string | null {
  if (!value) return null;

  // Extract date part before parentheses
  const dateMatch = value.match(/^(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) return dateMatch[1];

  return null;
}

// Extract name from URL if needed
function extractNameFromUrl(url: string): string {
  // URL format: https://www.transfermarkt.com/coli-saco/profil/spieler/820633
  const match = url.match(/transfermarkt\.com\/([^/]+)\//);
  if (match) {
    return match[1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return 'Unknown';
}

// Generate unique ID
function generateId(name: string, club: string, index: number): string {
  const slug = `${name}-${club}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-${index}`;
}

// Transform raw data to Player type (handles both formats)
function transformPlayer(raw: Record<string, unknown>, index: number): Player | null {
  try {
    // Check which format this record is
    const hasPlayerArray = Array.isArray(raw.Player);
    const hasProfileFormat = raw.id && raw.type === 'player';

    let name: string;
    let position: string | null;
    let age: number | null;
    let dateOfBirth: string | null;
    let club: string | null;
    let marketValueRaw: string | null;
    let nationality: string[];
    let tmUrl: string | null;

    if (hasPlayerArray) {
      // List format
      const playerArr = raw.Player as [string, string];
      name = playerArr[0] || '';
      position = playerArr[1] || null;
      age = raw.Age ? parseInt(raw.Age as string, 10) : null;
      dateOfBirth = null;
      club = (raw.Club as string) || null;
      marketValueRaw = (raw['Market value'] as string) || null;
      tmUrl = (raw.givenUrl as string) || null;

      // Handle nationality
      const nat = raw['Nat.'];
      nationality = Array.isArray(nat) ? nat : nat ? [nat as string] : [];
    } else if (hasProfileFormat) {
      // Profile format
      const url = (raw.url as string) || (raw.givenUrl as string) || '';
      name = extractNameFromUrl(url);
      position = (raw.Position as string) || null;
      age = parseAge(raw['Date of birth/Age'] as string);
      dateOfBirth = parseDateOfBirth(raw['Date of birth/Age'] as string);
      club = (raw['Current club'] as string) || null;
      marketValueRaw = null; // Profile format doesn't have market value in same field
      tmUrl = url || null;

      // Handle citizenship as nationality
      const cit = raw.Citizenship;
      nationality = Array.isArray(cit) ? cit : cit ? [cit as string] : [];
    } else {
      // Unknown format - skip
      console.warn(`Skipping unknown format at index ${index}`);
      return null;
    }

    // Skip if no name
    if (!name) {
      console.warn(`Skipping player with no name at index ${index}`);
      return null;
    }

    return {
      id: (raw.id as string) || generateId(name, club || '', index),
      tm_url: tmUrl,
      name,
      position,
      age,
      date_of_birth: dateOfBirth,
      current_club: club,
      market_value_raw: marketValueRaw,
      market_value_eur: parseMarketValue(marketValueRaw || undefined),
      nationality,
      image_url: null,
      raw_data: raw,
    };
  } catch (err) {
    console.warn(`Error transforming player at index ${index}:`, err);
    return null;
  }
}

async function importPlayers() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create Supabase client with service role key for insert
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read JSON file
  const jsonPath = path.join(process.cwd(), 'Bacau scout prototype ', 'JSON 2.json');

  console.log(`Reading JSON from: ${jsonPath}`);

  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  const rawData: Record<string, unknown>[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Found ${rawData.length} records in JSON`);

  // Transform all players (filter out nulls)
  const players = rawData
    .map((raw, index) => transformPlayer(raw, index))
    .filter((p): p is Player => p !== null);

  console.log(`Transformed ${players.length} valid players`);

  // Batch insert (100 at a time)
  const BATCH_SIZE = 100;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('players')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`Imported ${imported}/${players.length} players...`);
    }
  }

  console.log(`\nImport complete!`);
  console.log(`- Total records: ${rawData.length}`);
  console.log(`- Valid players: ${players.length}`);
  console.log(`- Imported: ${imported}`);
  console.log(`- Errors: ${errors}`);
}

importPlayers().catch(console.error);
