import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { CreateTournamentButton } from '@/components/tournament/CreateTournamentButton'

export default async function TournamentsPage() {
  const session = await auth()
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      teams: true,
      matches: true,
      _count: { select: { teams: true, matches: true } },
    },
  })
  const isAdmin = session?.user?.role === 'admin'

  return (
    <div className="page-gradient min-h-screen pb-20">
      <div className="bg-black/25 backdrop-blur-md border-b border-white/8 px-4 py-5 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/60 mb-1 block">← Dashboard</Link>
          <div className="text-xl font-bold text-white">🏆 Tournaments</div>
          <div className="text-xs text-white/40 mt-1">{tournaments.length} total</div>
        </div>
        {isAdmin && <CreateTournamentButton />}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {tournaments.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="text-4xl mb-3">🏆</div>
            <div className="text-white/60 text-sm">No tournaments yet</div>
            {isAdmin && <div className="text-white/40 text-xs mt-1">Create your first tournament above</div>}
          </div>
        ) : (
          tournaments.map(t => {
            const completed = t.matches.filter(m => m.completed).length
            const statusColor = t.status === 'active' ? 'text-yellow-400' : t.status === 'completed' ? 'text-brand-green' : 'text-white/40'
            const leader = [...t.teams].sort((a, b) => b.points - a.points)[0]
            return (
              <Link key={t.id} href={`/dashboard/tournaments/${t.id}`} className="glass-card-hover block p-4 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🏆</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-base truncate">{t.name}</span>
                      <span className={`text-xs font-bold uppercase ${statusColor}`}>
                        {t.status === 'active' ? '🔴 LIVE' : t.status === 'completed' ? '✅ DONE' : 'DRAFT'}
                      </span>
                    </div>
                    <div className="text-white/40 text-xs mb-2">
                      {t.location}{t.location && t.date ? ' · ' : ''}{t.date ? formatDate(t.date) : ''}
                    </div>
                    <div className="flex gap-4 text-xs text-white/50">
                      <span>👥 {t._count.teams} teams</span>
                      <span>🎾 {completed}/{t._count.matches} matches</span>
                      {leader && leader.wins > 0 && <span className="text-yellow-400">👑 {leader.name}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
