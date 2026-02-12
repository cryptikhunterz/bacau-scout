import { NextRequest, NextResponse } from 'next/server';
import { loadPlayers, parseMarketValue, NormalizedPlayer } from '@/lib/players';

function categorizePosition(pos: string | null): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (!pos) return 'MID';
  const p = pos.toLowerCase();
  if (p.includes('goalkeeper')) return 'GK';
  if (p.includes('back') || p.includes('defender') || p.includes('centre-back'))
    return 'DEF';
  if (
    p.includes('midfield') ||
    p.includes('midfielder')
  )
    return 'MID';
  if (
    p.includes('forward') ||
    p.includes('winger') ||
    p.includes('attack') ||
    p.includes('striker')
  )
    return 'FWD';
  return 'MID';
}

function formatValue(num: number): string {
  if (num >= 1_000_000) return `€${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `€${(num / 1_000).toFixed(0)}K`;
  if (num > 0) return `€${num}`;
  return '-';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ club: string }> }
) {
  const { club: clubParam } = await params;
  const clubName = decodeURIComponent(clubParam);

  const players = loadPlayers();
  const squadPlayers = players.filter(
    (p) => p.club && p.club.toLowerCase() === clubName.toLowerCase()
  );

  if (squadPlayers.length === 0) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Aggregate stats
  const squadSize = squadPlayers.length;

  const ages = squadPlayers
    .map((p) => p.ageNum)
    .filter((a): a is number => a !== null);
  const avgAge = ages.length > 0 ? ages.reduce((s, a) => s + a, 0) / ages.length : 0;

  const values = squadPlayers
    .map((p) => p.marketValueNum)
    .filter((v): v is number => v !== null && v > 0);
  const totalMarketValue = values.reduce((s, v) => s + v, 0);
  const avgMarketValue = values.length > 0 ? totalMarketValue / values.length : 0;

  const posBreakdown = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of squadPlayers) {
    posBreakdown[categorizePosition(p.position)]++;
  }

  const totalAppearances = squadPlayers.reduce(
    (s, p) => s + (p.appearances || 0),
    0
  );
  const totalGoals = squadPlayers.reduce((s, p) => s + (p.goals || 0), 0);
  const totalAssists = squadPlayers.reduce((s, p) => s + (p.assists || 0), 0);

  // Find the actual club name (preserving case) from the first player
  const actualClubName = squadPlayers[0].club || clubName;

  // Determine league from most common league in the squad
  const leagueCount = new Map<string, number>();
  for (const p of squadPlayers) {
    if (p.league) {
      leagueCount.set(p.league, (leagueCount.get(p.league) || 0) + 1);
    }
  }
  let league: string | null = null;
  let maxCount = 0;
  for (const [l, c] of leagueCount) {
    if (c > maxCount) {
      league = l;
      maxCount = c;
    }
  }

  // Player list
  const playerList = squadPlayers
    .sort((a, b) => {
      // Sort by position group then name
      const posOrder = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
      const pa = posOrder[categorizePosition(a.position)];
      const pb = posOrder[categorizePosition(b.position)];
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    })
    .map((p) => ({
      name: p.name,
      position: p.position,
      positionGroup: categorizePosition(p.position),
      age: p.ageNum,
      marketValue: p.marketValue,
      marketValueNum: p.marketValueNum,
      appearances: p.appearances,
      goals: p.goals,
      assists: p.assists,
      playerId: p.playerId,
      photoUrl: p.photoUrl,
    }));

  return NextResponse.json({
    club: actualClubName,
    league,
    squadSize,
    avgAge: Math.round(avgAge * 10) / 10,
    avgMarketValue,
    avgMarketValueFormatted: formatValue(avgMarketValue),
    totalMarketValue,
    totalMarketValueFormatted: formatValue(totalMarketValue),
    positionBreakdown: posBreakdown,
    totalAppearances,
    totalGoals,
    totalAssists,
    players: playerList,
  });
}
