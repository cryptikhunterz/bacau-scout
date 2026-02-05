import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

// GET a specific player's grade
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params

  try {
    const grade = await prisma.scoutingReport.findUnique({
      where: { playerId }
    })

    if (!grade) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      playerId: grade.playerId,
      gradedAt: grade.updatedAt.toISOString(),

      // Status
      status: grade.status || 'WATCH',
      scoutingLevel: grade.scoutingLevel || 'Basic',

      // Ability & Potential
      ability: grade.ability || 3,
      potential: grade.potential || 4,
      report: grade.report || 3,

      // Physical
      physStrength: grade.physStrength || 3,
      physSpeed: grade.physSpeed || 3,
      physAgility: grade.physAgility || 3,
      physCoordination: grade.physCoordination || 3,

      // Technique
      techControl: grade.techControl || 3,
      techShortPasses: grade.techShortPasses || 3,
      techLongPasses: grade.techLongPasses || 3,
      techAerial: grade.techAerial || 3,
      techCrossing: grade.techCrossing || 3,
      techFinishing: grade.techFinishing || 3,
      techDribbling: grade.techDribbling || 3,
      techOneVsOneOffense: grade.techOneVsOneOffense || 3,
      techOneVsOneDefense: grade.techOneVsOneDefense || 3,

      // Tactic
      tacPositioning: grade.tacPositioning || 3,
      tacTransition: grade.tacTransition || 3,
      tacDecisions: grade.tacDecisions || 3,
      tacAnticipations: grade.tacAnticipations || 3,
      tacDuels: grade.tacDuels || 3,
      tacSetPieces: grade.tacSetPieces || 3,

      // Tags
      scoutingTags: grade.scoutingTags || [],
      strengths: grade.strengths || [],
      weaknesses: grade.weaknesses || [],

      // Verdict & text fields
      verdict: grade.verdict || grade.recommendation || 'Monitor',
      role: grade.role || '',
      conclusion: grade.conclusion || '',
      notes: grade.notes || '',

      // Transfer info
      transferFee: grade.transferFee || '',
      salary: grade.salary || '',

      scoutName: grade.scoutName,
    })
  } catch (error) {
    console.error('Failed to fetch grade:', error)
    return NextResponse.json({ error: 'Failed to fetch grade' }, { status: 500 })
  }
}

// POST/PUT - save a player's grade
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params

  try {
    const body = await request.json()

    const data = {
      // Ability & Potential
      ability: body.ability,
      potential: body.potential,
      report: body.report,

      // Physical
      physStrength: body.physStrength,
      physSpeed: body.physSpeed,
      physAgility: body.physAgility,
      physCoordination: body.physCoordination,

      // Technique
      techControl: body.techControl,
      techShortPasses: body.techShortPasses,
      techLongPasses: body.techLongPasses,
      techAerial: body.techAerial,
      techCrossing: body.techCrossing,
      techFinishing: body.techFinishing,
      techDribbling: body.techDribbling,
      techOneVsOneOffense: body.techOneVsOneOffense,
      techOneVsOneDefense: body.techOneVsOneDefense,

      // Tactic
      tacPositioning: body.tacPositioning,
      tacTransition: body.tacTransition,
      tacDecisions: body.tacDecisions,
      tacAnticipations: body.tacAnticipations,
      tacDuels: body.tacDuels,
      tacSetPieces: body.tacSetPieces,

      // Tags
      scoutingTags: body.scoutingTags || [],
      strengths: body.strengths || [],
      weaknesses: body.weaknesses || [],

      // Verdict
      verdict: body.verdict,

      // Text fields
      role: body.role,
      conclusion: body.conclusion,
      notes: body.notes,

      // Metadata
      status: body.status,
      scoutingLevel: body.scoutingLevel,
      scoutName: body.scoutName,
      transferFee: body.transferFee,
      salary: body.salary,
    }

    const grade = await prisma.scoutingReport.upsert({
      where: { playerId },
      update: data,
      create: { playerId, ...data },
    })

    return NextResponse.json({ success: true, grade })
  } catch (error) {
    console.error('Failed to save grade:', error)
    return NextResponse.json({ error: 'Failed to save grade' }, { status: 500 })
  }
}

// DELETE - remove a player's grade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params

  try {
    await prisma.scoutingReport.delete({
      where: { playerId }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete grade:', error)
    return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 })
  }
}
