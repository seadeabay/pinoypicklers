import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ totalWins: 'desc' }, { totalLosses: 'asc' }],
    include: { user: { select: { role: true } } },
  })

  const MEDALS = ['🥇', '🥈', '🥉']
  const COLORS = ['#5fcf7a','#f5c842','#3b82f6','#f472b6','#a78bfa','#fb923c','#ef4444','#06b6d4']

  return (
    <div className="page-gradient min-h-screen pb-20">
      <div className="bg-black/25 backdrop-blur-md border-b border-white/8 px-4 py-5">
        <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/60 mb-1 block">← Dashboard</Link>
        <div className="text-xl font-bold text-white">👥 All Players</div>
        <div className="text-xs text-white/40 mt-1">{players.length} registered · All-time stats</div>
      </div>

      <div className="px-4 mt-4">
        {players.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-white/40 text-sm">No players yet</div>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player, i) => {
              const total = player.totalWins + player.totalLosses
              const pct = total > 0 ? Math.round((player.totalWins / total) * 100) : null
              const color = COLORS[i % COLORS.length]
              return (
                <div key={player.id} className={`glass-card p-4 rounded-2xl flex items-center gap-3 ${i === 0 && total > 0 ? 'border-yellow-400/25 bg-yellow-400/5' : ''}`}>
                  <div className="text-xl w-7 text-center flex-shrink-0">
                    {MEDALS[i] ?? <span className="text-sm text-white/30">{i + 1}</span>}
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: color + '33', border: `2px solid ${color}55`, color }}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm ${i < 3 && total > 0 ? 'text-white' : 'text-white/80'}`}>
                      {player.name}
                    </div>
                    {player.nickname && (
                      <div className="text-white/40 text-xs">"{player.nickname}"</div>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ fontSize: '10px', filter: n <= player.rating ? 'none' : 'grayscale(1) opacity(0.25)' }}>⭐</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-center min-w-[28px]">
                      <div className="text-brand-green font-bold text-sm">{player.totalWins}</div>
                      <div className="text-white/30 text-[9px]">W</div>
                    </div>
                    <div className="text-center min-w-[28px]">
                      <div className="text-red-400 font-bold text-sm">{player.totalLosses}</div>
                      <div className="text-white/30 text-[9px]">L</div>
                    </div>
                    {pct !== null && (
                      <div className="text-center min-w-[38px] bg-white/7 rounded-lg px-1.5 py-1">
                        <div className={`font-bold text-xs ${pct >= 50 ? 'text-brand-green' : 'text-red-400'}`}>{pct}%</div>
                        <div className="text-white/30 text-[9px]">WIN</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
