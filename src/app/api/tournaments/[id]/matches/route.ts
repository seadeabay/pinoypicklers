import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  matchId: z.string(),
  winnerId: z.string(),
  score1: z.number().optional(),
  score2: z.number().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { matchId, winnerId, score1, score2 } = schema.parse(body)

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    // Undo previous result if re-recording
    if (match.completed && match.winnerId) {
      const loserId = match.winnerId === match.team1Id ? match.team2Id : match.team1Id
      await prisma.tournamentTeam.update({
        where: { id: match.winnerId },
        data: { wins: { decrement: 1 }, points: { decrement: 2 }, matchesPlayed: { decrement: 1 } },
      })
      await prisma.tournamentTeam.update({
        where: { id: loserId },
        data: { losses: { decrement: 1 }, points: { decrement: 1 }, matchesPlayed: { decrement: 1 } },
      })
    }

    const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id

    // Update match
    await prisma.match.update({
      where: { id: matchId },
      data: { winnerId, score1, score2, completed: true, completedAt: new Date() },
    })

    // Update team stats
    await prisma.tournamentTeam.update({
      where: { id: winnerId },
      data: { wins: { increment: 1 }, points: { increment: 2 }, matchesPlayed: { increment: 1 } },
    })
    await prisma.tournamentTeam.update({
      where: { id: loserId },
      data: { losses: { increment: 1 }, points: { increment: 1 }, matchesPlayed: { increment: 1 } },
    })

    // Update player all-time stats
    const winTeam = await prisma.tournamentTeam.findUnique({
      where: { id: winnerId }, include: { players: { include: { player: true } } },
    })
    const loseTeam = await prisma.tournamentTeam.findUnique({
      where: { id: loserId }, include: { players: { include: { player: true } } },
    })

    for (const tp of winTeam?.players || []) {
      await prisma.player.update({ where: { id: tp.playerId }, data: { totalWins: { increment: 1 } } })
    }
    for (const tp of loseTeam?.players || []) {
      await prisma.player.update({ where: { id: tp.playerId }, data: { totalLosses: { increment: 1 } } })
    }

    // Check if tournament is complete
    const remaining = await prisma.match.count({
      where: { tournamentId: params.id, completed: false },
    })
    if (remaining === 0) {
      await prisma.tournament.update({
        where: { id: params.id }, data: { status: 'completed' },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
