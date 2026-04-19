import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { useStore } from '../store'

const ROLES = ['', 'Duelist', 'Controller', 'Initiator', 'Sentinel', 'IGL', 'Entry', 'Support', 'AWPer', 'Rifler']

export default function TeamsPage() {
  const location = useLocation()
  const { match, players, updatePlayer } = useStore()

  // Default to whichever team the Players button was clicked from, fallback to teamA
  const initialTab = location.state?.team === 'teamB' ? 'teamB' : 'teamA'
  const [activeTeam, setActiveTeam] = useState(initialTab)

  const teamName = activeTeam === 'teamA' ? match.teamA.name : match.teamB.name
  const teamColor = activeTeam === 'teamA' ? match.teamA.color : match.teamB.color
  const roster = players[activeTeam]

  const update = (index, updates) => updatePlayer(activeTeam, index, updates)
  const updateStat = (index, stat, delta) => {
    const current = roster[index].stats[stat]
    update(index, { stats: { ...roster[index].stats, [stat]: Math.max(0, current + delta) } })
  }

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="page-header">
        <div className="page-title">Teams</div>
        <div className="page-subtitle">Manage players (Will eventually allow for multiple teams to be saved).</div>
      </div>

      {/* Team Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['teamA', 'teamB']).map(team => {
          const name = team === 'teamA' ? match.teamA.name : match.teamB.name
          const color = team === 'teamA' ? match.teamA.color : match.teamB.color
          const isActive = activeTeam === team
          return (
            <button
              key={team}
              onClick={() => setActiveTeam(team)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${isActive ? color : 'var(--border)'}`,
                background: isActive ? `${color}22` : 'var(--bg-2)',
                color: isActive ? color : 'var(--text-2)',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                transition: 'all 0.18s'
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: color, flexShrink: 0
              }} />
              {name}
            </button>
          )
        })}
      </div>

      {/* Roster */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {roster.map((player, index) => (
          <div key={player.id} className="card" style={{ display: 'grid', gridTemplateColumns: '40px 1fr 160px 200px auto', gap: 16, alignItems: 'center' }}>

            {/* Player Number */}
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              display: 'grid', placeItems: 'center',
              background: `${teamColor}22`,
              color: teamColor,
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16
            }}>
              {index + 1}
            </div>

            {/* Name & Handle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                value={player.name}
                onChange={e => update(index, { name: e.target.value })}
                placeholder={`Player ${index + 1}`}
                style={{ fontSize: 14, fontWeight: 600 }}
              />
              <input
                value={player.handle}
                onChange={e => update(index, { handle: e.target.value })}
                placeholder="In-game handle"
                style={{ fontSize: 12, color: 'var(--text-2)' }}
              />
            </div>

            {/* Role */}
            <select value={player.role} onChange={e => update(index, { role: e.target.value })}>
              {ROLES.map(r => <option key={r} value={r}>{r || 'Role'}</option>)}
            </select>

            {/* Visible toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>Show</span>
              <div
                className={`toggle ${player.visible ? 'on' : ''}`}
                onClick={() => update(index, { visible: !player.visible })}
              />
            </div>
          </div>
        ))}
      </div>

    </motion.div>
  )
}
