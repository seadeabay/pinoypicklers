'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function MatchesTab({ tournament, isAdmin }: { tournament: any; isAdmin: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modal, setModal] = useState<null | { match: any }>(null)
  const [winnerId, setWinnerId] = useState('')
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')

  const pending = tournament.matches.filter((m: any) => !m.completed)
  const done = tournament.matches.filter((m: any) => m.completed)

  function openModal(match: any) {
    setModal({ match })
    setWinnerId(match.winner?.id || '')
    setScore1(match.score1?.toString() || '')
    setScore2(match.score2?.toString() || '')
  }

  async function submitResult() {
    if (!winnerId || !modal) { toast.error('Select a winner'); return }
    startTransition(async () => {
      const res = await fetch(`/api/tournaments/${tournament.id}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: modal.match.id,
          winnerId,
          score1: score1 ? parseInt(score1) : undefined,
          score2: score2 ? parseInt(score2) : undefined,
        }),
      })
      if (!res.ok) { toast.error('Failed to record result'); return }
      toast.success('Match recorded! ✅')
      setModal(null)
      router.refresh()
    })
  }

  function MatchCard({ match, showAction }: { match: any; showAction: boolean }) {
    const team1 = match.team1
    const team2 = match.team2
    const winner = match.winner
    const t1Players = team1.players?.map((tp: any) => tp.player?.name).filter(Boolean).join(' & ')
    const t2Players = team2.players?.map((tp: any) => tp.player?.name).filter(Boolean).join(' & ')

    return (
      <div className={`rounded-xl border p-3 mb-3 ${
        match.completed ? 'bg-brand-green/4 border-brand-green/20' : 'bg-white/4 border-yellow-400/15'
      }`}>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-2">
          {/* Team 1 */}
          <div className={`rounded-lg p-2 border ${
            match.completed && winner?.id === team1.id
              ? 'bg-brand-green/12 border-brand-green/30'
              : 'bg-blue-500/8 border-blue-500/20'
          }`}>
            <div className="font-bold text-white text-xs truncate">{team1.name}</div>
            <div className="text-white/40 text-[10px] truncate">{t1Players}</div>
          </div>

          {/* Score / VS */}
          <div className="text-center px-1">
            {match.completed && match.score1 != null
              ? <span className="text-yellow-400 font-bold text-sm">{match.score1}–{match.score2}</span>
              : <span className="text-yellow-400/60 font-bold text-xs">VS</span>
            }
          </div>

          {/* Team 2 */}
          <div className={`rounded-lg p-2 border text-right ${
            match.completed && winner?.id === team2.id
              ? 'bg-brand-green/12 border-brand-green/30'
              : 'bg-red-500/8 border-red-500/20'
          }`}>
            <div className="font-bold text-white text-xs truncate">{team2.name}</div>
            <div className="text-white/40 text-[10px] truncate">{t2Players}</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {match.completed
            ? <span className="text-brand-green text-xs">🏆 {winner?.name} won</span>
            : <span className="text-white/30 text-xs">
                {match.scheduled ? `📍 ${match.courtLabel}` : 'Not scheduled'}
              </span>
          }
          {showAction && isAdmin && (
            <button
              onClick={() => openModal(match)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                match.completed
                  ? 'text-white/40 border-white/10 bg-white/5'
                  : 'text-brand-green border-brand-green/30 bg-brand-green/10'
              }`}
            >
              {match.completed ? 'Edit' : 'Record Result'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {isAdmin && pending.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              const firstPending = pending[0]
              if (firstPending) openModal(firstPending)
            }}
            className="flex-1 btn-primary text-sm py-2.5"
          >
            + Record Next Match
          </button>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
            ⏳ Pending ({pending.length})
          </div>
          {pending.map((m: any) => <MatchCard key={m.id} match={m} showAction />)}
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
            ✅ Completed ({done.length})
          </div>
          {done.map((m: any) => <MatchCard key={m.id} match={m} showAction />)}
        </div>
      )}

      {tournament.matches.length === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="text-3xl mb-2">📋</div>
          <div className="text-white/40 text-sm">Add at least 2 teams to generate matches</div>
        </div>
      )}

      {/* Record Result Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d2e1a] border border-white/12 rounded-2xl p-5 w-full max-w-sm">
            <div className="text-lg font-bold text-white text-center mb-1">🎾 Record Result</div>
            <div className="text-xs text-white/40 text-center mb-5">
              {modal.match.team1.name} vs {modal.match.team2.name}
            </div>

            <div className="text-xs text-white/50 mb-2">Who won?</div>
            {[modal.match.team1, modal.match.team2].map((team: any) => (
              <button
                key={team.id}
                onClick={() => setWinnerId(team.id)}
                className={`w-full p-3 rounded-xl mb-2 text-left border flex items-center justify-between transition-all ${
                  winnerId === team.id
                    ? 'bg-brand-green/20 border-brand-green text-brand-green'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">{team.name}</div>
                  <div className="text-xs opacity-60">
                    {team.players?.map((tp: any) => tp.player?.name).join(' & ')}
                  </div>
                </div>
                {winnerId === team.id && <span className="text-lg">✓</span>}
              </button>
            ))}

            <div className="text-xs text-white/50 mb-2 mt-3">Score (optional)</div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number" value={score1} onChange={e => setScore1(e.target.value)}
                placeholder={modal.match.team1.name}
                className="input-field text-center"
              />
              <span className="text-white/40 font-bold">–</span>
              <input
                type="number" value={score2} onChange={e => setScore2(e.target.value)}
                placeholder={modal.match.team2.name}
                className="input-field text-center"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={submitResult}
                disabled={!winnerId || isPending}
                className="btn-primary flex-[2]"
              >
                {isPending ? 'Saving...' : '✅ Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
