import React from 'react'
import { useStore } from '../store'

export default function StatusBar() {
  const { obsConnected, currentScene, match } = useStore()
  return (
    <div className="status-bar">
      <div className={`dot ${obsConnected ? 'live' : ''}`} />
      <span>{obsConnected ? 'OBS Connected' : 'OBS Offline'}</span>
      {currentScene && <><span style={{ color: 'var(--bg-4)' }}>|</span><span>Scene: {currentScene}</span></>}
      <span style={{ color: 'var(--bg-4)' }}>|</span>
      <span style={{ fontFamily: 'var(--font-mono)' }}>
        {match?.teamA?.name || 'Team A'} {match?.teamA?.score ?? 0} – {match?.teamB?.score ?? 0} {match?.teamB?.name || 'Team B'}
      </span>
      <span style={{ marginLeft: 'auto', opacity: 0.5 }}>OBS Overlay Controller</span>
    </div>
  )
}
