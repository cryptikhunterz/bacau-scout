import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { loadPlayers } from '@/lib/players'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

// GET all grades (for dashboard)
export async function GET() {
  try {
    const grades = await prisma.scoutingReport.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    // Load player data for backfilling missing info
    const players = loadPlayers()
    const playerMap = new Map(players.map(p => [p.playerId, p]))

    // Return as array of grade objects
    const results = grades.map(grade => {
      // Backfill from static data if DB fields are empty
      const player = playerMap.get(grade.playerId)
      const playerName = grade.playerName || player?.name || ''
      const position = grade.position || player?.position || ''
      const club = grade.club || player?.club || ''

      return {
      playerId: grade.playerId,
      playerName,
      position,
      club,
      gradedAt: grade.updatedAt.toISOString(),

      status: grade.status || 'WATCH',
      scoutingLevel: grade.scoutingLevel || 'Basic',

      ability: grade.ability ?? 3,
      potential: grade.potential ?? 4,
      report: grade.report ?? 3,

      physStrength: grade.physStrength ?? 3,
      physSpeed: grade.physSpeed ?? 3,
      physAgility: grade.physAgility ?? 3,
      physCoordination: grade.physCoordination ?? 3,

      techControl: grade.techControl ?? 3,
      techShortPasses: grade.techShortPasses ?? 3,
      techLongPasses: grade.techLongPasses ?? 3,
      techAerial: grade.techAerial ?? 3,
      techCrossing: grade.techCrossing ?? 3,
      techFinishing: grade.techFinishing ?? 3,
      techDribbling: grade.techDribbling ?? 3,
      techOneVsOneOffense: grade.techOneVsOneOffense ?? 3,
      techOneVsOneDefense: grade.techOneVsOneDefense ?? 3,

      tacPositioning: grade.tacPositioning ?? 3,
      tacTransition: grade.tacTransition ?? 3,
      tacDecisions: grade.tacDecisions ?? 3,
      tacAnticipations: grade.tacAnticipations ?? 3,
      tacDuels: grade.tacDuels ?? 3,
      tacSetPieces: grade.tacSetPieces ?? 3,

      scoutingTags: grade.scoutingTags || [],
      strengths: grade.strengths || [],
      weaknesses: grade.weaknesses || [],

      verdict: grade.verdict || grade.recommendation || 'Monitor',
      role: grade.role || '',
      conclusion: grade.conclusion || '',
      notes: grade.notes || '',

      transferFee: grade.transferFee || '',
      salary: grade.salary || '',
      scoutName: grade.scoutName,
      scoutId: grade.scoutId,
      }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Failed to fetch grades:', error)
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}
