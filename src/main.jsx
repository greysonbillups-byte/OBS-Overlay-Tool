import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Tv2, Swords, Users, Layout, Settings, Radio } from 'lucide-react'

import ConnectionPage from './pages/ConnectionPage'
import ScoreboardPage from './pages/ScoreboardPage'
import TeamsPage from './pages/TeamsPage'
import OverlaysPage from './pages/OverlaysPage'
import SettingsPage from './pages/SettingsPage'
import Notifications from './components/Notifications'
import StatusBar from './components/StatusBar'
import { useStore } from './store'
import { GAME_CONFIGS } from './services/gameApiService'
import { obsService } from './services/obsService'
import './index.css'

const NAV = [
  { to: '/', icon: Radio, label: 'Connect' },
  { to: '/scoreboard', icon: Swords, label: 'Match' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/overlays', icon: Layout, label: 'Overlays' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function App() {
  const { obsConnected, match, updateMatch, scenes, currentScene, setCurrentScene } = useStore()
  const pollingRef = useRef(null)

  // ── Game API polling ─────────────────────────────────────────
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    const config = GAME_CONFIGS[match.game]
    if (!config?.fetchFn || !config?.interval) return

    const poll = async () => {
      const data = await config.fetchFn()
      if (!data) return
      const updates = {}
      if (data.timer !== undefined) updates.timer = data.timer
      if (data.teamA?.score !== undefined) {
        useStore.getState().updateTeamA({ score: data.teamA.score })
      }
      if (data.teamB?.score !== undefined) {
        useStore.getState().updateTeamB({ score: data.teamB.score })
      }
      if (Object.keys(updates).length) updateMatch(updates)
    }

    poll() // immediate first fetch
    pollingRef.current = setInterval(poll, config.interval)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [match.game])

  // ── Scene switcher via OBS event ─────────────────────────────
  useEffect(() => {
    const onSceneChanged = (data) => setCurrentScene(data.sceneName)
    obsService.on('sceneChanged', onSceneChanged)
    return () => obsService.off('sceneChanged', onSceneChanged)
  }, [setCurrentScene])

  return (
    <HashRouter>
      <div className="app-shell">
        <div className="drag-handle"></div>
        <nav className="sidebar">
          <div className="sidebar-logo">
            <Tv2 size={22} />
            <span>OBS<br />Control</span>
          </div>
          <div className={`conn-dot ${obsConnected ? 'live' : ''}`} title={obsConnected ? 'OBS Connected' : 'Not connected'} />
          <div className="nav-links">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Scene Switcher */}
          {obsConnected && scenes.length > 0 && (
            <div style={{ width: '100%', padding: '0 8px', marginTop: 8 }}>
              <div style={{
                fontSize: 8, fontFamily: 'var(--font-display)', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--text-3)', textAlign: 'center', marginBottom: 6
              }}>
                Scenes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {scenes.map(scene => {
                  const name = scene.sceneName
                  const isActive = name === currentScene
                  return (
                    <button
                      key={name}
                      title={name}
                      onClick={() => obsService.switchScene(name).then(() => setCurrentScene(name))}
                      style={{
                        background: isActive ? 'var(--accent-glow)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                        borderRadius: 6,
                        color: isActive ? 'var(--accent)' : 'var(--text-3)',
                        cursor: 'pointer',
                        fontSize: 9,
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        padding: '5px 6px',
                        textAlign: 'left',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        transition: 'all 0.15s'
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="sidebar-version" style={{ marginTop: 'auto' }}>v1.0.0</div>
        </nav>

        <main className="main-content">
          <div className="global-game-selector">
            <div className="game-selector">
              <label>Game:</label>
              <select value={match.game} onChange={e => updateMatch({ game: e.target.value })}>
                {Object.entries(GAME_CONFIGS).map(([key, g]) => (
                  <option key={key} value={key}>{g.label}</option>
                ))}
              </select>
            </div>
            {GAME_CONFIGS[match.game]?.setupNote && (
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {GAME_CONFIGS[match.game].setupNote}
              </span>
            )}
          </div>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<ConnectionPage />} />
              <Route path="/scoreboard" element={<ScoreboardPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/players" element={<TeamsPage />} />
              <Route path="/overlays" element={<OverlaysPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AnimatePresence>
        </main>

        <StatusBar />
        <Notifications />
      </div>
    </HashRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
