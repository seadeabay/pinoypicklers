import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: [{ totalWins: 'desc' }, { name: 'asc' }],
      include: { user: { select: { email: true, role: true } } },
    })
    return NextResponse.json(players)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const player = await prisma.player.create({
      data: {
        name: body.name,
        nickname: body.nickname,
        rating: body.rating ?? 3,
        avatarColor: body.avatarColor ?? '#5fcf7a',
      },
    })
    return NextResponse.json(player, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
