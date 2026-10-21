class NokiaSoundEngine {
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
      // Optional persistence
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
   * Nokia Keypad Beep (dual-tone)
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
   * Ball Bounce Boing
   */
  public playBounce(strength = 1) {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    const baseFreq = 180 + Math.min(strength * 40, 100)
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.7, now + 0.03)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.09)

    const volume = Math.min(0.07, 0.03 + strength * 0.02)
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.09)
  }

  /**
   * Trampoline / Super Bounce
   */
  public playSuperBounce() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(260, now)
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.16)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.18)
  }

  /**
   * Nokia Ring Pickup Chime (iconic 2 notes)
   */
  public playRing() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.05, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + dur)
    }

    playTone(1318, now, 0.07) // E6
    playTone(1760, now + 0.07, 0.12) // A6
  }

  /**
   * Ball Pop (burst into pieces)
   */
  public playPop() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime

    // Low pitch drop
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.14)

    gain.gain.setValueAtTime(0.09, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.14)

    // Noise crack
    try {
      const bufferSize = ctx.sampleRate * 0.08
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.08, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      noise.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.start(now)
    } catch {
      // Noise fallback
    }
  }

  /**
   * Expander Pump (Big Ball) / Deflater
   */
  public playPump(isExpand: boolean) {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    const startF = isExpand ? 240 : 580
    const endF = isExpand ? 580 : 240

    osc.frequency.setValueAtTime(startF, now)
    osc.frequency.exponentialRampToValueAtTime(endF, now + 0.15)

    gain.gain.setValueAtTime(0.07, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.16)
  }

  /**
   * Checkpoint Reached
   */
  public playCheckpoint() {
    const ctx = this.initCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1046, now) // C6
    gain.gain.setValueAtTime(0.07, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.2)
  }

  /**
   * Exit Gate Unlocked
   */
  public playExitOpen() {
    const ctx = this.initCtx()
    if (!ctx) return
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.08
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.05, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + 0.1)
    })
  }

  /**
   * Nokia Level Complete Fanfare
   */
  public playLevelWin() {
    const ctx = this.initCtx()
    if (!ctx) return
    // Classic Nokia monophonic celebratory melody
    const notes = [
      { f: 659.25, d: 0.12 }, // E5
      { f: 587.33, d: 0.12 }, // D5
      { f: 739.99, d: 0.14 }, // F#5
      { f: 830.61, d: 0.14 }, // G#5
      { f: 554.37, d: 0.14 }, // C#5
      { f: 493.88, d: 0.14 }, // B4
      { f: 587.33, d: 0.3 }   // D5
    ]

    let time = ctx.currentTime
    notes.forEach(n => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(n.f, time)

      gain.gain.setValueAtTime(0.06, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + n.d - 0.02)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(time)
      osc.stop(time + n.d)
      time += n.d
    })
  }

  /**
   * Game Over Jingle
   */
  public playGameOver() {
    const ctx = this.initCtx()
    if (!ctx) return
    const notes = [392.00, 311.13, 261.63] // G4, Eb4, C4
    let time = ctx.currentTime
    notes.forEach((freq, idx) => {
      const dur = idx === 2 ? 0.35 : 0.18
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, time)

      gain.gain.setValueAtTime(0.07, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur - 0.02)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(time)
      osc.stop(time + dur)
      time += dur
    })
  }

  /**
   * Secret Cheat Code Sound (787898)
   */
  public playCheat() {
    const ctx = this.initCtx()
    if (!ctx) return
    const notes = [523.25, 783.99, 1046.5, 1318.51, 1567.98]
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.06
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.08, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + 0.12)
    })
  }
}

export const nokiaSound = new NokiaSoundEngine()
