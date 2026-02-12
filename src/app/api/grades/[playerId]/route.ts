import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

// All attribute keys (ability fields)
const ABILITY_KEYS = [
  'physStrength', 'physSpeed', 'physAgility', 'physCoordination',
  'techControl', 'techShortPasses', 'techLongPasses', 'techAerial',
  'techCrossing', 'techFinishing', 'techDribbling', 'techOneVsOneOffense', 'techOneVsOneDefense',
  'tacPositioning', 'tacTransition', 'tacDecisions', 'tacAnticipations', 'tacDuels', 'tacSetPieces',
] as const;

// Potential keys (ability key + "Pot" suffix)
const POTENTIAL_KEYS = ABILITY_KEYS.map(k => `${k}Pot` as const);

function gradeToResponse(grade: any): Record<string, any> {
  const result: Record<string, any> = {
    playerId: grade.playerId,
    playerName: grade.playerName || '',
    position: grade.position || '',
    club: grade.club || '',
    gradedAt: grade.updatedAt.toISOString(),
    status: grade.status || 'WATCH',
    scoutingLevel: grade.scoutingLevel || 'Basic',
    ability: grade.ability ?? 3,
    potential: grade.potential ?? 4,
    report: grade.report ?? 3,
    scoutingTags: grade.scoutingTags || [],
    verdict: grade.verdict || grade.recommendation || 'Monitor',
    role: grade.role || '',
    conclusion: grade.conclusion || '',
    notes: grade.notes || '',
    transferFee: grade.transferFee || '',
    salary: grade.salary || '',
    scoutName: grade.scoutName,
    scoutId: grade.scoutId,
  };

  for (const key of ABILITY_KEYS) {
    result[key] = (grade as any)[key] ?? 3;
  }
  for (const key of POTENTIAL_KEYS) {
    result[key] = (grade as any)[key] ?? 4;
  }

  return result;
}

// GET grades for a player
// ?scoutId=xxx → returns single grade for that scout
// no scoutId   → returns all grades for that player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params
  const scoutId = request.nextUrl.searchParams.get('scoutId')

  try {
    if (scoutId) {
      // Single grade for this scout
      const grade = await prisma.scoutingReport.findUnique({
        where: { playerId_scoutId: { playerId, scoutId } }
      })
      if (!grade) return NextResponse.json(null)
      return NextResponse.json(gradeToResponse(grade))
    } else {
      // All grades for this player
      const grades = await prisma.scoutingReport.findMany({
        where: { playerId },
        orderBy: { updatedAt: 'desc' }
      })
      if (grades.length === 0) return NextResponse.json(null)
      if (grades.length === 1) return NextResponse.json(gradeToResponse(grades[0]))
      return NextResponse.json(grades.map(gradeToResponse))
    }
  } catch (error) {
    console.error('Failed to fetch grade:', error)
    return NextResponse.json({ error: 'Failed to fetch grade' }, { status: 500 })
  }
}

// POST - save a player's grade (upserts by playerId + scoutId)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params

  try {
    const body = await request.json()
    const scoutId = body.scoutId

    if (!scoutId) {
      return NextResponse.json({ error: 'scoutId is required' }, { status: 400 })
    }

    // Build data object from body
    const data: Record<string, any> = {
      playerName: body.playerName,
      position: body.position,
      club: body.club,
      report: body.report,
      ability: body.ability,
      potential: body.potential,
      scoutingTags: body.scoutingTags || [],
      verdict: body.verdict,
      role: body.role,
      conclusion: body.conclusion,
      notes: body.notes,
      status: body.status,
      scoutingLevel: body.scoutingLevel,
      scoutName: body.scoutName,
      scoutId: scoutId,
      transferFee: body.transferFee,
      salary: body.salary,
    };

    for (const key of ABILITY_KEYS) {
      data[key] = body[key];
    }
    for (const key of POTENTIAL_KEYS) {
      data[key] = body[key];
    }

    const grade = await prisma.scoutingReport.upsert({
      where: { playerId_scoutId: { playerId, scoutId } },
      update: data,
      create: { playerId, ...data },
    })

    return NextResponse.json({ success: true, grade })
  } catch (error) {
    console.error('Failed to save grade:', error)
    return NextResponse.json({ error: 'Failed to save grade' }, { status: 500 })
  }
}

// DELETE (requires scoutId query param)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params
  const scoutId = request.nextUrl.searchParams.get('scoutId')

  if (!scoutId) {
    return NextResponse.json({ error: 'scoutId is required' }, { status: 400 })
  }

  try {
    await prisma.scoutingReport.delete({
      where: { playerId_scoutId: { playerId, scoutId } }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete grade:', error)
    return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 })
  }
}
