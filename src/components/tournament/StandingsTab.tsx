'use client'

const MEDALS = ['🥇', '🥈', '🥉']

export function StandingsTab({ standings, tournament }: { standings: any[]; tournament: any }) {
  const completed = tournament.matches.filter((m: any) => m.completed).length
  const total = tournament.matches.length

  return (
    <div className="mt-4 space-y-3">
      {/* Points system info */}
      <div className="glass-card p-3 flex gap-4 text-xs">
        <span className="text-brand-green font-bold">🏆 Win = 2 pts</span>
        <span className="text-white/50">😓 Loss = 1 pt</span>
        <span className="text-white/40 ml-auto">{completed}/{total} played</span>
      </div>

      {standings.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-white/40 text-sm">Add teams to see standings</div>
        </div>
      ) : (
        standings.map((team, i) => {
          const isLeader = i === 0 && team.matchesPlayed > 0
          const players = team.players?.map((tp: any) => tp.player?.name).filter(Boolean).join(' & ')
          return (
            <div
              key={team.id}
              className={`p-4 rounded-2xl border transition-all ${
                isLeader
                  ? 'bg-yellow-400/7 border-yellow-400/25'
                  : 'bg-white/4 border-white/8'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-7 text-center flex-shrink-0">
                  {MEDALS[i] ?? <span className="text-sm text-white/30">{i + 1}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-base ${isLeader ? 'text-yellow-400' : 'text-white'}`}>
                    {team.name}
                  </div>
                  <div className="text-white/40 text-xs truncate">{players}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-center min-w-[28px]">
                    <div className="text-brand-green font-bold text-sm">{team.wins}</div>
                    <div className="text-white/30 text-[9px]">W</div>
                  </div>
                  <div className="text-center min-w-[28px]">
                    <div className="text-red-400 font-bold text-sm">{team.losses}</div>
                    <div className="text-white/30 text-[9px]">L</div>
                  </div>
                  <div className="text-center min-w-[42px] bg-white/8 rounded-lg px-2 py-1">
                    <div className="text-yellow-400 font-bold text-base">{team.points}</div>
                    <div className="text-white/30 text-[9px]">PTS</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
