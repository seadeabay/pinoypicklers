import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getRoleBadge } from '@/lib/utils'
import { SignOutButton } from '@/components/ui/SignOutButton'

export default async function DashboardPage() {
  const session = await auth()
  const [tournaments, players, recentMatches] = await Promise.all([
    prisma.tournament.findMany({ orderBy: { createdAt: 'desc' }, take: 5,
      include: { _count: { select: { teams: true, matches: true } } } }),
    prisma.player.findMany({ orderBy: { totalWins: 'desc' }, take: 5 }),
    prisma.match.findMany({ where: { completed: true }, orderBy: { completedAt: 'desc' }, take: 5,
      include: { tournament: true, team1: true, team2: true, winner: true } }),
  ])

  const activeTournaments = tournaments.filter(t => t.status === 'active')
  const role = session?.user?.role || 'spectator'

  return (
    <div className="page-gradient min-h-screen pb-20">
      {/* Header */}
      <div className="bg-black/25 backdrop-blur-md border-b border-white/8 px-4 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-[4px] text-brand-green uppercase mb-1">
              PinoyPicklers by Giftists
            </div>
            <div className="text-xl font-bold text-white">🏓 Dashboard</div>
            <div className="text-xs text-white/40 mt-1">
              {session?.user?.name} · {getRoleBadge(role)}
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>

      <div className="px-4 space-y-5 mt-4">

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/queue" className="glass-card-hover p-4 text-center rounded-2xl">
            <div className="text-3xl mb-2">🏟️</div>
            <div className="font-bold text-brand-green text-sm">Queue Play</div>
            <div className="text-white/40 text-xs mt-1">Paddle stacking</div>
          </Link>
          <Link href="/dashboard/tournaments" className="glass-card-hover p-4 text-center rounded-2xl">
            <div className="text-3xl mb-2">🏆</div>
            <div className="font-bold text-yellow-400 text-sm">Tournaments</div>
            <div className="text-white/40 text-xs mt-1">Round robin</div>
          </Link>
          <Link href="/dashboard/players" className="glass-card-hover p-4 text-center rounded-2xl">
            <div className="text-3xl mb-2">👥</div>
            <div className="font-bold text-blue-400 text-sm">Players</div>
            <div className="text-white/40 text-xs mt-1">All-time stats</div>
          </Link>
          {role === 'admin' && (
            <Link href="/admin" className="glass-card-hover p-4 text-center rounded-2xl">
              <div className="text-3xl mb-2">👑</div>
              <div className="font-bold text-yellow-400 text-sm">Admin</div>
              <div className="text-white/40 text-xs mt-1">Manage users</div>
            </Link>
          )}
        </div>

        {/* Active Tournaments */}
        {activeTournaments.length > 0 && (
          <section>
            <div className="text-xs font-bold text-white/60 tracking-wider uppercase mb-3">
              🔴 Live Tournaments
            </div>
            {activeTournaments.map(t => (
              <Link key={t.id} href={`/dashboard/tournaments/${t.id}`}
                className="glass-card-hover flex items-center gap-3 p-3 rounded-xl mb-2">
                <div className="text-2xl">🏆</div>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs">{t._count.teams} teams · {t._count.matches} matches</div>
                </div>
                <span className="badge-yellow">LIVE</span>
              </Link>
            ))}
          </section>
        )}

        {/* Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-white/60 tracking-wider uppercase">
              🏅 All-Time Leaders
            </div>
            <Link href="/dashboard/players" className="text-xs text-brand-green">View all →</Link>
          </div>
          <div className="glass-card p-3 space-y-2">
            {players.length === 0 ? (
              <div className="text-center text-white/30 text-sm py-4">No players yet</div>
            ) : (
              players.map((p, i) => {
                const total = p.totalWins + p.totalLosses
                const pct = total > 0 ? Math.round((p.totalWins / total) * 100) : null
                const medals = ['🥇','🥈','🥉']
                return (
                  <div key={p.id} className="flex items-center gap-3 py-1">
                    <span className="text-base w-6 text-center">{medals[i] ?? i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white truncate">{p.name}</div>
                    </div>
                    <span className="text-brand-green font-bold text-sm">{p.totalWins}W</span>
                    <span className="text-red-400 text-sm">{p.totalLosses}L</span>
                    {pct !== null && (
                      <span className={`text-xs font-bold ${pct >= 50 ? 'text-brand-green' : 'text-red-400'}`}>
                        {pct}%
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Recent Results */}
        {recentMatches.length > 0 && (
          <section>
            <div className="text-xs font-bold text-white/60 tracking-wider uppercase mb-3">
              ✅ Recent Results
            </div>
            {recentMatches.map(m => (
              <div key={m.id} className="glass-card p-3 mb-2 rounded-xl">
                <div className="text-xs text-white/40 mb-1">{m.tournament.name}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`font-bold ${m.winner?.id === m.team1.id ? 'text-brand-green' : 'text-white/50'}`}>
                    {m.team1.name}
                  </span>
                  {m.score1 != null && m.score2 != null && (
                    <span className="text-yellow-400 font-bold text-xs">{m.score1}–{m.score2}</span>
                  )}
                  <span className={`font-bold ${m.winner?.id === m.team2.id ? 'text-brand-green' : 'text-white/50'}`}>
                    {m.team2.name}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
