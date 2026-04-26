import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Minus, MapPin, Clock4, ShieldCheck, Users, School as SchoolIcon, RotateCcw, Save } from 'lucide-react'
import { GAME_CONFIGS } from '../services/gameApiService'
import { useStore, MAX_MAP_SLOTS } from '../store'

export default function ScoreboardPage() {
  const navigate = useNavigate()
  const {
    match, mapSlots, setMapSlot, schools = [], customGames,
    updateMatch, updateTeamA, updateTeamB,
    incrementScore, decrementScore, resetMatch, addNotification
  } = useStore()

const playedCount = mapSlots.filter(s => s.played).length
const activeMapDisplay = playedCount < mapSlots.length
  ? `${mapSlots[playedCount].id}${mapSlots[playedCount].map ? ` · ${mapSlots[playedCount].map}` : ''}`
  : 'Complete'

const allGames = { ...GAME_CONFIGS, ...customGames }
const gameConfig = allGames[match.game] || allGames.generic
  const maps = gameConfig.maps || []
  const modes = gameConfig.modes || []

  const schoolA = schools?.find(s => s.id === match.selectedSchoolA)
  const schoolB = schools?.find(s => s.id === match.selectedSchoolB)

  const handleSave = () => {
    addNotification('Match configuration saved successfully', 'success')
  }

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Match Control</div>
          <div className="page-subtitle">Configure teams, scores, and match progress.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={resetMatch}>
            <RotateCcw size={16} /> Reset Match
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ gap: 18, marginBottom: 22 }}>
        {/* Team A */}
        <div className="card team-card">
          <div className="team-card-header">
            <div>
              <div className="team-card-title">{match.teamA.name}</div>
              <div className="team-card-subtitle">Team A</div>
            </div>
            <button className="btn btn-ghost team-card-action" onClick={() => navigate('/teams', { state: { team: 'teamA' } })}>
              <Users size={14} /> Players
            </button>
          </div>

          <div className="team-card-body">
            <div className="team-logo-wrapper">
              <div className="team-logo" style={{ background: match.teamA.color, overflow: 'hidden' }}>
                {schoolA?.logo ? <img src={schoolA.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" /> : <SchoolIcon size={24} style={{ opacity: 0.5 }} />}
              </div>
              <div className="team-selection-stack" style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <select 
                  value={match.selectedSchoolA} 
                  onChange={e => {
                    const sId = e.target.value;
                    const school = (schools || []).find(s => s.id === sId);
                    updateMatch({ selectedSchoolA: sId });
                    updateTeamA({ name: '', color: school?.color || '#3b82f6' });
                  }}
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  <option value="">Select School</option>
                  {schools?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                
                <select
                  value={match.teamA.name}
                  onChange={e => updateTeamA({ name: e.target.value })}
                  disabled={!match.selectedSchoolA}
                  style={{ fontWeight: 700, padding: '4px 8px' }}
                >
                  <option value="">Select Team</option>
                  {schoolA?.teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {!match.selectedSchoolA && (
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Manual Team Name</label>
                <input
                  className="team-name-input"
                  value={match.teamA.name}
                  onChange={e => updateTeamA({ name: e.target.value })}
                  placeholder="Custom name"
                />
              </div>
            )}

            <div className="score-section">
              <div className="score-label">Score</div>
              <div style={{ maxwidth: 200 }}>
              <div className="score-control" style={{ maxWidth: 200 }}>
                <button type="button" onClick={() => decrementScore('teamA')}><Minus size={16} /></button>
                <span className="score-value">{match.teamA.score}</span>
                <button type="button" onClick={() => incrementScore('teamA')}><Plus size={16} /></button>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Summary */}
        <div className="card match-summary-card">
          <div className="card-title">Match Summary</div>
          <div className="match-summary-grid">
            <SummaryItem icon={<MapPin size={16} />} label="Active Map" value={activeMapDisplay} />
            <SummaryItem icon={<Clock4 size={16} />} label="Timer" value={match.timer} />
            <SummaryItem icon={<ShieldCheck size={16} />} label="Maps" value={`${match.maps}`} />
            <SummaryItem icon={<Users size={16} />} label="Match state" value={match.status} />
          </div>

          <div className="form-group">
            <label className="form-label">Match status</label>
            <select value={match.status} onChange={e => updateMatch({ status: e.target.value })}>
              <option value="pregame">Pregame</option>
              <option value="live">Live</option>
              <option value="halftime">Halftime</option>
              <option value="postgame">Postgame</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Maps</label>
            <select value={match.maps} onChange={e => updateMatch({ maps: Number(e.target.value) })}>
              {Array.from({ length: MAX_MAP_SLOTS }, (_, i) => i + 1).map(value => (
                <option key={value} value={value}>{`${value} maps`}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Timer</label>
            <input value={match.timer} onChange={e => updateMatch({ timer: e.target.value })} placeholder="00:00" />
          </div>
        </div>

        {/* Team B */}
        <div className="card team-card">
          <div className="team-card-header">
            <div>
              <div className="team-card-title">{match.teamB.name}</div>
              <div className="team-card-subtitle">Team B</div>
            </div>
            <button className="btn btn-ghost team-card-action" onClick={() => navigate('/teams', { state: { team: 'teamB' } })}>
              <Users size={14} /> Players
            </button>
          </div>

          <div className="team-card-body">
            <div className="team-logo-wrapper">
              <div className="team-logo" style={{ background: match.teamB.color, overflow: 'hidden' }}>
                {schoolB?.logo ? <img src={schoolB.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" /> : <SchoolIcon size={24} style={{ opacity: 0.5 }} />}
              </div>
              <div className="team-selection-stack" style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <select 
                  value={match.selectedSchoolB} 
                  onChange={e => {
                    const sId = e.target.value;
                    const school = (schools || []).find(s => s.id === sId);
                    updateMatch({ selectedSchoolB: sId });
                    updateTeamB({ name: '', color: school?.color || '#ef4444' });
                  }}
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  <option value="">Select School</option>
                  {schools?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                
                <select
                  value={match.teamB.name}
                  onChange={e => updateTeamB({ name: e.target.value })}
                  disabled={!match.selectedSchoolB}
                  style={{ fontWeight: 700, padding: '4px 8px' }}
                >
                  <option value="">Select Team</option>
                  {schoolB?.teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {!match.selectedSchoolB && (
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Manual Team Name</label>
                <input
                  className="team-name-input"
                  value={match.teamB.name}
                  onChange={e => updateTeamB({ name: e.target.value })}
                  placeholder="Custom name"
                />
              </div>
            )}

            <div className="score-section">
              <div className="score-label">Score</div>
              <div style={{ maxwidth: 200 }}>
              <div className="score-control" style={{ maxWidth: 200 }}>
                <button type="button" onClick={() => decrementScore('teamA')}><Minus size={16} /></button>
                <span className="score-value">{match.teamA.score}</span>
                <button type="button" onClick={() => incrementScore('teamA')}><Plus size={16} /></button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Map Grid */}
      <div className="map-grid">
        {mapSlots.map((slot, index) => (
          <div key={slot.id} className="card map-card">
            <div className="map-card-header">
              <div className="map-card-title">{slot.id}</div>
              <div className={`tag ${slot.played ? 'tag-live' : 'tag-accent'}`}>{slot.played ? 'Played' : 'Pending'}</div>
            </div>

            <div className="map-select-row">
              <select className="map-card-select" value={slot.map} onChange={e => setMapSlot(index, { map: e.target.value })}>
                <option value="">Select Map</option>
                {maps.map(map => <option key={map} value={map}>{map}</option>)}
              </select>
              <select className="map-card-mode-select" value={slot.mode} onChange={e => setMapSlot(index, { mode: e.target.value })}>
                <option value="">Mode</option>
                {modes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            <div className="map-thumbnail">
              <span>{slot.map || 'TBA'}</span>
            </div>

            <div className="map-score-row">
              <div className="score-control map-score-control">
                <button type="button" onClick={() => setMapSlot(index, { scoreA: Math.max(0, slot.scoreA - 1) })}><Minus size={16} /></button>
                <span className="score-value">{slot.scoreA}</span>
                <button type="button" onClick={() => setMapSlot(index, { scoreA: slot.scoreA + 1 })}><Plus size={16} /></button>
              </div>
              <div className="score-control map-score-control">
                <button type="button" onClick={() => setMapSlot(index, { scoreB: Math.max(0, slot.scoreB - 1) })}><Minus size={16} /></button>
                <span className="score-value">{slot.scoreB}</span>
                <button type="button" onClick={() => setMapSlot(index, { scoreB: slot.scoreB + 1 })}><Plus size={16} /></button>
              </div>
            </div>

            <div className="toggle-row" style={{ marginTop: 14 }}>
              <div>
                <div className="toggle-label">Played</div>
                <div className="toggle-sub">Mark this map as played once the result is final.</div>
              </div>
              <div className={`toggle ${slot.played ? 'on' : ''}`} onClick={() => setMapSlot(index, { played: !slot.played })} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="summary-item">
      <div className="summary-icon">{icon}</div>
      <div>
        <div className="summary-label">{label}</div>
        <div className="summary-value">{value}</div>
      </div>
    </div>
  )
}
