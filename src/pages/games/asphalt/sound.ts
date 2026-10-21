class AsphaltSoundEngine {
  private ctx: AudioContext | null = null
  private muted = false
  private engineOsc: OscillatorNode | null = null
  private engineGain: GainNode | null = null

  constructor() {
    try {
      this.muted = localStorage.getItem('arcade-sound') === 'off'
    } catch {
      this.muted = false
    }
  }

  public setMuted(mute: boolean) {
    this.muted = mute
    this.stopEngine()
    try {
      localStorage.setItem('arcade-sound', mute ? 'off' : 'on')
    } catch {
      // Ignore
    }
  }

  public isMuted(): boolean {
    return this.muted
  }

  private initCtx(): AudioContext | null {
    if (this.muted) return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  public playKeyClick() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1100, now)
    gain.gain.setValueAtTime(0.04, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.035)
  }

  public updateEngine(speedKmH: number) {
    const ctx = this.initCtx()
    if (!ctx) return

    if (!this.engineOsc) {
      this.engineOsc = ctx.createOscillator()
      this.engineGain = ctx.createGain()
      this.engineOsc.type = 'sawtooth'
      this.engineGain.gain.setValueAtTime(0.02, ctx.currentTime)
      this.engineOsc.connect(this.engineGain)
      this.engineGain.connect(ctx.destination)
      this.engineOsc.start()
    }

    const freq = 45 + (speedKmH / 220) * 110
    this.engineOsc.frequency.setValueAtTime(freq, ctx.currentTime)
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop()
        this.engineOsc.disconnect()
      } catch {
        // Ignore
      }
      this.engineOsc = null
      this.engineGain = null
    }
  }

  public playNitro() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const bufferSize = Math.floor(ctx.sampleRate * 0.25)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI)
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(400, now)
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.2)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.09, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
  }

  public playDrift() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(280, now)
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08)
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.08)
  }

  public playCrash() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(120, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.28)
  }

  public playPickup() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(659.25, now) // E5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08) // C6
    gain.gain.setValueAtTime(0.07, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  public playSiren() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.linearRampToValueAtTime(900, now + 0.15)
    osc.frequency.linearRampToValueAtTime(600, now + 0.3)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  }

  public playGameOver() {
    this.stopEngine()
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [349.23, 311.13, 277.18, 220.0]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.15
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.2)
    })
  }

  public playVictory() {
    this.stopEngine()
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.1
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.18)
    })
  }
}

export const asphaltSound = new AsphaltSoundEngine()
