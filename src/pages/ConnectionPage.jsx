import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { obsService } from '../services/obsService'
import { useStore } from '../store'

export default function ConnectionPage() {
  const {
    obsConnected, obsConfig,
    setOBSConnected, setOBSConfig,
    setScenes, setTransitions, setCurrentScene,
    addNotification
  } = useStore()
  const [loading, setLoading] = useState(false)
  const [cfg, setCfg] = useState(obsConfig || { host: 'localhost', port: '4455', password: '' })
  const [streamStatus, setStreamStatus] = useState(null)

  const connect = async () => {
    setLoading(true)
    const result = await obsService.connect(cfg.host, cfg.port, cfg.password)
    if (result.success) {
      setOBSConnected(true)
      setOBSConfig(cfg)
      addNotification(`Connected to OBS WebSocket ${result.version}`, 'success')
      const { scenes, current } = await obsService.getScenes()
      setScenes(scenes, current)
      const { transitions, current: ct } = await obsService.getTransitions()
      setTransitions(transitions, ct)
      const status = await obsService.getStreamStatus()
      setStreamStatus(status)
    } else {
      addNotification(`Connection failed: ${result.error}`, 'error')
    }
    setLoading(false)
  }

  const disconnect = async () => {
    await obsService.disconnect()
    setOBSConnected(false)
    addNotification('Disconnected from OBS', 'info')
  }

  useEffect(() => {
    const onStreamState = (data) => {
      setStreamStatus(s => ({ ...s, outputActive: data.outputActive }))
    }
    const onSceneChanged = (data) => {
      if (data?.sceneName) setCurrentScene(data.sceneName)
    }

    obsService?.on?.('streamState', onStreamState)
    obsService?.on?.('sceneChanged', onSceneChanged)

    return () => {
      obsService?.off?.('streamState', onStreamState)
      obsService?.off?.('sceneChanged', onSceneChanged)
    }
  }, [setCurrentScene])

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="page-header">
        <div className="page-title">OBS Connection</div>
        <div className="page-subtitle">Connect to OBS Studio via WebSocket (OBS 28+ required)</div>
      </div>

      <div className="grid-2" style={{ maxWidth: 800 }}>
        <div className="card">
          <div className="card-title">WebSocket Settings</div>
          <div className="form-group">
            <label className="form-label">Host</label>
            <input value={cfg.host} onChange={e => setCfg(c => ({ ...c, host: e.target.value }))} placeholder="localhost" disabled={obsConnected} />
          </div>
          <div className="form-group">
            <label className="form-label">Port</label>
            <input value={cfg.port} onChange={e => setCfg(c => ({ ...c, port: e.target.value }))} placeholder="4455" disabled={obsConnected} />
          </div>
          <div className="form-group">
            <label className="form-label">Password (if set)</label>
            <input type="password" value={cfg.password} onChange={e => setCfg(c => ({ ...c, password: e.target.value }))} placeholder="••••••••" disabled={obsConnected} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {!obsConnected ? (
              <button className="btn btn-primary" onClick={connect} disabled={loading} style={{ flex: 1 }}>
                {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Wifi size={14} />}
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            ) : (
              <button className="btn btn-danger" onClick={disconnect} style={{ flex: 1 }}>
                <WifiOff size={14} /> Disconnect
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StatusRow label="OBS WebSocket" value={obsConnected ? 'Connected' : 'Not Connected'} active={obsConnected} />
            <StatusRow label="Stream" value={streamStatus?.outputActive ? 'LIVE' : 'Offline'} active={streamStatus?.outputActive} />
            <StatusRow label="Host" value={`${obsConfig?.host || 'localhost'}:${obsConfig?.port || '4455'}`} />
          </div>

          {obsConnected && (
            <div style={{ marginTop: 20 }}>
              <div className="card-title">Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className={`btn ${streamStatus?.outputActive ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => obsService.toggleStream()}
                >
                  {streamStatus?.outputActive ? 'Stop Stream' : 'Start Stream'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800, marginTop: 20 }}>
        <div className="card-title">Setup Guide</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
          {[
            'Open OBS Studio (version 28 or newer)',
            'Go to Tools → WebSocket Server Settings',
            'Enable the WebSocket server',
            'Note the port (default: 4455) and set a password if desired',
            'Enter those details above and click Connect'
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11, minWidth: 20, paddingTop: 1 }}>{String(i + 1).padStart(2, '0')}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function StatusRow({ label, value, active }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{label}</span>
      <span className={`tag ${active ? 'tag-live' : 'tag-offline'}`}>{value}</span>
    </div>
  )
}
