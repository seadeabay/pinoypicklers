import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRoundRobinMatches(teamIds: string[]) {
  const matches: { team1Id: string; team2Id: string; round: number }[] = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({ team1Id: teamIds[i], team2Id: teamIds[j], round: 0 })
    }
  }
  return matches
}

export function getStandings(teams: any[]) {
  return [...teams].sort((a, b) =>
    b.points - a.points || b.wins - a.wins || a.losses - b.losses
  )
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function getRoleColor(role: string) {
  if (role === 'admin') return 'text-yellow-400'
  if (role === 'player') return 'text-green-400'
  return 'text-gray-400'
}

export function getRoleBadge(role: string) {
  if (role === 'admin') return '👑 Admin'
  if (role === 'player') return '🏓 Player'
  return '👁️ Spectator'
}
