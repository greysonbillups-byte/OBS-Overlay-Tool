/**
 * Game API Service
 * Provides auto-pull hooks for each supported game.
 * Each game returns a normalized match object compatible with the store.
 */

// ── League of Legends ────────────────────────────────────────────────────────
// Uses the Live Client Data API (localhost:2999) when a game is running
export async function fetchLeagueData() {
  try {
    const res = await fetch('https://127.0.0.1:2999/liveclientdata/allgamedata', {
      // LoL uses a self-signed cert
      signal: AbortSignal.timeout(3000)
    })
    if (!res.ok) return null
    const data = await res.json()

    const teams = { ORDER: { score: 0 }, CHAOS: { score: 0 } }
    data.allPlayers?.forEach(p => {
      if (p.team === 'ORDER') teams.ORDER.score += p.scores?.kills || 0
      else teams.CHAOS.score += p.scores?.kills || 0
    })

    return {
      game: 'lol',
      timer: formatTime(data.gameData?.gameTime || 0),
      teamA: { score: teams.ORDER.score },
      teamB: { score: teams.CHAOS.score }
    }
  } catch {
    return null
  }
}

// ── Valorant ─────────────────────────────────────────────────────────────────
// Uses the Valorant Local API (localhost:various ports set by lockfile)
export async function fetchValorantData() {
  // Valorant local API requires reading the lockfile for port/password
  // Stub: return null until lockfile path is configured
  // Full implementation: read %LOCALAPPDATA%\Riot Games\Riot Client\Config\lockfile
  return null
}

// ── CS2 ───────────────────────────────────────────────────────────────────────
// Uses CS2 Game State Integration (GSI) — requires gamestate_integration config
// The user must place a .cfg file in their CS2 cfg folder
export function createCS2GSIServer(onData, port = 3131) {
  // In Electron, this would use Node's http module via ipcMain
  // For renderer process, we use a simple polling websocket bridge
  console.log(`CS2 GSI: configure CS2 to POST to http://localhost:${port}`)
  return {
    start: () => console.log('CS2 GSI server would start here (main process)'),
    stop: () => console.log('CS2 GSI server stopped')
  }
}

// ── Rocket League ─────────────────────────────────────────────────────────────
// Uses BakkesMod WebSocket plugin (localhost:49322)
export async function fetchRocketLeagueData() {
  try {
    const ws = new WebSocket('ws://localhost:49322')
    return new Promise((resolve) => {
      const timeout = setTimeout(() => { ws.close(); resolve(null) }, 3000)
      ws.onmessage = (e) => {
        clearTimeout(timeout)
        ws.close()
        try {
          const data = JSON.parse(e.data)
          resolve({
            game: 'rl',
            teamA: { score: data?.game?.teams?.[0]?.score || 0 },
            teamB: { score: data?.game?.teams?.[1]?.score || 0 },
            timer: data?.game?.time_seconds ? formatTime(data.game.time_seconds) : '0:00',
            isOT: data?.game?.is_overtime || false
          })
        } catch { resolve(null) }
      }
      ws.onerror = () => { clearTimeout(timeout); resolve(null) }
    })
  } catch {
    return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const GAME_CONFIGS = {
  lol: {
    label: 'League of Legends',
    color: '#C89B3C',
    fetchFn: fetchLeagueData,
    interval: 5000,
    setupNote: 'Requires a game to be running. Uses Riot Live Client API on port 2999.',
    maps: ['Summoner\'s Rift', 'Howling Abyss'],
    modes: ['Standard', 'ARAM']
  },
  valorant: {
    label: 'Valorant',
    color: '#FF4655',
    fetchFn: fetchValorantData,
    interval: 5000,
    setupNote: 'Requires Valorant running. Reads from Riot lockfile for auth.',
    maps: ['Ascent', 'Bind', 'Haven', 'Icebox', 'Lotus', 'Split', 'Sunset', 'Breeze', 'Fracture', 'Pearl'],
    modes: ['Standard', 'Spike Rush', 'Deathmatch', 'Escalation', 'Swiftplay']
  },
  cs2: {
    label: 'CS2',
    color: '#F0A500',
    fetchFn: null,
    interval: null,
    setupNote: 'Requires Game State Integration config in CS2 cfg folder. See docs.',
    maps: ['Ancient', 'Anubis', 'Inferno', 'Mirage', 'Nuke', 'Overpass', 'Vertigo', 'Dust II'],
    modes: ['Competitive', 'Wingman', 'Deathmatch']
  },
  rl: {
    label: 'Rocket League',
    color: '#0072CE',
    fetchFn: fetchRocketLeagueData,
    interval: 3000,
    setupNote: 'Requires BakkesMod with WebSocket plugin on port 49322.',
    maps: ['DFH Stadium', 'Mannfield', 'Champions Field', 'Urban Central', 'Beckwith Park', 'Utopia Coliseum'],
    modes: ['1v1', '2v2', '3v3', 'Rumble', 'Hoops', 'Snow Day']
  },
  generic: {
    label: 'Generic / Manual',
    color: '#6366f1',
    fetchFn: null,
    interval: null,
    setupNote: 'Manual input only.',
    maps: ['Map 1', 'Map 2', 'Map 3', 'Map 4', 'Map 5'],
    modes: ['Standard', 'Other']
  }
}
