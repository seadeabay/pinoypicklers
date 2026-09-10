import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['player', 'spectator']).default('spectator'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role } = schema.parse(body)

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
    })

    // Create player profile for player role
    if (role === 'player') {
      await prisma.player.create({
        data: { userId: user.id, name },
      })
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Registration failed' }, { status: 400 })
  }
}
