class SpaceImpactSoundEngine {
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
      // Ignore storage errors
    }
  }

  public isMuted(): boolean {
    return this.muted
  }

  private initCtx(): AudioContext | null {
    if (this.muted) return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  /**
   * Nokia Keypad Click
   */
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

  /**
   * Player Blaster Shot (classic high chirp)
   */
  public playLaser() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(1250, now)
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.045)

    gain.gain.setValueAtTime(0.04, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  }

  /**
   * Special Weapon: Rocket / Missile Launch
   */
  public playRocket() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.linearRampToValueAtTime(540, now + 0.12)

    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  /**
   * Special Weapon: Mega Laser Beam
   */
  public playLaserBeam() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.setValueAtTime(880, now + 0.08)
    osc.frequency.setValueAtTime(440, now + 0.16)

    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.3)
  }

  /**
   * Special Weapon: Screen EMP Bomb
   */
  public playBomb() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    // Low rumble boom
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(120, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.45)
  }

  /**
   * Enemy hit tick
   */
  public playHit() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(440, now)

    gain.gain.setValueAtTime(0.03, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.02)
  }

  /**
   * Enemy Explosion (synthesized 8-bit burst)
   */
  public playExplosion(size: 'small' | 'medium' | 'large' = 'small') {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const duration = size === 'large' ? 0.35 : size === 'medium' ? 0.2 : 0.12
    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      // White noise with exponential falloff
      data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * (i / bufferSize))
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    // Lowpass filter for chunky retro explosion
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(size === 'large' ? 500 : 900, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(size === 'large' ? 0.09 : 0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(now)
  }

  /**
   * Player Shield Damage Buzz
   */
  public playPlayerHit() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.linearRampToValueAtTime(80, now + 0.15)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  /**
   * Player Ship Destroyed / Death
   */
  public playPlayerDeath() {
    this.playExplosion('large')
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(300, now + 0.05)
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.4)

    gain.gain.setValueAtTime(0.07, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + 0.05)
    osc.stop(now + 0.45)
  }

  /**
   * Power-up Pickup (Ascending Nokia Chime)
   */
  public playPowerup() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const notes = [659.25, 880, 1174.66] // E5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const noteTime = now + idx * 0.055

      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, noteTime)

      gain.gain.setValueAtTime(0.05, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.05)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(noteTime)
      osc.stop(noteTime + 0.05)
    })
  }

  /**
   * Boss Warning Alarm Siren
   */
  public playBossAlarm() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + i * 0.18

      osc.type = 'square'
      osc.frequency.setValueAtTime(440, t)
      osc.frequency.setValueAtTime(880, t + 0.08)

      gain.gain.setValueAtTime(0.06, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(t)
      osc.stop(t + 0.16)
    }
  }

  /**
   * Level Victory Fanfare
   */
  public playLevelClear() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.1

      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, t)

      gain.gain.setValueAtTime(0.06, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx === 3 ? 0.35 : 0.09))

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(t)
      osc.stop(t + (idx === 3 ? 0.35 : 0.09))
    })
  }

  /**
   * Game Over Lament (Classic 4-tone descending sequence)
   */
  public playGameOver() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const notes = [440, 415.3, 392, 349.23] // A4, G#4, G4, F4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.18

      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, t)

      gain.gain.setValueAtTime(0.06, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(t)
      osc.stop(t + 0.22)
    })
  }
}

export const spaceSound = new SpaceImpactSoundEngine()
