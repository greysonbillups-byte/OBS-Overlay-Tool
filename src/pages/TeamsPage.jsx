import React, { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  User,
  Search, 
  ChevronRight, 
  Image as ImageIcon, 
  Users, 
  School, 
  Gamepad2, 
  UserPlus,
  ArrowLeft,
  Edit3,
  Save,
  ChevronDown
} from 'lucide-react'
import { useStore } from '../store'

// Configuration for different games and their specific roles
const GAME_CONFIGS = {
  valorant: { label: 'Valorant', roles: ['Duelist', 'Controller', 'Initiator', 'Sentinel', 'IGL', 'Coach'] },
  league: { label: 'League of Legends', roles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support', 'Coach'] },
  ow2: { label: 'Overwatch 2', roles: ['Tank', 'Damage', 'Support', 'Coach'] },
  rl: { label: 'Rocket League', roles: ['Striker', 'Midfield', 'Defender', 'Sub'] },
  other: { label: 'Other', roles: ['Player', 'Substitute', 'Coach', 'Manager'] },
}

// Helper to compress and resize images before storing in LocalStorage
const compressImage = (file, options = { maxWidth: 800, maxHeight: 800, quality: 0.7, format: 'image/jpeg' }) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > height) {
          if (width > options.maxWidth) {
            height = Math.round((height * options.maxWidth) / width)
            width = options.maxWidth
          }
        } else {
          if (height > options.maxHeight) {
            width = Math.round((width * options.maxHeight) / height)
            height = options.maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL(options.format, options.quality))
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

export default function TeamsPage() {
  // Navigation State: 'schools' | 'school-detail' | 'team-detail'
  const [currentView, setCurrentView] = useState('schools')
  const fileInputRef = useRef(null)
  const playerFileInputRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Data State is now managed globally to allow integration with the Match page
  // Ensure 'schools' and 'setSchools' are defined in your useStore (src/store.js)
  const { schools = [], setSchools } = useStore()
  const [editingPlayerId, setEditingPlayerId] = useState(null)

  const [activeSchoolId, setActiveSchoolId] = useState(null)
  const [activeTeamId, setActiveTeamId] = useState(null)

  // Helper to get active objects
  const activeSchool = useMemo(() => (schools || []).find(s => s.id === activeSchoolId), [schools, activeSchoolId])
  const activeTeam = useMemo(() => activeSchool?.teams.find(t => t.id === activeTeamId), [activeSchool, activeTeamId])

  // Filtered list for search
  const filteredSchools = useMemo(() => {
    return (schools || []).filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [schools, searchQuery])

  // --- School Actions ---
  const addSchool = () => {
    const id = Date.now().toString()
    setSchools([...(schools || []), { id, name: 'New School', logo: '', color: '#3b82f6', teams: [] }])
    setActiveSchoolId(id)
    setCurrentView('school-detail')
  }

  const updateSchool = (updates) => {
    setSchools((schools || []).map(s => s.id === activeSchoolId ? { ...s, ...updates } : s))
  }

  const deleteSchool = (id, e) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this school and all its teams?')) {
      setSchools((schools || []).filter(s => s.id !== id))
      if (activeSchoolId === id) setCurrentView('schools')
    }
  }

  // --- Team Actions ---
  const addTeam = () => {
    const newTeam = { id: Date.now().toString(), name: 'New Team', game: 'valorant', players: [] }
    updateSchool({ teams: [...activeSchool.teams, newTeam] })
  }

  const updateTeam = (teamId, updates) => {
    updateSchool({
      teams: activeSchool.teams.map(t => t.id === teamId ? { ...t, ...updates } : t)
    })
  }

  const deleteTeam = (teamId, e) => {
    e.stopPropagation()
    updateSchool({ teams: activeSchool.teams.filter(t => t.id !== teamId) })
  }

  // --- Player Actions ---
  const addPlayer = () => {
    const newPlayer = { id: Date.now().toString(), name: '', handle: '', role: '', photo: '' }
    updateTeam(activeTeamId, { players: [...activeTeam.players, newPlayer] })
  }

  const updatePlayer = (playerId, updates) => {
    updateTeam(activeTeamId, {
      players: activeTeam.players.map(p => p.id === playerId ? { ...p, ...updates } : p)
    })
  }

  const deletePlayer = (playerId) => {
    updateTeam(activeTeamId, { players: activeTeam.players.filter(p => p.id !== playerId) })
  }

  // --- Asset Actions ---
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      // Schools might want higher quality logos with transparency support
      const compressed = await compressImage(file, { 
        maxWidth: 600, 
        maxHeight: 600, 
        format: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        quality: 0.8 
      })
      updateSchool({ logo: compressed })
    } catch (err) {
      console.error('Logo upload error:', err)
      alert('Failed to process school logo.')
    } finally {
      e.target.value = ''
    }
  }

  const handlePlayerPhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !editingPlayerId) return

    try {
      // Player photos are usually headshots, aggressive JPEG compression works well here
      const compressed = await compressImage(file, { 
        maxWidth: 300, 
        maxHeight: 300, 
        format: 'image/jpeg', 
        quality: 0.6 
      })
      updatePlayer(editingPlayerId, { photo: compressed })
    } catch (err) {
      console.error('Player photo upload error:', err)
      alert('Failed to process player photo.')
    } finally {
      setEditingPlayerId(null)
      e.target.value = '' // Clear input
    }
  }

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLogoUpload} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
      <input 
        type="file" 
        ref={playerFileInputRef} 
        onChange={handlePlayerPhotoUpload} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
      
      {/* --- View 1: Schools List --- */}
      {currentView === 'schools' && (
        <>
          <div className="page-header">
            <div>
              <div className="page-title">Programs & Schools</div>
              <div className="page-subtitle">Manage collegiate institutions and their rosters.</div>
            </div>
            <button className="btn btn-primary" onClick={addSchool} style={{ marginTop: 8 }}>
              <Plus size={16} /> Add School
            </button>
          </div>

          <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
            <Search size={18} style={{ color: 'var(--text-3)' }} />
            <input 
              className="minimal-input" 
              placeholder="Search schools..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', fontSize: 15 }}
            />
          </div>

          <div className="grid-3">
            {filteredSchools.map(school => (
              <div key={school.id} className="card interactive-card" onClick={() => { setActiveSchoolId(school.id); setCurrentView('school-detail'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="school-logo-placeholder">
                    {school.logo ? <img src={school.logo} alt="logo" /> : <School size={24} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{school.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} /> {school.teams.length} Teams
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-icon-only" onClick={(e) => deleteSchool(school.id, e)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- View 2: School Detail (Team List) --- */}
      {currentView === 'school-detail' && activeSchool && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-ghost btn-icon-only" onClick={() => setCurrentView('schools')}>
                <ArrowLeft size={18} />
              </button>
              <div 
                className="school-logo-placeholder interactive-logo" 
                onClick={() => fileInputRef.current?.click()}
                title="Upload School Logo"
              >
                {activeSchool.logo ? <img src={activeSchool.logo} alt="School logo" /> : <ImageIcon size={24} style={{ color: 'var(--accent)' }} />}
                <div className="logo-edit-badge">
                  <Plus size={12} strokeWidth={3} />
                </div>
              </div>
              <input 
                className="minimal-input h2-input" 
                value={activeSchool.name} 
                onChange={e => updateSchool({ name: e.target.value })}
                placeholder="School Name"
              />
              <input
                type="color"
                value={activeSchool.color || '#3b82f6'}
                onChange={e => updateSchool({ color: e.target.value })}
                title="School Brand Color"
                style={{ width: 32, height: 32, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, flexShrink: 0 }}
              />
            </div>
            <button className="btn btn-primary" onClick={addTeam} style={{ marginTop: 8 }}>
              <Plus size={16} /> New Team
            </button>
          </div>

          <div className="section-label">Institutional Teams</div>
          <div className="grid-2">
            {activeSchool.teams.map(team => (
              <div key={team.id} className="card interactive-card" onClick={() => { setActiveTeamId(team.id); setCurrentView('team-detail'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="team-icon-wrapper" style={{ background: 'var(--bg-3)', color: 'var(--accent)' }}>
                    <Gamepad2 size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{team.name}</div>
                    <div className="tag tag-accent" style={{ marginTop: 4 }}>{GAME_CONFIGS[team.game]?.label}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>PLAYERS</div>
                    <div style={{ fontWeight: 700 }}>{team.players.length}</div>
                  </div>
                  <button className="btn btn-ghost btn-icon-only" onClick={(e) => deleteTeam(team.id, e)}>
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={18} style={{ color: 'var(--text-3)' }} />
                </div>
              </div>
            ))}
            {activeSchool.teams.length === 0 && (
              <div className="card-empty">No teams created for this school yet.</div>
            )}
          </div>
        </motion.div>
      )}

      {/* --- View 3: Team Detail (Roster) --- */}
      {currentView === 'team-detail' && activeTeam && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <button className="btn btn-ghost btn-icon-only" onClick={() => setCurrentView('school-detail')}>
                <ArrowLeft size={18} />
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    className="minimal-input h2-input" 
                    value={activeTeam.name} 
                    onChange={e => updateTeam(activeTeam.id, { name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: 13 }}>
                  <div className="school-logo-placeholder small" style={{ width: 18, height: 18, border: 'none', background: 'transparent' }}>
                    {activeSchool.logo ? <img src={activeSchool.logo} alt="" /> : <School size={14} />}
                  </div>
                  {activeSchool.name}
                </div>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0, width: 180 }}>
              <select 
                value={activeTeam.game} 
                onChange={e => updateTeam(activeTeam.id, { game: e.target.value })}
              >
                {Object.entries(GAME_CONFIGS).map(([id, cfg]) => (
                  <option key={id} value={id}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="roster-header">
            <div className="section-label">Active Roster</div>
            <button className="btn btn-ghost" onClick={addPlayer} style={{ marginTop: 8 }}>
              <UserPlus size={16} /> Add Player
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeTeam.players.map((player, idx) => (
              <div key={player.id} className="card player-row">
                <div className="player-index">{idx + 1}</div>
                <div 
                  className="player-photo-upload" 
                  onClick={() => {
                    setEditingPlayerId(player.id)
                    playerFileInputRef.current?.click()
                  }}
                  title="Upload Player Photo"
                >
                  {player.photo ? <img src={player.photo} alt={player.name} /> : <User size={20} />}
                  <div className="photo-edit-overlay"><Plus size={10} /></div>
                </div>
                <div style={{ flex: 2 }}>
                  <label className="tiny-label">Real Name</label>
                  <input 
                    className="minimal-input" 
                    value={player.name} 
                    onChange={e => updatePlayer(player.id, { name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label className="tiny-label">In-Game Handle</label>
                  <input 
                    className="minimal-input bold-handle" 
                    value={player.handle} 
                    onChange={e => updatePlayer(player.id, { handle: e.target.value })}
                    placeholder="Gamertag"
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label className="tiny-label">Role / Agent</label>
                  <select 
                    className="minimal-select"
                    value={player.role} 
                    onChange={e => updatePlayer(player.id, { role: e.target.value })}
                  >
                    <option value="">Select Role</option>
                    {GAME_CONFIGS[activeTeam.game].roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-ghost btn-icon-only text-danger" onClick={() => deletePlayer(player.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {activeTeam.players.length === 0 && (
              <div className="card-empty">No players assigned to this team.</div>
            )}
          </div>
        </motion.div>
      )}

      <style>{`
        .school-logo-placeholder {
          width: 48px;
          height: 48px;
          background: var(--bg-3);
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: var(--text-3);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .school-logo-placeholder.small {
          width: 32px;
          height: 32px;
          border-radius: 6px;
        }
        .school-logo-placeholder img { width: 100%; height: 100%; object-fit: contain; }
        .interactive-card { cursor: pointer; transition: all 0.2s; border: 1px solid var(--border); }
        .interactive-logo { 
          cursor: pointer; 
          transition: all 0.2s; 
          position: relative;
          overflow: visible !important;
        }
        .logo-edit-badge {
          position: absolute;
          bottom: -6px;
          right: -6px;
          width: 22px;
          height: 22px;
          background: var(--accent);
          color: white;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 3px solid var(--bg-1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          z-index: 10;
        }
        .interactive-logo:hover { border-color: var(--accent); background: var(--bg-2); transform: translateY(-2px); }
        .interactive-card:hover { border-color: var(--accent); background: var(--bg-2); transform: translateY(-2px); }
        .h2-input { font-size: 24px; font-weight: 800; font-family: var(--font-display); background: transparent; border: none; padding: 0; color: var(--text-1); }
        .minimal-input { background: transparent; border: none; padding: 4px 0; color: var(--text-1); outline: none; width: 100%; }
        .section-label { font-size: 11px; font-weight: 800; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 0 12px 0; }
        .roster-header { display: flex; justify-content: space-between; align-items: flex-end; }
        .player-row { display: flex; align-items: center; gap: 20px; padding: 12px 16px; border-left: 3px solid var(--accent); }
        .player-index { width: 24px; font-weight: 800; color: var(--text-3); font-size: 13px; }
        .tiny-label { display: block; font-size: 9px; color: var(--text-3); text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
        .player-photo-upload {
          width: 40px;
          height: 40px;
          background: var(--bg-3);
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: var(--text-3);
          cursor: pointer;
          position: relative;
          border: 1px solid var(--border);
          flex-shrink: 0;
          overflow: hidden;
        }
        .player-photo-upload img { width: 100%; height: 100%; object-fit: cover; }
        .photo-edit-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; color: white; }
        .player-photo-upload:hover .photo-edit-overlay { opacity: 1; }
        .player-photo-upload:hover { border-color: var(--accent); }
        .bold-handle { font-weight: 700; color: var(--accent); }
        .minimal-select { background: transparent; border: none; color: var(--text-1); width: 100%; outline: none; cursor: pointer; }
        .card-empty { padding: 40px; text-align: center; color: var(--text-3); border: 2px dashed var(--border); border-radius: 12px; font-style: italic; }
        .text-danger:hover { color: #ff4444; }
      `}</style>
    </motion.div>
  )
}
