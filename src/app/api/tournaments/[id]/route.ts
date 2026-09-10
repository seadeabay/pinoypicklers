import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const t = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        teams: {
          include: { players: { include: { player: true } } },
          orderBy: [{ points: 'desc' }, { wins: 'desc' }],
        },
        matches: {
          include: {
            team1: { include: { players: { include: { player: true } } } },
            team2: { include: { players: { include: { player: true } } } },
            winner: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(t)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const t = await prisma.tournament.update({ where: { id: params.id }, data: body })
    return NextResponse.json(t)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await prisma.tournament.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
