/**
 * Server-side Transfermarkt player profile scraper.
 * Extracts player data from a TM profile page.
 */

export interface ScrapedPlayer {
  playerId: string;
  name: string;
  position: string | null;
  age: number | null;
  dateOfBirth: string | null;
  club: string | null;
  clubId: string | null;
  league: string | null;
  leagueCode: string | null;
  marketValue: string | null;
  nationality: string | null;
  citizenship: string | null;
  height: string | null;
  foot: string | null;
  contractExpires: string | null;
  shirtNumber: string | null;
  photoUrl: string | null;
  profileUrl: string;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Extract player ID from any Transfermarkt URL (.com, .de, .ro, .pt, etc.)
 */
export function extractPlayerIdFromUrl(url: string): string | null {
  const match = url.match(/spieler\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Normalize a TM URL to the .com English version profile URL
 */
function normalizeProfileUrl(playerId: string): string {
  return `https://www.transfermarkt.com/any/profil/spieler/${playerId}`;
}

/**
 * Simple HTML text extractor — gets text content between tags
 */
function textBetween(html: string, startMarker: string, endMarker: string): string | null {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;
  const afterStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, afterStart);
  if (endIdx === -1) return null;
  return html.substring(afterStart, endIdx).trim();
}

/**
 * Strip HTML tags from a string
 */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Scrape a player profile from Transfermarkt
 */
export async function scrapePlayerProfile(playerId: string): Promise<ScrapedPlayer> {
  const profileUrl = normalizeProfileUrl(playerId);

  const response = await fetch(profileUrl, {
    headers: HEADERS,
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Transfermarkt returned ${response.status} for player ${playerId}`);
  }

  const html = await response.text();

  // Extract player name from the header
  const name = extractName(html);
  if (!name) {
    throw new Error(`Could not parse player name for ID ${playerId}`);
  }

  // Extract info table fields
  const position = extractInfoField(html, 'Position:') || extractInfoField(html, 'Main position:');
  const dateOfBirth = extractInfoField(html, 'Date of birth:') || extractInfoField(html, 'Date of birth/Age:');
  const height = extractInfoField(html, 'Height:');
  const foot = extractInfoField(html, 'Foot:');
  const citizenship = extractInfoField(html, 'Citizenship:');
  const contractExpires = extractInfoField(html, 'Contract expires:');

  // Extract age from DOB string like "Feb 5, 2000 (25)"
  let age: number | null = null;
  if (dateOfBirth) {
    const ageMatch = dateOfBirth.match(/\((\d+)\)/);
    if (ageMatch) age = parseInt(ageMatch[1], 10);
  }

  // Extract current club
  const club = extractClub(html);
  const clubId = extractClubId(html);

  // Extract league info from header
  const league = extractLeague(html);

  // Extract market value
  const marketValue = extractMarketValue(html);

  // Extract nationality from flag images
  const nationality = extractNationality(html);

  // Extract photo
  const photoUrl = extractPhoto(html);

  // Extract shirt number
  const shirtNumber = extractShirtNumber(html);

  return {
    playerId,
    name,
    position: position ? cleanPosition(position) : null,
    age,
    dateOfBirth: dateOfBirth ? dateOfBirth.replace(/\s*\(\d+\)\s*$/, '').trim() : null,
    club,
    clubId,
    league,
    leagueCode: null, // Can't reliably extract from profile page
    marketValue,
    nationality,
    citizenship,
    height,
    foot: foot ? foot.toLowerCase() : null,
    contractExpires,
    shirtNumber,
    photoUrl,
    profileUrl,
    appearances: null, // Would need additional page fetch
    goals: null,
    assists: null,
  };
}

function extractName(html: string): string | null {
  // Try the data-header headline
  const headerMatch = html.match(/<h1[^>]*class="data-header__headline-wrapper"[^>]*>([\s\S]*?)<\/h1>/i);
  if (headerMatch) {
    const raw = stripTags(headerMatch[1]).replace(/\s+/g, ' ').trim();
    // Remove shirt number prefix like "#7 "
    return raw.replace(/^#\d+\s*/, '').trim() || null;
  }

  // Fallback: og:title
  const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogMatch) {
    // og:title is usually "Player Name - Profile" or just "Player Name"
    return ogMatch[1].split(' - ')[0].trim() || null;
  }

  return null;
}

function extractInfoField(html: string, label: string): string | null {
  // TM uses: <span class="info-table__content--regular">Label</span>
  //          <span class="info-table__content--bold">Value</span>
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `info-table__content--regular[^>]*>[^<]*${escapedLabel}[\\s\\S]*?info-table__content--bold[^>]*>([\\s\\S]*?)<\\/span>`,
    'i'
  );
  const match = html.match(pattern);
  if (match) {
    return stripTags(match[1]).replace(/\s+/g, ' ').trim() || null;
  }
  return null;
}

function extractClub(html: string): string | null {
  // Look for data-header__club
  const match = html.match(/<span[^>]*class="data-header__club"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
  if (match) return match[1].trim();
  return null;
}

function extractClubId(html: string): string | null {
  const match = html.match(/<span[^>]*class="data-header__club"[^>]*>[\s\S]*?<a[^>]*href="[^"]*\/verein\/(\d+)/i);
  if (match) return match[1];
  return null;
}

function extractLeague(html: string): string | null {
  // League usually appears in the data-header breadcrumb area
  const match = html.match(/<span[^>]*class="data-header__league"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
  if (match) return match[1].trim();
  return null;
}

function extractMarketValue(html: string): string | null {
  // Look for the market value in the waarde section
  const match = html.match(/<a[^>]*class="data-header__market-value-wrapper"[^>]*>([\s\S]*?)<\/a>/i);
  if (match) {
    const raw = stripTags(match[1]).replace(/\s+/g, ' ').trim();
    // Extract the value part (e.g., "€500k", "€1.20m")
    const valueMatch = raw.match(/€[\d.,]+[km]?/i);
    if (valueMatch) return valueMatch[0];
    // Try without euro sign
    const numMatch = raw.match(/[\d.,]+\s*[km]/i);
    if (numMatch) return '€' + numMatch[0].trim();
  }
  return null;
}

function extractNationality(html: string): string | null {
  // Get nationality from info table flag images
  const natSection = html.match(/info-table__content--regular[^>]*>\s*Citizenship:[\s\S]*?info-table__content--bold[^>]*>([\s\S]*?)<\/span>/i);
  if (natSection) {
    // Look for flag image title
    const flagMatch = natSection[1].match(/<img[^>]*title="([^"]+)"/i);
    if (flagMatch) return flagMatch[1].trim();
    // Fallback to text content
    return stripTags(natSection[1]).trim() || null;
  }
  return null;
}

function extractPhoto(html: string): string | null {
  // Player photo in the data-header
  const match = html.match(/<img[^>]*class="data-header__profile-image"[^>]*src="([^"]+)"/i);
  if (match) return match[1];
  // Try data-src
  const match2 = html.match(/<img[^>]*class="data-header__profile-image"[^>]*data-src="([^"]+)"/i);
  if (match2) return match2[1];
  return null;
}

function extractShirtNumber(html: string): string | null {
  const match = html.match(/<span[^>]*class="data-header__shirt-number"[^>]*>([^<]*)<\/span>/i);
  if (match) {
    const num = match[1].replace('#', '').trim();
    return num || null;
  }
  return null;
}

function cleanPosition(position: string): string {
  // Normalize position names to match our existing data format
  return position
    .replace(/\s+/g, ' ')
    .trim();
}
