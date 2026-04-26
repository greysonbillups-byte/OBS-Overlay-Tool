import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MAX_MAP_SLOTS = 10

function createMapSlot(index) {
  return {
    id: `M${index + 1}`,
    map: '',
    mode: '',
    scoreA: 0,
    scoreB: 0,
    played: false,
  }
}

export const useStore = create(
  persist(
    (set, get) => ({
  // ── OBS Connection ───────────────────────────────────────────
  obsConnected: false,
  obsConfig: { host: 'localhost', port: '4455', password: '' },
  scenes: [],
  currentScene: null,
  transitions: [],
  currentTransition: null,

  setOBSConnected: (connected) => set({ obsConnected: connected }),
  setOBSConfig: (config) => set({ obsConfig: config }),
  setScenes: (scenes, current) => set({ scenes, currentScene: current }),
  setCurrentScene: (scene) => set({ currentScene: scene }),
  setTransitions: (transitions, current) => set({ transitions, currentTransition: current }),

  // ── Match / Scoreboard ───────────────────────────────────────
  match: {
    game: 'generic',
    teamA: { name: 'Team Alpha', score: 0, logo: '', color: '#3b82f6' },
    teamB: { name: 'Team Beta', score: 0, logo: '', color: '#ef4444' },
    map: '',
    maps: 3,
    status: 'live',
    timer: '00:00',
    selectedSchoolA: '',
    selectedSchoolB: '',
  },

updateMatch: (updates) => set(state => {
  const newMatch = { ...state.match, ...updates }

  // Reset map/mode selections when game changes
  if (updates.game !== undefined && updates.game !== state.match.game) {
    return {
      match: newMatch,
      mapSlots: state.mapSlots.map(slot => ({ ...slot, map: '', mode: '' }))
    }
  }

  // Sync map slots count when maps changes
  if (updates.maps !== undefined) {
      const desired = Math.min(Math.max(updates.maps, 1), MAX_MAP_SLOTS)
      const current = state.mapSlots
      let newSlots
      if (current.length > desired) {
        newSlots = current.slice(0, desired)
      } else if (current.length < desired) {
        newSlots = [
          ...current,
          ...Array.from({ length: desired - current.length }, (_, i) => createMapSlot(current.length + i))
        ]
      } else {
        newSlots = current
      }
      return { match: newMatch, mapSlots: newSlots }
    }
    return { match: newMatch }
  }),

  updateTeamA: (updates) => set(state => ({
    match: { ...state.match, teamA: { ...state.match.teamA, ...updates } }
  })),
  updateTeamB: (updates) => set(state => ({
    match: { ...state.match, teamB: { ...state.match.teamB, ...updates } }
  })),
  incrementScore: (team) => set(state => ({
    match: {
      ...state.match,
      [team]: { ...state.match[team], score: state.match[team].score + 1 }
    }
  })),
  decrementScore: (team) => set(state => ({
    match: {
      ...state.match,
      [team]: { ...state.match[team], score: Math.max(0, state.match[team].score - 1) }
    }
  })),
resetMatch: () => set(state => ({
  match: {
    ...state.match,
    teamA: { ...state.match.teamA, score: 0 },
    teamB: { ...state.match.teamB, score: 0 },
    status: 'pregame',
    timer: '00:00',
    selectedSchoolA: '',  // ← moved inside match
    selectedSchoolB: '',  // ← moved inside match
  },
  mapSlots: Array.from({ length: state.match.maps }, (_, i) => createMapSlot(i))
})),

  // ── Map Slots (persisted in store so they survive navigation) ─
  mapSlots: Array.from({ length: 3 }, (_, i) => createMapSlot(i)),

  setMapSlot: (index, updates) => set(state => ({
    mapSlots: state.mapSlots.map((slot, i) => i === index ? { ...slot, ...updates } : slot)
  })),

  // ── Players ──────────────────────────────────────────────────
  players: {
    teamA: Array(5).fill(null).map((_, i) => ({
      id: `a${i}`, name: `Player ${i + 1}`, role: '', handle: '', photo: '',
      stats: { kills: 0, deaths: 0, assists: 0 }, visible: false
    })),
    teamB: Array(5).fill(null).map((_, i) => ({
      id: `b${i}`, name: `Player ${i + 1}`, role: '', handle: '', photo: '',
      stats: { kills: 0, deaths: 0, assists: 0 }, visible: false
    }))
  },

  updatePlayer: (team, index, updates) => set(state => ({
    players: {
      ...state.players,
      [team]: state.players[team].map((p, i) => i === index ? { ...p, ...updates } : p)
    }
  })),

  // ── Schools & Collegiate Teams ───────────────────────────────
  schools: [],
  setSchools: (schools) => set({ schools }),

  // ── Overlays ─────────────────────────────────────────────────
  overlays: {
    scoreboard: { visible: false, position: 'top-center', style: 'modern' },
    playerCards: { visible: false, team: 'teamA', playerIndex: 0 },
    lowerThird: { visible: false, text: '', subtext: '' },
    matchBanner: { visible: false },
    intermission: { visible: false, text: 'BE RIGHT BACK' }
  },

  toggleOverlay: (name) => set(state => ({
    overlays: {
      ...state.overlays,
      [name]: { ...state.overlays[name], visible: !state.overlays[name].visible }
    }
  })),
  updateOverlay: (name, updates) => set(state => ({
    overlays: {
      ...state.overlays,
      [name]: { ...state.overlays[name], ...updates }
    }
  })),

  // ── Custom Games ─────────────────────────────────────────────
customGames: {},

addCustomGame: (key, game) => set(state => ({
  customGames: { ...state.customGames, [key]: game }
})),

updateCustomGame: (key, updates) => set(state => ({
  customGames: {
    ...state.customGames,
    [key]: { ...state.customGames[key], ...updates }
  }
})),

deleteCustomGame: (key) => set(state => {
  const { [key]: _, ...rest } = state.customGames
  return { customGames: rest }
}),

  // ── Notifications ────────────────────────────────────────────
  notifications: [],
  addNotification: (msg, type = 'info') => {
    const id = Date.now()
    set(state => ({ notifications: [...state.notifications, { id, msg, type }] }))
    setTimeout(() => {
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }))
    }, 3500)
  }
    }),
    { name: 'obs-overlay-storage' }
  )
)