class DiamondRushSoundEngine {
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

  public playDig() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06)
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.06)
  }

  public playBoulderThud() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(90, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.12)
  }

  public playGemPickup() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.09)
  }

  public playDiamondPickup() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [659.25, 880, 1046.5, 1318.5]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.04
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.06, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.08)
    })
  }

  public playSnakeHiss() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(450, now)
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  public playSquash() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(120, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.2)
  }

  public playVictory() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [440, 554.37, 659.25, 880] // A major fanfare
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.12
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.25)
    })
  }

  public playGameOver() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [329.63, 293.66, 261.63, 220]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.15
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.07, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.2)
    })
  }

  public playCheat() {
    this.playVictory()
  }
}

export const diamondRushSound = new DiamondRushSoundEngine()
