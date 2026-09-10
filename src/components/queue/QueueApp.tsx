'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { buildTeams, buildAvoidMap, getPool } from '@/lib/queue'
import type { QueuePlayer, RotMode, PairMode, QueueState } from '@/lib/queue'

const COURT_CAP = 4

interface Court {
  id: string
  label: string
  players: string[] // [tA0, tA1, tB0, tB1]
  active: boolean
}

function uid() { return Math.random().toString(36).slice(2, 9) }

export function QueueApp() {
  const [screen, setScreen] = useState<'setup' | 'main'>('setup')
  const [rotMode, setRotMode] = useState<RotMode | null>(null)
  const [pairMode, setPairMode] = useState<PairMode | null>(null)
  const [numCourts, setNumCourts] = useState(1)
  const [courts, setCourts] = useState<Court[]>([])
  const [players, setPlayers] = useState<QueuePlayer[]>([])
  const [queues, setQueues] = useState<QueueState>({ general: [], winner: [], loser: [], bye: [] })
  const [addName, setAddName] = useState('')
  const [addRating, setAddRating] = useState(3)
  const [tab, setTab] = useState<'courts' | 'players' | 'leaderboard'>('courts')
  const [modal, setModal] = useState<any>(null)
  const [gamesPlayed, setGamesPlayed] = useState(0)

  function getP(id: string) { return players.find(p => p.id === id) }

  function onCourtIds() { return courts.filter(c => c.active).flatMap(c => c.players) }

  function startSession() {
    if (!rotMode || !pairMode) return
    setCourts(Array.from({ length: numCourts }, (_, i) => ({ id: uid(), label: `Court ${i + 1}`, players: [], active: false })))
    setScreen('main')
  }

  function addPlayer() {
    const name = addName.trim()
    if (!name) return
    if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) { toast.error(`"${name}" already exists`); return }
    const id = uid()
    setPlayers(ps => [...ps, { id, name, rating: addRating, totalWins: 0, totalLosses: 0, consecutiveWins: 0 }])
    setQueues(q => ({ ...q, general: [...q.general, id] }))
    setAddName('')
    toast.success(`${name} added! 🏓`)
  }

  function startCourt(courtId: string) {
    const pool = getPool(queues, new Set(onCourtIds()), rotMode!)
    if (pool.length < COURT_CAP) { toast.error(`Need ${COURT_CAP} players (have ${pool.length})`); return }
    const previewIds = pool.slice(0, COURT_CAP)
    const avoidMap = buildAvoidMap(players)
    const [tA, tB] = buildTeams(previewIds, players, pairMode!, avoidMap)
    setModal({ type: 'pairing', courtId, previewIds, teams: [tA, tB], avoidMap })
  }

  function confirmStart(courtId: string, orderedIds: string[]) {
    // Record partners
    setPlayers(ps => ps.map(p => {
      if (orderedIds[0] === p.id || orderedIds[1] === p.id) return { ...p, lastPartner: orderedIds[0] === p.id ? orderedIds[1] : orderedIds[0] }
      if (orderedIds[2] === p.id || orderedIds[3] === p.id) return { ...p, lastPartner: orderedIds[2] === p.id ? orderedIds[3] : orderedIds[2] }
      return p
    }))
    setCourts(cs => cs.map(c => c.id === courtId ? { ...c, players: orderedIds, active: true } : c))
    setQueues(q => {
      const s = new Set(orderedIds)
      return { general: q.general.filter(id => !s.has(id)), winner: q.winner.filter(id => !s.has(id)), loser: q.loser.filter(id => !s.has(id)), bye: q.bye.filter(id => !s.has(id)) }
    })
    setModal(null)
    toast.success('Court started! 🏓')
  }

  function endGame(courtId: string, winnerIds: string[]) {
    const court = courts.find(c => c.id === courtId)!
    const loserIds = court.players.filter(id => !winnerIds.includes(id))

    // Update player stats
    setPlayers(ps => ps.map(p => {
      if (!court.players.includes(p.id)) return p
      const isW = winnerIds.includes(p.id)
      return { ...p, totalWins: p.totalWins + (isW ? 1 : 0), totalLosses: p.totalLosses + (isW ? 0 : 1), consecutiveWins: isW ? p.consecutiveWins + 1 : 0 }
    }))

    const updPlayers = players.map(p => {
      if (!court.players.includes(p.id)) return p
      const isW = winnerIds.includes(p.id)
      return { ...p, totalWins: p.totalWins + (isW ? 1 : 0), totalLosses: p.totalLosses + (isW ? 0 : 1), consecutiveWins: isW ? p.consecutiveWins + 1 : 0 }
    })

    let nQ = { ...queues }
    // Remove court players from all queues
    const courtSet = new Set(court.players)
    nQ = { general: nQ.general.filter(id => !courtSet.has(id)), winner: nQ.winner.filter(id => !courtSet.has(id)), loser: nQ.loser.filter(id => !courtSet.has(id)), bye: nQ.bye.filter(id => !courtSet.has(id)) }

    if (rotMode === 'splitqueue') {
      nQ.winner = [...nQ.winner, ...winnerIds]
      nQ.loser = [...nQ.loser, ...loserIds]
    } else if (rotMode === 'rotate') {
      nQ.general = [...nQ.general, ...court.players]
    } else {
      const updWinners = winnerIds.map(id => updPlayers.find(p => p.id === id)!).filter(Boolean)
      const stay = updWinners.filter(p => p.consecutiveWins < 2).map(p => p.id)
      const forced = updWinners.filter(p => p.consecutiveWins >= 2).map(p => p.id)
      nQ.general = [...nQ.general, ...forced, ...loserIds]
    }

    // Pick next 4 from pool
    const pool = getPool(nQ, new Set(onCourtIds().filter(id => !courtSet.has(id))), rotMode!)
    const nextFour = pool.slice(0, COURT_CAP)

    if (nextFour.length < COURT_CAP) {
      // Odd number — bye
      const byeSet = new Set(nextFour)
      setQueues({ general: nQ.general.filter(id => !byeSet.has(id)), winner: nQ.winner.filter(id => !byeSet.has(id)), loser: nQ.loser.filter(id => !byeSet.has(id)), bye: [...new Set([...nQ.bye, ...nextFour])] })
      setCourts(cs => cs.map(c => c.id === courtId ? { ...c, players: [], active: false } : c))
      const names = nextFour.map(id => updPlayers.find(p => p.id === id)?.name).filter(Boolean).join(', ')
      toast.info(names ? `${names} on 🔄 bye — priority next` : 'Waiting for more players')
    } else {
      const pulled = new Set(nextFour)
      const avoidMap = buildAvoidMap(updPlayers)
      const [tA, tB] = buildTeams(nextFour, updPlayers, pairMode!, avoidMap)
      // record partners
      const partnered = updPlayers.map(p => {
        if (tA[0] === p.id || tA[1] === p.id) return { ...p, lastPartner: tA[0] === p.id ? tA[1] : tA[0] }
        if (tB[0] === p.id || tB[1] === p.id) return { ...p, lastPartner: tB[0] === p.id ? tB[1] : tB[0] }
        return p
      })
      setPlayers(partnered)
      setCourts(cs => cs.map(c => c.id === courtId ? { ...c, players: [...tA, ...tB], active: true } : c))
      setQueues({ general: nQ.general.filter(id => !pulled.has(id)), winner: nQ.winner.filter(id => !pulled.has(id)), loser: nQ.loser.filter(id => !pulled.has(id)), bye: nQ.bye.filter(id => !pulled.has(id)) })
      toast.success('Next game started! 🏓')
    }

    setGamesPlayed(g => g + 1)
    setModal(null)
  }

  // ── Setup Screen ─────────────────────────────────────────────────────────────
  if (screen === 'setup') {
    const ready = rotMode && pairMode
    return (
      <div className="px-4 py-4 space-y-4">
        {/* Courts */}
        <div className="glass-card p-4">
          <div className="text-xs font-bold text-white/60 mb-3">🏟️ Number of Courts</div>
          <div className="flex items-center justify-center gap-5">
            <button onClick={() => setNumCourts(n => Math.max(1, n - 1))} className="w-11 h-11 rounded-full bg-white/10 border border-white/15 text-white text-xl font-bold">−</button>
            <div className="text-center">
              <div className="text-5xl font-bold text-white">{numCourts}</div>
              <div className="text-xs text-white/40 mt-1">{numCourts * COURT_CAP} active spots</div>
            </div>
            <button onClick={() => setNumCourts(n => Math.min(8, n + 1))} className="w-11 h-11 rounded-full bg-white/10 border border-white/15 text-white text-xl font-bold">+</button>
          </div>
        </div>
        {/* Rotation */}
        <div className="glass-card p-4">
          <div className="text-xs font-bold text-white/60 mb-3">🔀 Rotation Mode</div>
          {([['rotate','🔄','4 In, 4 Out','All 4 rotate out every game'],['winners','🏆','Winners Stay (Max 2)','Winners stay up to 2 consecutive wins'],['splitqueue','🏅','Split Queue + No Repeat','Winners/losers go to separate queues']] as const).map(([val,icon,title,desc]) => (
            <button key={val} onClick={() => setRotMode(val)} className={`w-full text-left p-3 rounded-xl border mb-2 flex gap-3 items-start transition-all ${rotMode === val ? 'bg-brand-green/10 border-brand-green' : 'bg-white/4 border-white/10'}`}>
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div><div className={`font-bold text-sm ${rotMode === val ? 'text-brand-green' : 'text-white'}`}>{title}</div><div className="text-white/40 text-xs mt-0.5">{desc}</div></div>
              {rotMode === val && <span className="ml-auto text-brand-green">✓</span>}
            </button>
          ))}
        </div>
        {/* Pairing */}
        <div className="glass-card p-4">
          <div className="text-xs font-bold text-white/60 mb-3">🎯 Pairing Mode</div>
          {([['random','🎲','Random Mix','Balanced by skill rating'],['fixed','👫','Fixed Partner','Permanent partner pairs']] as const).map(([val,icon,title,desc]) => (
            <button key={val} onClick={() => setPairMode(val)} className={`w-full text-left p-3 rounded-xl border mb-2 flex gap-3 items-start transition-all ${pairMode === val ? 'bg-purple-400/10 border-purple-400' : 'bg-white/4 border-white/10'}`}>
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div><div className={`font-bold text-sm ${pairMode === val ? 'text-purple-400' : 'text-white'}`}>{title}</div><div className="text-white/40 text-xs mt-0.5">{desc}</div></div>
              {pairMode === val && <span className="ml-auto text-purple-400">✓</span>}
            </button>
          ))}
        </div>
        <button onClick={startSession} disabled={!ready} className="btn-primary w-full py-4 text-base">
          {ready ? '▶ Start Session' : 'Select both modes above'}
        </button>
      </div>
    )
  }

  // ── Main Queue Screen ─────────────────────────────────────────────────────────
  const qPlayers = queues.general.map(id => getP(id)).filter(Boolean) as QueuePlayer[]
  const wPlayers = queues.winner.map(id => getP(id)).filter(Boolean) as QueuePlayer[]
  const lPlayers = queues.loser.map(id => getP(id)).filter(Boolean) as QueuePlayer[]
  const byePlayers = queues.bye.map(id => getP(id)).filter(Boolean) as QueuePlayer[]
  const pool = getPool(queues, new Set(onCourtIds()), rotMode!)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex sticky top-0 z-10 bg-[rgba(7,31,19,0.96)] backdrop-blur-md border-b border-white/7">
        {([['courts','🏟️ Courts'],['players','👥 Players'],['leaderboard','🏆 Board']] as const).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${tab === t ? 'text-brand-green border-brand-green' : 'text-white/35 border-transparent'}`}>{l}</button>
        ))}
      </div>
      <div className="px-4">
        {tab === 'courts' && (
          <div className="mt-3 space-y-3">
            {courts.map(court => {
              const cp = court.players.map(id => getP(id)).filter(Boolean) as QueuePlayer[]
              const active = court.players.length === COURT_CAP
              const canStart = !active && pool.length >= COURT_CAP
              const sA = cp.slice(0, 2); const sB = cp.slice(2, 4)
              return (
                <div key={court.id} className="glass-card p-3 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white/70">🟡 {court.label}</span>
                    {active && <span className="badge-green">LIVE</span>}
                  </div>
                  {cp.length > 0 ? (
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-2">
                      <div className="space-y-1">{sA.map(p => <PlayerCourtCard key={p.id} player={p} side="A" rotMode={rotMode!} />)}</div>
                      <div className="flex items-center"><div className="w-6 h-6 rounded-full bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center text-[10px] text-yellow-400 font-bold">VS</div></div>
                      <div className="space-y-1">{sB.map(p => <PlayerCourtCard key={p.id} player={p} side="B" rotMode={rotMode!} />)}</div>
                    </div>
                  ) : (
                    <div className="text-center text-white/30 text-xs py-2">
                      {canStart ? '' : `Need ${COURT_CAP - pool.length} more players`}
                    </div>
                  )}
                  {active && <button onClick={() => setModal({ type: 'winner', courtId: court.id, selectedTeam: null })} className="btn-yellow w-full text-sm">End Game & Pick Winners</button>}
                  {canStart && <button onClick={() => startCourt(court.id)} className="btn-primary w-full text-sm">▶ Start Game</button>}
                </div>
              )
            })}

            {/* Bye Queue */}
            {byePlayers.length > 0 && (
              <QueueSection title="🔄 On Bye (Priority Next)" badge="PRIORITY" badgeColor="purple" players={byePlayers} onRemove={id => setQueues(q => ({ ...q, bye: q.bye.filter(x => x !== id) }))} accent="purple" isBye />
            )}

            {rotMode === 'splitqueue' ? (
              <>
                <QueueSection title="🏆 Winners Queue" players={wPlayers} onRemove={id => setQueues(q => ({ ...q, winner: q.winner.filter(x => x !== id) }))} accent="yellow" />
                <QueueSection title="😅 Losers Queue" players={lPlayers} onRemove={id => setQueues(q => ({ ...q, loser: q.loser.filter(x => x !== id) }))} accent="red" />
                <QueueSection title="⏳ New Players" players={qPlayers} onRemove={id => setQueues(q => ({ ...q, general: q.general.filter(x => x !== id) }))} />
              </>
            ) : (
              <QueueSection title="⏳ Waiting Queue" players={qPlayers} onRemove={id => setQueues(q => ({ ...q, general: q.general.filter(x => x !== id) }))} highlight={byePlayers.length === 0} highlightCount={COURT_CAP} />
            )}
          </div>
        )}

        {tab === 'players' && (
          <div className="mt-3">
            <div className="glass-card p-3 mb-3">
              <div className="flex gap-2 mb-2">
                <input type="text" value={addName} onChange={e => setAddName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPlayer()} placeholder="Player name..." className="input-field flex-1" />
                <button onClick={addPlayer} className="btn-primary px-4 text-lg">+</button>
              </div>
              <div className="text-xs text-white/50 mb-1">Skill Rating</div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => <span key={n} onClick={() => setAddRating(n)} style={{ fontSize: '22px', cursor: 'pointer', filter: n <= addRating ? 'none' : 'grayscale(1) opacity(.25)' }}>⭐</span>)}
              </div>
            </div>
            {players.map(p => {
              const inQ = queues.general.includes(p.id) || queues.winner.includes(p.id) || queues.loser.includes(p.id) || queues.bye.includes(p.id)
              const onCourt = courts.some(c => c.players.includes(p.id))
              const status = onCourt ? 'court' : inQ ? 'queue' : 'idle'
              return (
                <div key={p.id} className="glass-card p-3 mb-2 rounded-xl flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{p.name}</span>
                      <span className={`text-[9px] font-bold ${status === 'court' ? 'text-yellow-400' : status === 'queue' ? 'text-brand-green' : 'text-white/30'}`}>
                        ● {status === 'court' ? 'COURT' : status === 'queue' ? 'QUEUE' : 'IDLE'}
                      </span>
                    </div>
                    <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: '11px', filter: n <= p.rating ? 'none' : 'grayscale(1) opacity(.25)' }}>⭐</span>)}</div>
                  </div>
                  <span className="text-xs text-white/30">{p.totalWins}W–{p.totalLosses}L</span>
                  {status === 'idle' && (
                    <button onClick={() => setQueues(q => ({ ...q, general: [...q.general, p.id] }))} className="text-xs text-brand-green border border-brand-green/30 bg-brand-green/10 rounded-lg px-2 py-1">+ Queue</button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="mt-3 space-y-2">
            {[...players].sort((a,b) => b.totalWins - a.totalWins || a.totalLosses - b.totalLosses).map((p, i) => {
              const total = p.totalWins + p.totalLosses
              const pct = total > 0 ? Math.round(p.totalWins / total * 100) : null
              const medals = ['🥇','🥈','🥉']
              return (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 && total > 0 ? 'bg-yellow-400/7 border-yellow-400/20' : 'bg-white/4 border-white/7'}`}>
                  <span className="w-6 text-center text-base">{medals[i] ?? i+1}</span>
                  <div className="flex-1"><div className="font-bold text-sm text-white">{p.name}</div><div className="flex gap-0.5 mt-0.5">{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize:'10px', filter: n<=p.rating?'none':'grayscale(1) opacity(.25)' }}>⭐</span>)}</div></div>
                  <span className="text-brand-green font-bold text-sm">{p.totalWins}W</span>
                  <span className="text-red-400 text-sm">{p.totalLosses}L</span>
                  {pct !== null && <span className={`text-xs font-bold ${pct>=50?'text-brand-green':'text-red-400'}`}>{pct}%</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pairing Modal */}
      {modal?.type === 'pairing' && (
        <PairingModal modal={modal} players={players} pairMode={pairMode!} onConfirm={orderedIds => confirmStart(modal.courtId, orderedIds)} onCancel={() => setModal(null)} onReshuffle={() => {
          const avoidMap = buildAvoidMap(players)
          const [tA, tB] = buildTeams(modal.previewIds, players, pairMode!, avoidMap)
          setModal({ ...modal, teams: [tA, tB] })
        }} />
      )}

      {/* Winner Modal */}
      {modal?.type === 'winner' && (() => {
        const court = courts.find(c => c.id === modal.courtId)!
        const cp = court?.players.map(id => getP(id)).filter(Boolean) as QueuePlayer[]
        const tA = cp.slice(0, 2); const tB = cp.slice(2, 4)
        const sel = modal.selectedTeam
        return (
          <div className="fixed inset-0 bg-black/82 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d2e1a] border border-white/12 rounded-2xl p-5 w-full max-w-sm">
              <div className="text-lg font-bold text-white text-center mb-2">🏆 {court?.label} — Who Won?</div>
              <div className="text-xs text-white/40 text-center mb-5">
                {rotMode === 'rotate' ? 'All 4 rotate out after this game.' : 'Winners with 2 wins must rotate out.'}
              </div>
              {[['A', tA, 'blue'], ['B', tB, 'red']].map(([label, team, color]) => (
                <div key={label as string}>
                  <button onClick={() => setModal({ ...modal, selectedTeam: sel === label ? null : label })}
                    className={`w-full p-4 rounded-xl border-2 mb-2 text-left transition-all ${sel === label ? (color === 'blue' ? 'bg-blue-500/18 border-blue-400' : 'bg-red-500/18 border-red-400') : 'bg-white/4 border-white/10'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold tracking-wider ${sel === label ? (color === 'blue' ? 'text-blue-400' : 'text-red-400') : 'text-white/40'}`}>TEAM {label as string}</span>
                      {sel === label && <span className="badge-green">🏆 WINNER</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(team as QueuePlayer[]).map(p => p && (
                        <div key={p.id} className="bg-white/6 rounded-lg p-2">
                          <div className="font-bold text-sm text-white">{p.name}</div>
                          <div className="text-white/40 text-xs">{p.totalWins}W–{p.totalLosses}L</div>
                          {rotMode === 'winners' && p.consecutiveWins > 0 && <div className="text-yellow-400 text-xs">{'🏆'.repeat(p.consecutiveWins)}</div>}
                        </div>
                      ))}
                    </div>
                  </button>
                  {label === 'A' && <div className="flex items-center gap-2 my-2"><div className="flex-1 h-px bg-white/8"/><span className="text-yellow-400/60 text-xs font-bold">VS</span><div className="flex-1 h-px bg-white/8"/></div>}
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => { const wIds = sel === 'A' ? tA.map(p=>p.id) : tB.map(p=>p.id); endGame(modal.courtId, wIds) }} disabled={!sel} className="btn-primary flex-[2]">Confirm & Next</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function PlayerCourtCard({ player, side, rotMode }: { player: QueuePlayer; side: string; rotMode: RotMode }) {
  const mustRotate = rotMode === 'winners' && player.consecutiveWins >= 1
  return (
    <div className={`rounded-lg p-2 border ${side === 'A' ? 'bg-blue-500/10 border-blue-500/25' : 'bg-red-500/10 border-red-500/25'} ${mustRotate ? 'border-yellow-400/50' : ''}`}>
      <div className="font-bold text-xs text-white truncate">{player.name}</div>
      <div className="text-white/40 text-[10px]">{player.totalWins}W–{player.totalLosses}L</div>
      {mustRotate && <div className="text-yellow-400 text-[10px]">{'🏆'.repeat(player.consecutiveWins)} Rotate!</div>}
    </div>
  )
}

function QueueSection({ title, badge, badgeColor, players, onRemove, accent, isBye, highlight, highlightCount }: {
  title: string; badge?: string; badgeColor?: string; players: QueuePlayer[]
  onRemove: (id: string) => void; accent?: string; isBye?: boolean; highlight?: boolean; highlightCount?: number
}) {
  const accentClasses: Record<string, string> = { yellow: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/7', red: 'text-red-400 border-red-400/20 bg-red-400/7', purple: 'text-purple-400 border-purple-400/20 bg-purple-400/7' }
  return (
    <div className="glass-card p-3 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-white/60">{title}</span>
        {players.length > 0 && <span className="badge-green">{players.length}</span>}
        {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${accentClasses[badgeColor||'green']||'badge-green'}`}>{badge}</span>}
      </div>
      {players.length === 0 ? (
        <div className="text-center text-white/30 text-xs py-2">Empty</div>
      ) : (
        players.map((p, i) => {
          const isNext = highlight && i < (highlightCount || 4)
          const accentStyle = accent ? accentClasses[accent] : ''
          return (
            <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg mb-1.5 border ${isNext ? 'bg-brand-green/8 border-brand-green/20' : accent ? accentStyle : 'bg-white/4 border-white/7'}`}>
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${isNext ? 'bg-brand-green text-[#001a0a]' : accent ? '' : 'bg-white/10 text-white/50'}`}>{i+1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{p.name}</div>
                <div className="flex gap-0.5">{[1,2,3,4,5].map(n=><span key={n} style={{fontSize:'9px',filter:n<=p.rating?'none':'grayscale(1) opacity(.25)'}}>⭐</span>)}</div>
              </div>
              <span className="text-[10px] text-white/30">{p.totalWins}W</span>
              {isBye && <span className="text-[9px] text-purple-400 font-bold">BYE</span>}
              {isNext && !isBye && <span className="text-[9px] text-brand-green font-bold">NEXT</span>}
              {accent === 'yellow' && <span className="text-[9px] text-yellow-400 font-bold">W</span>}
              {accent === 'red' && <span className="text-[9px] text-red-400 font-bold">L</span>}
              <button onClick={() => onRemove(p.id)} className="text-red-400/60 hover:text-red-400 text-xs ml-1">✕</button>
            </div>
          )
        })
      )}
    </div>
  )
}

function PairingModal({ modal, players, pairMode, onConfirm, onCancel, onReshuffle }: any) {
  const getP = (id: string) => players.find((p: QueuePlayer) => p.id === id)
  const tA = modal.teams[0].map(getP).filter(Boolean)
  const tB = modal.teams[1].map(getP).filter(Boolean)
  const avg = (team: QueuePlayer[]) => team.length ? (team.reduce((s, p) => s + p.rating, 0) / team.length).toFixed(1) : '—'

  return (
    <div className="fixed inset-0 bg-black/82 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d2e1a] border border-white/12 rounded-2xl p-5 w-full max-w-sm">
        <div className="text-lg font-bold text-white text-center mb-1">{pairMode === 'random' ? '🎲 Team Matchup' : '👫 Partner Matchup'}</div>
        <div className="text-xs text-white/40 text-center mb-4">{pairMode === 'random' ? 'Balanced by skill rating' : 'Fixed partners'}</div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 mb-4">
          {[['Team A','#3b82f6','59,130,246', tA],['', '', '', null],['Team B','#ef4444','239,68,68', tB]].map((item, i) => {
            if (i === 1) return <div key="vs" className="flex items-center justify-center"><div className="w-7 h-7 rounded-full bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center text-[10px] text-yellow-400 font-bold">VS</div></div>
            const [label, color, rgb, team] = item as [string, string, string, QueuePlayer[]]
            return (
              <div key={label} style={{ background: `rgba(${rgb},.08)`, border: `1px solid rgba(${rgb},.2)` }} className="rounded-xl p-3">
                <div className="text-xs font-bold mb-2" style={{ color }}>{label}</div>
                {(team as QueuePlayer[]).map(p => p && <div key={p.id} className="mb-1.5"><div className="text-xs text-white font-medium">{p.name}</div><div className="flex gap-0.5">{[1,2,3,4,5].map(n=><span key={n} style={{fontSize:'9px',filter:n<=p.rating?'none':'grayscale(1) opacity(.25)'}}>⭐</span>)}</div></div>)}
                <div className="text-[10px] text-white/40 mt-1">avg ⭐{avg(team as QueuePlayer[])}</div>
              </div>
            )
          })}
        </div>
        {pairMode === 'random' && <button onClick={onReshuffle} className="w-full py-2 rounded-xl bg-purple-400/15 border border-purple-400/30 text-purple-400 text-sm font-bold mb-3">🔀 Re-shuffle</button>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onConfirm([...modal.teams[0], ...modal.teams[1]])} className="btn-primary flex-[2]">▶ Start Game</button>
        </div>
      </div>
    </div>
  )
}
