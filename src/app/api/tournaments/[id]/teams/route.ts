import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateRoundRobinMatches } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  player1Name: z.string().min(1),
  player2Name: z.string().min(1),
  player1Id: z.string().optional(),
  player2Id: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, player1Name, player2Name, player1Id, player2Id } = schema.parse(body)

    // Get or create players
    async function getOrCreatePlayer(pid?: string, pname?: string) {
      if (pid) {
        const p = await prisma.player.findUnique({ where: { id: pid } })
        if (p) return p
      }
      return prisma.player.create({ data: { name: pname! } })
    }

    const p1 = await getOrCreatePlayer(player1Id, player1Name)
    const p2 = await getOrCreatePlayer(player2Id, player2Name)

    // Create team
    const team = await prisma.tournamentTeam.create({
      data: {
        tournamentId: params.id,
        name,
        players: {
          create: [
            { playerId: p1.id },
            { playerId: p2.id },
          ],
        },
      },
      include: { players: { include: { player: true } } },
    })

    // Regenerate all matches for this tournament
    const allTeams = await prisma.tournamentTeam.findMany({
      where: { tournamentId: params.id },
    })

    // Delete old unplayed matches and recreate
    await prisma.match.deleteMany({
      where: { tournamentId: params.id, completed: false },
    })

    const matchPairs = generateRoundRobinMatches(allTeams.map(t => t.id))
    await prisma.match.createMany({
      data: matchPairs.map(m => ({ ...m, tournamentId: params.id })),
    })

    return NextResponse.json(team, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await req.json()
    await prisma.tournamentTeam.delete({ where: { id: teamId } })

    // Regenerate matches
    const allTeams = await prisma.tournamentTeam.findMany({
      where: { tournamentId: params.id },
    })
    await prisma.match.deleteMany({
      where: { tournamentId: params.id, completed: false },
    })
    if (allTeams.length >= 2) {
      const matchPairs = generateRoundRobinMatches(allTeams.map(t => t.id))
      await prisma.match.createMany({
        data: matchPairs.map(m => ({ ...m, tournamentId: params.id })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
