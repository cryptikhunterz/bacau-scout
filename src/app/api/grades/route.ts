import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all grades (for dashboard)
export async function GET() {
  try {
    const grades = await prisma.scoutingReport.findMany({
      orderBy: { updatedAt: 'desc' }
    })
    
    // Convert to the format expected by frontend
    const gradesMap: Record<string, any> = {}
    grades.forEach(grade => {
      gradesMap[grade.playerId] = {
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
      }
    })
    
    return NextResponse.json(gradesMap)
  } catch (error) {
    console.error('Failed to fetch grades:', error)
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}
