class RapidRollSoundEngine {
  private ctx: AudioContext | null = null
  private muted = false

  constructor() {
    try {
      this.muted = localStorage.getItem('arcade-sound') === 'off'
    } catch {
      this.muted = false
    }
  }

  public setMuted(mute: boolean) {
    this.muted = mute
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

  public playLand() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.05)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  }

  public playBounceSpring() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(260, now)
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.15)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.18)
  }

  public playHeartPickup() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.05
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.07, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.09)
    })
  }

  public playStarPickup() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.14)
  }

  public playSpikeHit() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.18)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.2)
  }

  public playGameOver() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [392.0, 349.23, 311.13, 261.63] // G4, F4, Eb4, C4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.15
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.18)
    })
  }

  public playCheat() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.06
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.07, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.12)
    })
  }
}

export const rapidRollSound = new RapidRollSoundEngine()
