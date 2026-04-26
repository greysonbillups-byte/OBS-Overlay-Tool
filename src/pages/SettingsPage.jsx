import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Pencil, Lock } from 'lucide-react'
import { useStore } from '../store'
import { GAME_CONFIGS } from '../services/gameApiService'

const EMPTY_GAME = {
  label: '',
  color: '#6366f1',
  maps: [],
  modes: [],
  setupNote: '',
  fetchFn: null,
  interval: null,
  builtIn: false,
}

export default function SettingsPage() {
  const { customGames, addCustomGame, updateCustomGame, deleteCustomGame } = useStore()
  const allGames = { ...GAME_CONFIGS, ...customGames }

  const [editing, setEditing] = useState(null)   // game key being edited, or 'new'
  const [form, setForm] = useState(EMPTY_GAME)
  const [mapInput, setMapInput] = useState('')
  const [modeInput, setModeInput] = useState('')

  const openNew = () => {
    setForm(EMPTY_GAME)
    setEditing('new')
  }

  const openEdit = (key) => {
    setForm({ ...allGames[key] })
    setEditing(key)
  }

  const handleSave = () => {
    if (!form.label.trim()) return
    // Generate a key from the label if new
    const key = editing === 'new'
      ? form.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      : editing

    if (editing === 'new') {
      addCustomGame(key, form)
    } else {
      updateCustomGame(key, form)
    }
    setEditing(null)
  }

  const handleDelete = (key) => {
    deleteCustomGame(key)
    if (editing === key) setEditing(null)
  }

  // Tag input helpers
  const addMap = () => {
    const val = mapInput.trim()
    if (val && !form.maps.includes(val)) {
      setForm(f => ({ ...f, maps: [...f.maps, val] }))
    }
    setMapInput('')
  }

  const addMode = () => {
    const val = modeInput.trim()
    if (val && !form.modes.includes(val)) {
      setForm(f => ({ ...f, modes: [...f.modes, val] }))
    }
    setModeInput('')
  }

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage games, maps, and modes.</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> New Game
        </button>
      </div>

      <div className="grid-2" style={{ gap: 20, alignItems: 'flex-start' }}>

        {/* Game List */}
        <div className="card">
          <div className="card-title">Games</div>
          {Object.entries(allGames).map(([key, game]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 6, marginBottom: 6,
              background: 'var(--bg-3)', border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: game.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{game.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {game.maps.length} maps · {game.modes.length} modes
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {game.builtIn ? (
                  <span title="Built-in game" style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                    <Lock size={13} />
                  </span>
                ) : (
                  <>
                    <button className="btn-icon" onClick={() => openEdit(key)}><Pencil size={13} /></button>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(key)}><Trash2 size={13} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Editor Form */}
        {editing && (
          <div className="card">
            <div className="card-title">{editing === 'new' ? 'New Game' : `Edit · ${form.label}`}</div>

            <div className="form-group">
              <label className="form-label">Game Name</label>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Overwatch 2" />
            </div>

            <div className="form-group">
              <label className="form-label">Accent Color</label>
              <div className="color-input-row">
                <div className="color-swatch">
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                </div>
                <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="#6366f1" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Setup Note</label>
              <input value={form.setupNote} onChange={e => setForm(f => ({ ...f, setupNote: e.target.value }))} placeholder="Optional setup instructions" />
            </div>

            {/* Maps tag input */}
            <div className="form-group">
              <label className="form-label">Maps</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={mapInput}
                  onChange={e => setMapInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMap()}
                  placeholder="Type map name, press Enter"
                />
                <button className="btn btn-ghost" onClick={addMap} style={{ flexShrink: 0 }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {form.maps.map(map => (
                  <span key={map} className="tag tag-accent" style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setForm(f => ({ ...f, maps: f.maps.filter(m => m !== map) }))}>
                    {map} ×
                  </span>
                ))}
              </div>
            </div>

            {/* Modes tag input */}
            <div className="form-group">
              <label className="form-label">Modes</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={modeInput}
                  onChange={e => setModeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMode()}
                  placeholder="Type mode name, press Enter"
                />
                <button className="btn btn-ghost" onClick={addMode} style={{ flexShrink: 0 }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {form.modes.map(mode => (
                  <span key={mode} className="tag tag-accent" style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setForm(f => ({ ...f, modes: f.modes.filter(m => m !== mode) }))}>
                    {mode} ×
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
                Save Game
              </button>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  )
}