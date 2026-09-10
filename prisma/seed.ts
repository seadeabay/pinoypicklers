import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pinoypicklers.com' },
    update: {},
    create: {
      email: 'admin@pinoypicklers.com',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  })
  console.log('✅ Admin user:', admin.email)

  // Create sample players
  const playerData = [
    { name: 'Juan dela Cruz', rating: 4 },
    { name: 'Maria Santos', rating: 5 },
    { name: 'Pedro Reyes', rating: 3 },
    { name: 'Ana Garcia', rating: 4 },
    { name: 'Jose Mendoza', rating: 2 },
    { name: 'Rosa Villanueva', rating: 3 },
  ]

  const colors = ['#5fcf7a','#f5c842','#3b82f6','#f472b6','#a78bfa','#fb923c']
  for (let i = 0; i < playerData.length; i++) {
    const p = playerData[i]
    await prisma.player.upsert({
      where: { id: `seed-player-${i}` },
      update: {},
      create: {
        id: `seed-player-${i}`,
        name: p.name,
        rating: p.rating,
        avatarColor: colors[i % colors.length],
      },
    })
  }
  console.log('✅ Sample players created')

  console.log('Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
