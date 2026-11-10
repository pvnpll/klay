import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Maximize, Pause, Play, RotateCcw, Shield, Sparkles, Swords, Wind, Cherry, Zap } from 'lucide-react'
import type { Controls, Snapshot } from './hanuman/engine'
import './hanuman/hanuman.css'

const initial: Snapshot = { health: 100, seals: 0, enemies: 5, status: 'ready', message: '', leap: 0, x: 0, z: 14, height: 0, mangoes: 0, score: 0, energy: 0, streak: 0, bossHealth: 0, bossMax: 18, bossAwake: false }
export default function Hanuman() {
  const host = useRef<HTMLDivElement>(null), root = useRef<HTMLDivElement>(null), controls = useRef<Controls | null>(null)
  const [state, setState] = useState(initial), [session, setSession] = useState(0), [error, setError] = useState(''), [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let disposed = false
    setLoaded(false)
    import('./hanuman/engine').then(({ createWorld }) => {
      if (disposed || !host.current) return
      try { controls.current = createWorld(host.current, setState); setLoaded(true) }
      catch { setError('This scene needs WebGL 2. Try a recent Chrome, Edge, Firefox, or Safari browser with hardware acceleration enabled.') }
    }).catch(() => setError('The 3D engine could not load. Refresh the page to try again.'))
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.closest('input, textarea, select, [contenteditable=true]') || (event.target.closest('button, a') && [' ', 'Enter'].includes(event.key)))) return
      const key = event.key.toLowerCase()
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault()
      controls.current?.keys.add(key)
      if (event.repeat) return
      const action = ({ ' ': 'jump', j: 'attack', l: 'spin', k: 'leap', f: 'interact', escape: 'pause' } as Record<string, string>)[key]
      if (action) controls.current?.action(action)
    }
    const up = (event: KeyboardEvent) => controls.current?.keys.delete(event.key.toLowerCase())
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { disposed = true; window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); controls.current?.dispose(); controls.current = null }
  }, [session])
  const restart = () => { setState(initial); setError(''); setSession(v => v + 1) }
  const act = (name: string) => { controls.current?.action(name); if (document.activeElement instanceof HTMLElement) document.activeElement.blur() }
  const hold = (key: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); controls.current?.keys.add(key); event.currentTarget.blur() },
    onPointerUp: () => controls.current?.keys.delete(key), onPointerCancel: () => controls.current?.keys.delete(key), onLostPointerCapture: () => controls.current?.keys.delete(key),
  })
  const overlay = state.status !== 'playing'
  return <div className="hanuman-game" ref={root} data-status={state.status} data-boss-health={state.bossHealth} data-energy={state.energy} data-mangoes={state.mangoes} data-x={state.x.toFixed(1)} data-z={state.z.toFixed(1)} data-height={state.height.toFixed(1)}>
    <div className="hanuman-scene" ref={host} onPointerDown={event => { if (event.button === 0) event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={event => { if (event.buttons === 1 && state.status === 'playing') controls.current?.orbit(-event.movementX * .006) }} />
    <div className="hanuman-vignette" />
    <header className="hanuman-top">
      <Link to="/" aria-label="Back to all games" className="hanuman-icon"><ArrowLeft size={19} /></Link>
      <div className="hanuman-wordmark">HANUMAN<span>SON OF THE WIND</span></div>
      <div className="hanuman-top-right"><span className="hanuman-prototype">THE MANGO & THE STORM</span><button className="hanuman-icon" aria-label="How to play" onClick={() => { if (state.status === 'playing') act('pause') }}><Shield size={18} /></button><button className="hanuman-icon" aria-label={state.status === 'paused' ? 'Resume game' : 'Pause game'} onClick={() => act('pause')}><Pause size={18} /></button><button className="hanuman-icon" aria-label="Fullscreen" onClick={() => { const operation = document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen(); void operation?.catch(() => {}) }}><Maximize size={18} /></button></div>
    </header>
    {!overlay && <>
      <aside className="hanuman-vitality"><span>VITALITY <b>{state.health}</b></span><div role="progressbar" aria-label="Vitality" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.health}><i style={{ width: `${state.health}%` }} /></div><small><Wind size={13} /> {state.leap > 0 ? `Vayu leap · ${Math.ceil(state.leap)}s` : 'Vayu leap ready'}</small></aside>
      <aside className="hanuman-objective"><small>{state.bossAwake ? "THE FINAL TRIAL" : "THE FIRST TRIAL"}</small><h2>{state.bossAwake ? "Face the Storm Guardian" : "Awaken the sanctuary"}</h2><p><span>{state.seals} / 3</span> Sacred seals awakened</p><p><span>{5 - state.enemies} / 5</span> Shadow guardians defeated</p><p><span><Cherry size={12} /> {state.mangoes}</span> Mangoes collected</p></aside>
      <aside className="hanuman-rewards"><div><small>JOURNEY SCORE</small><strong>{state.score.toLocaleString()}</strong>{state.streak > 1 && <b>×{state.streak} HIT STREAK</b>}</div><button className={`hanuman-storm ${state.energy >= 100 ? "is-ready" : ""}`} onClick={() => act("spin")} aria-label="Gada Storm" aria-disabled={state.energy < 100}><Zap size={16} /><span>{state.energy >= 100 ? "GADA STORM READY" : "GADA STORM"}<small>{state.energy >= 100 ? "L · unleash whirlwind" : `${state.energy}% · mangoes & strikes charge it`}</small></span></button><div className="hanuman-energy" role="progressbar" aria-label="Storm energy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.energy}><i style={{width: `${state.energy}%`}} /></div></aside>
      {state.bossAwake && <div className="hanuman-boss"><small>STORM GUARDIAN</small><div role="progressbar" aria-label="Storm Guardian vitality" aria-valuemin={0} aria-valuemax={state.bossMax} aria-valuenow={state.bossHealth}><i style={{width: `${state.bossHealth / state.bossMax * 100}%`}} /></div><span>Jump over pink waves · Strike between attacks</span></div>}
      <div className="hanuman-message" role="status">{state.message}</div>
      <div className="hanuman-desktop-controls"><span><kbd>W A S D</kbd> Move</span><span><kbd>SHIFT</kbd> Sprint</span><span><kbd>SPACE</kbd> Jump</span><span><kbd>J</kbd> Gada</span><span><kbd>C</kbd> Guard</span><span><kbd>K</kbd> Vayu leap</span><span><kbd>L</kbd> Storm</span><span><kbd>F</kbd> Awaken</span><span><kbd>Q E</kbd> / drag · Camera</span></div>
      <div className="hanuman-touch"><div className="hanuman-dpad"><button {...hold('w')} aria-label="Move forward">↑</button><button {...hold('a')} aria-label="Move left">←</button><button {...hold('s')} aria-label="Move backward">↓</button><button {...hold('d')} aria-label="Move right">→</button></div><div className="hanuman-touch-actions"><button onClick={() => act('attack')} aria-label="Gada strike"><Swords size={22} /></button><button onClick={() => act('leap')} aria-label="Vayu leap"><Wind size={22} /></button><button onClick={() => act('jump')} aria-label="Jump">↑</button><button onClick={() => act('spin')} aria-label="Unleash Gada Storm" className={state.energy >= 100 ? 'is-ready' : ''}><Zap size={22} /></button><button {...hold('c')} aria-label="Guard"><Shield size={22} /></button><button onClick={() => act('interact')} aria-label="Awaken seal"><Sparkles size={22} /></button></div></div>
    </>}
    {overlay && <div className={`hanuman-overlay ${state.status === 'ready' ? 'hanuman-intro' : ''}`}>
      <section className="hanuman-panel">
        <div className="hanuman-eyebrow"><span /> AN ORIGINAL MYTHIC ADVENTURE</div>
        <p className="hanuman-chapter">CHAPTER I / THE WIND TEMPLE</p>
        <h1>{state.status === 'ready' ? <>Strength.<br />Devotion.<br /><em>Limitless skies.</em></> : state.status === 'paused' ? <>The wind<br /><em>can wait.</em></> : state.status === 'won' ? <>The light<br /><em>returns.</em></> : <>Rise.<br /><em>Try once more.</em></>}</h1>
        <p className="hanuman-description">{state.status === 'ready' ? 'A little hero. A mighty gada. Chase sweet mangoes, smash treasure pots, and wake the temple’s three seals. A stormy surprise awaits!' : state.status === 'paused' ? 'Your journey is paused. Move with WASD, strike with J, guard with C, and unleash a mighty leap with K. Press F beside each seal. Collect mangoes and strike enemies to charge Gada Storm, then press L. Jump over the final guardian’s pink shockwaves.' : state.status === 'won' ? `The Storm Guardian is defeated! You collected ${state.mangoes} mangoes and earned ${state.score.toLocaleString()} points. A little courage goes a long way.` : 'Even the mightiest hero begins again. Hold C to guard incoming strikes, and use your Vayu leap to escape and strike from above.'}</p>
        {error ? <p className="hanuman-error" role="alert">{error}</p> : <button className="hanuman-primary" disabled={!loaded} onClick={() => state.status === 'ready' ? act('start') : state.status === 'paused' ? act('pause') : restart()}>{state.status === 'ready' ? (loaded ? 'BEGIN THE JOURNEY' : 'PREPARING THE WORLD…') : state.status === 'paused' ? 'RESUME JOURNEY' : 'PLAY AGAIN'}{state.status === 'ready' ? <ArrowUpRight size={21} /> : state.status === 'paused' ? <Play size={19} /> : <RotateCcw size={19} />}</button>}
        <div className="hanuman-features"><span><Swords size={16} /> Mighty gada</span><span><Wind size={17} /> Divine leaps</span><span><Sparkles size={16} /> Mango adventures</span></div>
        <p className="hanuman-control-note">WASD to move · Drag to look · J to strike · K to leap<br />SPACE to jump · C to guard · F to awaken · L for Gada Storm · ESC to pause</p>
      </section>
      <div className="hanuman-location"><span>27° N / HIMALAYAN SANCTUARY</span><strong>The Wind Temple</strong><small>A little hero. A mighty adventure.</small></div>
    </div>}
  </div>
}
