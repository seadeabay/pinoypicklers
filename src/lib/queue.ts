export type RotMode = 'rotate' | 'winners' | 'splitqueue'
export type PairMode = 'random' | 'fixed'

export interface QueuePlayer {
  id: string
  name: string
  rating: number
  lastPartner?: string | null
  partner?: string | null
  consecutiveWins: number
  totalWins: number
  totalLosses: number
}

export interface QueueState {
  general: string[]
  winner: string[]
  loser: string[]
  bye: string[]
}

export function buildAvoidMap(players: QueuePlayer[]) {
  const map: Record<string, Set<string>> = {}
  players.forEach(p => {
    if (p.lastPartner) map[p.id] = new Set([p.lastPartner])
  })
  return map
}

export function buildTeams(
  fourIds: string[],
  players: QueuePlayer[],
  pairMode: PairMode,
  avoidMap?: Record<string, Set<string>>
): [string[], string[]] {
  const four = fourIds.map(id => players.find(p => p.id === id)).filter(Boolean) as QueuePlayer[]

  if (pairMode === 'fixed') {
    const pairs: QueuePlayer[][] = []
    const seen = new Set<string>()
    for (const p of four) {
      if (seen.has(p.id)) continue
      if (p.partner && four.find(x => x.id === p.partner)) {
        const partner = players.find(x => x.id === p.partner)
        if (partner) { pairs.push([p, partner]); seen.add(p.id); seen.add(p.partner!) }
      } else { pairs.push([p]); seen.add(p.id) }
    }
    const sp = pairs.sort((a, b) =>
      b.reduce((s, x) => s + x.rating, 0) - a.reduce((s, x) => s + x.rating, 0)
    )
    const tA = (sp[0] || []).concat(sp[2]?.[0] ? [sp[2][0]] : [])
    const tB = (sp[1] || []).concat(sp[2]?.[1] ? [sp[2][1]] : sp[3]?.[0] ? [sp[3][0]] : [])
    return [tA.slice(0, 2).map(p => p.id), tB.slice(0, 2).map(p => p.id)]
  }

  const sorted = [...four].sort((a, b) => b.rating - a.rating)
  let tA = [sorted[0].id, sorted[3].id]
  let tB = [sorted[1].id, sorted[2].id]

  if (avoidMap) {
    const avoid = (a: string, b: string) => avoidMap[a]?.has(b)
    const combos: [[string, string], [string, string]][] = [
      [[sorted[0].id, sorted[3].id], [sorted[1].id, sorted[2].id]],
      [[sorted[0].id, sorted[2].id], [sorted[1].id, sorted[3].id]],
      [[sorted[0].id, sorted[1].id], [sorted[2].id, sorted[3].id]],
    ]
    for (const [cA, cB] of combos) {
      if (!avoid(cA[0], cA[1]) && !avoid(cB[0], cB[1])) {
        tA = cA; tB = cB; break
      }
    }
  }
  return [tA, tB]
}

export function getPool(state: QueueState, excludeIds: Set<string>, rotMode: RotMode): string[] {
  const { bye, winner, loser, general } = state
  const combined = rotMode === 'splitqueue'
    ? [...bye, ...winner, ...loser, ...general]
    : [...bye, ...general]
  const seen = new Set<string>()
  return combined.filter(id => {
    if (excludeIds.has(id) || seen.has(id)) return false
    seen.add(id); return true
  })
}
