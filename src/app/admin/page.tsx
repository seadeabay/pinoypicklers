import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AdminUserTable } from '@/components/ui/AdminUserTable'

export default async function AdminPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const [users, players, tournaments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.player.count(),
    prisma.tournament.count(),
  ])

  const stats = [
    { label: 'Users', value: users.length, icon: '👤', color: 'text-blue-400' },
    { label: 'Players', value: players, icon: '🏓', color: 'text-brand-green' },
    { label: 'Tournaments', value: tournaments, icon: '🏆', color: 'text-yellow-400' },
    { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: '👑', color: 'text-purple-400' },
  ]

  return (
    <div className="page-gradient min-h-screen pb-20">
      <div className="bg-black/25 backdrop-blur-md border-b border-white/8 px-4 py-5">
        <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/60 mb-1 block">← Dashboard</Link>
        <div className="text-xl font-bold text-white">👑 Admin Panel</div>
        <div className="text-xs text-white/40 mt-1">Manage users & roles</div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map(s => (
            <div key={s.label} className="glass-card p-3 text-center rounded-xl">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-white/40 text-[10px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* User table */}
        <div>
          <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">All Users</div>
          <AdminUserTable users={users} />
        </div>
      </div>
    </div>
  )
}
