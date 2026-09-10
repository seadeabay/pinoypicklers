import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getStandings } from '@/lib/utils'
import { TournamentTabs } from '@/components/tournament/TournamentTabs'

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const tournament = await prisma.tournament.findUnique({
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

  if (!tournament) notFound()

  const isAdmin = session?.user?.role === 'admin'
  const completed = tournament.matches.filter(m => m.completed).length
  const total = tournament.matches.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const standings = getStandings(tournament.teams as any[])

  return (
    <div className="page-gradient min-h-screen pb-20">
      {/* Header */}
      <div className="bg-black/25 backdrop-blur-md border-b border-white/8 px-4 py-4">
        <Link href="/dashboard/tournaments" className="text-xs text-white/40 hover:text-white/60 mb-2 block">
          ← Tournaments
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold text-white truncate">{tournament.name}</div>
            <div className="text-xs text-white/40 mt-1">
              {tournament.location}{tournament.location && tournament.date ? ' · ' : ''}
              {tournament.date}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {tournament.status === 'active' && <span className="badge-yellow">LIVE</span>}
            {tournament.status === 'completed' && <span className="badge-green">COMPLETE</span>}
            {tournament.status === 'draft' && <span className="text-white/40 text-xs font-bold">DRAFT</span>}
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>{completed}/{total} matches played</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs + Content */}
      <TournamentTabs
        tournament={tournament as any}
        standings={standings}
        isAdmin={isAdmin}
      />
    </div>
  )
}
