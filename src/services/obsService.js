import OBSWebSocket from 'obs-websocket-js'

class OBSService {
  constructor() {
    this.obs = new OBSWebSocket()
    this.connected = false
    this.listeners = new Map()
  }

  async connect(host = 'localhost', port = 4455, password = '') {
    try {
      const { obsWebSocketVersion } = await this.obs.connect(
        `ws://${host}:${port}`,
        password
      )
      this.connected = true
      console.log(`Connected to OBS WebSocket v${obsWebSocketVersion}`)
      this._setupEventListeners()
      return { success: true, version: obsWebSocketVersion }
    } catch (err) {
      this.connected = false
      return { success: false, error: err.message }
    }
  }

  async disconnect() {
    await this.obs.disconnect()
    this.connected = false
  }

  _setupEventListeners() {
    this.obs.on('SceneTransitionStarted', (data) => this._emit('sceneTransition', data))
    this.obs.on('CurrentProgramSceneChanged', (data) => this._emit('sceneChanged', data))
    this.obs.on('StreamStateChanged', (data) => this._emit('streamState', data))
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return
    this.listeners.set(event, this.listeners.get(event).filter(cb => cb !== callback))
  }

  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data))
    }
  }

  // ── Scenes ──────────────────────────────────────────────────
  async getScenes() {
    if (!this.connected) return []
    try {
      const { scenes, currentProgramSceneName } = await this.obs.call('GetSceneList')
      return { scenes: scenes.reverse(), current: currentProgramSceneName }
    } catch { return { scenes: [], current: null } }
  }

  async switchScene(sceneName) {
    if (!this.connected) return false
    try {
      await this.obs.call('SetCurrentProgramScene', { sceneName })
      return true
    } catch { return false }
  }

  // ── Sources / Inputs ─────────────────────────────────────────
  async getInputList() {
    if (!this.connected) return []
    try {
      const { inputs } = await this.obs.call('GetInputList')
      return inputs
    } catch { return [] }
  }

  async setInputVisible(sceneName, sourceName, visible) {
    if (!this.connected) return false
    try {
      const { sceneItems } = await this.obs.call('GetSceneItemList', { sceneName })
      const item = sceneItems.find(i => i.sourceName === sourceName)
      if (!item) return false
      await this.obs.call('SetSceneItemEnabled', {
        sceneName,
        sceneItemId: item.sceneItemId,
        sceneItemEnabled: visible
      })
      return true
    } catch { return false }
  }

  // ── Browser Sources (for overlays) ───────────────────────────
  async updateBrowserSource(sourceName, url) {
    if (!this.connected) return false
    try {
      await this.obs.call('SetInputSettings', {
        inputName: sourceName,
        inputSettings: { url }
      })
      return true
    } catch { return false }
  }

  async refreshBrowserSource(sourceName) {
    if (!this.connected) return false
    try {
      await this.obs.call('PressInputPropertiesButton', {
        inputName: sourceName,
        propertyName: 'refreshnocache'
      })
      return true
    } catch { return false }
  }

  // ── Transitions ───────────────────────────────────────────────
  async getTransitions() {
    if (!this.connected) return []
    try {
      const { transitions, currentSceneTransitionName } = await this.obs.call('GetSceneTransitionList')
      return { transitions, current: currentSceneTransitionName }
    } catch { return { transitions: [], current: null } }
  }

  async setTransition(transitionName) {
    if (!this.connected) return false
    try {
      await this.obs.call('SetCurrentSceneTransition', { transitionName })
      return true
    } catch { return false }
  }

  async triggerTransition() {
    if (!this.connected) return false
    try {
      await this.obs.call('TriggerStudioModeTransition')
      return true
    } catch { return false }
  }

  // ── Stream / Record ───────────────────────────────────────────
  async getStreamStatus() {
    if (!this.connected) return null
    try {
      return await this.obs.call('GetStreamStatus')
    } catch { return null }
  }

  async toggleStream() {
    if (!this.connected) return false
    try {
      await this.obs.call('ToggleStream')
      return true
    } catch { return false }
  }
}

export const obsService = new OBSService()
