'use client'
import { useState } from 'react'
import { MatchesTab } from './MatchesTab'
import { TeamsTab } from './TeamsTab'
import { StandingsTab } from './StandingsTab'

const TABS = [
  { id: 'standings', label: '🏅 Standings' },
  { id: 'matches', label: '📋 Matches' },
  { id: 'teams', label: '👥 Teams' },
]

export function TournamentTabs({ tournament, standings, isAdmin }: {
  tournament: any
  standings: any[]
  isAdmin: boolean
}) {
  const [tab, setTab] = useState('standings')

  return (
    <>
      {/* Tab bar */}
      <div className="flex sticky top-0 z-10 bg-[rgba(7,31,19,0.96)] backdrop-blur-md border-b border-white/7">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
              tab === t.id ? 'tab-active' : 'tab-inactive'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === 'standings' && <StandingsTab standings={standings} tournament={tournament} />}
        {tab === 'matches' && <MatchesTab tournament={tournament} isAdmin={isAdmin} />}
        {tab === 'teams' && <TeamsTab tournament={tournament} isAdmin={isAdmin} />}
      </div>
    </>
  )
}
