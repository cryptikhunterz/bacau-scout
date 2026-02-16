import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { scrapePlayerProfile, extractPlayerIdFromUrl } from '@/lib/scrape-player';
import { clearPlayersCache } from '@/lib/players';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transfermarktUrl } = body;

    if (!transfermarktUrl || typeof transfermarktUrl !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid Transfermarkt URL' },
        { status: 400 }
      );
    }

    // Validate it's a TM URL with a player ID
    if (!transfermarktUrl.includes('transfermarkt') || !transfermarktUrl.includes('spieler')) {
      return NextResponse.json(
        { error: 'Please paste a valid Transfermarkt player URL (must contain /spieler/)' },
        { status: 400 }
      );
    }

    const playerId = extractPlayerIdFromUrl(transfermarktUrl);
    if (!playerId) {
      return NextResponse.json(
        { error: 'Could not extract player ID from URL' },
        { status: 400 }
      );
    }

    // Check if player already exists in ManualPlayer DB
    const existing = await prisma.manualPlayer.findUnique({
      where: { playerId },
    });

    if (existing) {
      return NextResponse.json({
        status: 'exists',
        message: 'Player already in database',
        player: manualPlayerToResponse(existing),
      });
    }

    // Check if player exists in players.json (loaded in memory)
    // We import dynamically to avoid issues with server module
    const { loadPlayers } = await import('@/lib/players');
    const jsonPlayers = loadPlayers();
    const inJson = jsonPlayers.find(p => p.playerId === playerId);

    if (inJson) {
      return NextResponse.json({
        status: 'exists',
        message: 'Player already in database',
        player: {
          player_id: inJson.playerId,
          name: inJson.name,
          position: inJson.position,
          club: inJson.club,
          league: inJson.league,
          market_value: inJson.marketValue,
          age: inJson.ageNum,
        },
      });
    }

    // Scrape the player from Transfermarkt
    console.log(`[AddPlayer] Scraping player ${playerId} from Transfermarkt...`);
    const scraped = await scrapePlayerProfile(playerId);
    console.log(`[AddPlayer] Scraped: ${scraped.name} (${scraped.club || 'no club'})`);

    // Save to ManualPlayer table
    const manual = await prisma.manualPlayer.create({
      data: {
        playerId: scraped.playerId,
        name: scraped.name,
        position: scraped.position,
        age: scraped.age,
        dateOfBirth: scraped.dateOfBirth,
        club: scraped.club,
        clubId: scraped.clubId,
        league: scraped.league,
        leagueCode: scraped.leagueCode,
        marketValue: scraped.marketValue,
        nationality: scraped.nationality,
        citizenship: scraped.citizenship,
        height: scraped.height,
        foot: scraped.foot,
        contractExpires: scraped.contractExpires,
        shirtNumber: scraped.shirtNumber,
        photoUrl: scraped.photoUrl,
        profileUrl: scraped.profileUrl,
        appearances: scraped.appearances,
        goals: scraped.goals,
        assists: scraped.assists,
        addedBy: body.addedBy || null,
      },
    });

    // Clear the in-memory players cache so the new player shows up
    clearPlayersCache();

    console.log(`[AddPlayer] Saved ${scraped.name} (ID: ${playerId}) to ManualPlayer table`);

    return NextResponse.json({
      status: 'added',
      message: `${scraped.name} added successfully`,
      player: manualPlayerToResponse(manual),
    });
  } catch (error: any) {
    console.error('[AddPlayer] Error:', error);

    // Distinguish between scraping errors and other errors
    if (error.message?.includes('Transfermarkt returned')) {
      return NextResponse.json(
        { error: 'Could not fetch player data from Transfermarkt. The page may not exist or TM may be rate limiting. Try again later.' },
        { status: 502 }
      );
    }

    if (error.message?.includes('Could not parse player name')) {
      return NextResponse.json(
        { error: 'Could not parse player data. The URL may not point to a valid player profile.' },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add player. Please try again.' },
      { status: 500 }
    );
  }
}

function manualPlayerToResponse(p: any) {
  return {
    player_id: p.playerId,
    name: p.name,
    position: p.position,
    age: p.age,
    date_of_birth: p.dateOfBirth,
    club: p.club,
    league: p.league,
    market_value: p.marketValue,
    nationality: p.nationality,
    height: p.height,
    foot: p.foot,
    photo_url: p.photoUrl,
    profile_url: p.profileUrl,
  };
}
