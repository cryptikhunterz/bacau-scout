import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      metrics: {
        ballControl: grade.ballControl,
        passing: grade.passing,
        dribbling: grade.dribbling,
        finishing: grade.finishing,
        pace: grade.pace,
        stamina: grade.stamina,
        strength: grade.strength,
        positioning: grade.positioning,
        movement: grade.movement,
        creativity: grade.creativity,
        decisionMaking: grade.decisionMaking,
        workRate: grade.workRate,
        discipline: grade.discipline,
      },
      recommendation: grade.recommendation,
      strengths: grade.strengths,
      weaknesses: grade.weaknesses,
      notes: grade.notes,
      scoutName: grade.scoutName,
      updatedAt: grade.updatedAt.toISOString(),
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
    const { metrics, recommendation, strengths, weaknesses, notes, scoutName } = body
    
    const grade = await prisma.scoutingReport.upsert({
      where: { playerId },
      update: {
        ballControl: metrics?.ballControl,
        passing: metrics?.passing,
        dribbling: metrics?.dribbling,
        finishing: metrics?.finishing,
        pace: metrics?.pace,
        stamina: metrics?.stamina,
        strength: metrics?.strength,
        positioning: metrics?.positioning,
        movement: metrics?.movement,
        creativity: metrics?.creativity,
        decisionMaking: metrics?.decisionMaking,
        workRate: metrics?.workRate,
        discipline: metrics?.discipline,
        recommendation,
        strengths: strengths || [],
        weaknesses: weaknesses || [],
        notes,
        scoutName,
      },
      create: {
        playerId,
        ballControl: metrics?.ballControl,
        passing: metrics?.passing,
        dribbling: metrics?.dribbling,
        finishing: metrics?.finishing,
        pace: metrics?.pace,
        stamina: metrics?.stamina,
        strength: metrics?.strength,
        positioning: metrics?.positioning,
        movement: metrics?.movement,
        creativity: metrics?.creativity,
        decisionMaking: metrics?.decisionMaking,
        workRate: metrics?.workRate,
        discipline: metrics?.discipline,
        recommendation,
        strengths: strengths || [],
        weaknesses: weaknesses || [],
        notes,
        scoutName,
      },
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
