'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function TeamsTab({ tournament, isAdmin }: { tournament: any; isAdmin: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', player1: '', player2: '' })

  async function addTeam() {
    if (!form.name || !form.player1 || !form.player2) { toast.error('All fields required'); return }
    startTransition(async () => {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, player1Name: form.player1, player2Name: form.player2 }),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return }
      toast.success('Team added!')
      setForm({ name: '', player1: '', player2: '' })
      setShowAdd(false)
      router.refresh()
    })
  }

  async function removeTeam(teamId: string) {
    if (!confirm('Remove this team? Unplayed matches will be recalculated.')) return
    startTransition(async () => {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      if (!res.ok) { toast.error('Failed to remove team'); return }
      toast.success('Team removed')
      router.refresh()
    })
  }

  return (
    <div className="mt-4">
      {isAdmin && (
        <button onClick={() => setShowAdd(v => !v)} className="btn-primary w-full mb-4">
          {showAdd ? '✕ Cancel' : '+ Add Team'}
        </button>
      )}

      {showAdd && (
        <div className="glass-card p-4 mb-4 space-y-3">
          <div className="text-sm font-bold text-white mb-1">New Team</div>
          {[
            { label: 'Team Name', key: 'name', placeholder: 'e.g. Team Banat' },
            { label: 'Player 1', key: 'player1', placeholder: 'e.g. Juan dela Cruz' },
            { label: 'Player 2', key: 'player2', placeholder: 'e.g. Maria Santos' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-white/50 block mb-1">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="input-field"
              />
            </div>
          ))}
          <button onClick={addTeam} disabled={isPending} className="btn-primary w-full">
            {isPending ? 'Adding...' : 'Add Team'}
          </button>
        </div>
      )}

      {tournament.teams.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-white/40 text-sm">No teams yet</div>
          <div className="text-white/30 text-xs mt-1">
            Need at least 2 teams to generate matches
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tournament.teams.map((team: any, i: number) => {
            const players = team.players?.map((tp: any) => tp.player?.name).filter(Boolean)
            const teamMatches = tournament.matches.filter(
              (m: any) => (m.team1Id === team.id || m.team2Id === team.id) && m.completed
            ).length
            return (
              <div key={team.id} className="glass-card p-4 rounded-2xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-base">{team.name}</div>
                    <div className="text-white/50 text-xs mt-0.5">
                      {players?.join(' & ')}
                    </div>
                  </div>
                  {isAdmin && tournament.status !== 'completed' && (
                    <button
                      onClick={() => removeTeam(team.id)}
                      className="text-red-400/60 hover:text-red-400 text-xs border border-red-400/20 rounded-lg px-2 py-1 ml-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '🏆 Wins', val: team.wins, color: 'text-brand-green' },
                    { label: '😓 Losses', val: team.losses, color: 'text-red-400' },
                    { label: '⭐ Points', val: team.points, color: 'text-yellow-400' },
                    { label: '🎮 Played', val: teamMatches, color: 'text-purple-400' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
                      <div className={`font-bold text-base ${color}`}>{val}</div>
                      <div className="text-white/30 text-[9px] mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tournament.teams.length >= 2 && (
        <div className="mt-4 glass-card p-3 text-center">
          <div className="text-white/40 text-xs">
            📋 {tournament.matches.length} matches generated
            {' · '}Round robin: every team plays each other once
          </div>
        </div>
      )}
    </div>
  )
}
