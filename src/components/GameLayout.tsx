import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Info, Maximize2, Minimize2, Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import { GAMES } from '../data/games'
import { setGamePaused } from '../utils/gameClock'
interface GameLayoutProps { title: string; description?: string; rules?: string[]; children: ReactNode }
const palette: Record<string, [string, string]> = { Classic: ['#f59e0b', '#f97316'], Strategy: ['#a78bfa', '#f472b6'], Dice: ['#34d399', '#60a5fa'], Memory: ['#f472b6', '#a78bfa'], Quick: ['#fbbf24', '#fb7185'], Arcade: ['#38bdf8', '#a78bfa'], Brain: ['#a78bfa', '#22d3ee'] }
export function GameLayout({ title, description, rules, children }: GameLayoutProps) {
  const game = GAMES.find(g => g.name === title || title.endsWith(g.name))
  const displayRules = rules || game?.rules || []
  const [panel, setPanel] = useState<'rules' | 'pause' | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [sound, setSound] = useState(() => { try { return localStorage.getItem('arcade-sound') === 'on' } catch { return false } })
  const root = useRef<HTMLDivElement>(null), area = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null), dialog = useRef<HTMLDialogElement>(null)
  const audio = useRef<AudioContext | null>(null)
  const [fit, setFit] = useState({ width: 480, scale: 1, ready: false })
  const [primary, secondary] = palette[game?.category || ''] || ['#f472b6', '#22d3ee']
  useLayoutEffect(() => {
    const box = area.current, child = content.current
    if (!box || !child) return
    const resize = () => {
      const limit = game?.id === 'chess' ? 880 : ['ludo', 'snakes-ladders'].includes(game?.id || '') ? 470 : 560
      const width = Math.min(box.clientWidth, limit, Math.max(260, box.clientHeight * .9))
      if (Math.abs(child.offsetWidth - width) > 1) child.style.width = `${width}px`
      const scale = Math.min(1, box.clientHeight / Math.max(1, child.offsetHeight), box.clientWidth / Math.max(1, width))
      setFit(prev => prev.width === width && Math.abs(prev.scale - scale) < .001 && prev.ready ? prev : { width, scale, ready: true })
    }
    const observer = new ResizeObserver(resize); observer.observe(box); observer.observe(child); resize()
    return () => observer.disconnect()
  }, [game?.id])
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const visibility = () => setGamePaused(document.hidden || panel !== null)
    visibility(); document.addEventListener('visibilitychange', visibility)
    return () => { document.body.style.overflow = previous; document.removeEventListener('visibilitychange', visibility); setGamePaused(false) }
  }, [panel])
  useEffect(() => {
    if (panel) dialog.current?.showModal(); else dialog.current?.close()
  }, [panel])
  useEffect(() => {
    const changed = () => setExpanded(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', changed)
    return () => { document.removeEventListener('fullscreenchange', changed); void audio.current?.close() }
  }, [])
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.current?.requestFullscreen?.() } catch { /* The app still fills the viewport when browser fullscreen is unavailable. */ }
  }
  const tick = () => {
    if (!sound || panel) return
    try {
      const ctx = audio.current ||= new AudioContext()
      if (ctx.state === 'suspended') void ctx.resume()
      const oscillator = ctx.createOscillator(), gain = ctx.createGain()
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(620, ctx.currentTime)
      gain.gain.setValueAtTime(.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .045)
      oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + .05)
    } catch { /* Sound is optional. */ }
  }
  return <div ref={root} className="game-screen" data-game={game?.id} data-paused={panel !== null} style={{ '--game-accent': primary, '--game-secondary': secondary } as CSSProperties}>
    <header className="game-toolbar">
      <Link to="/" className="game-tool" aria-label="Back to all games"><ArrowLeft size={19} /><span className="game-tool-label">Games</span></Link>
      <h1>{game?.name || title}</h1>
      <nav aria-label="Game controls">
        <button className="game-tool" onClick={() => setPanel('rules')} aria-label="How to play"><Info size={19} /></button>
        <button className="game-tool" onClick={() => setPanel('pause')} aria-label="Pause game"><Pause size={19} /></button>
        <button className="game-tool game-sound" aria-label={sound ? 'Mute sound' : 'Enable sound'} aria-pressed={sound} onClick={() => setSound(v => { try { localStorage.setItem('arcade-sound', v ? 'off' : 'on') } catch { /* Local preference is optional. */ } return !v })}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
        <button className="game-tool" onClick={() => void toggleFullscreen()} aria-label={expanded ? 'Exit browser fullscreen' : 'Enter browser fullscreen'}>{expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
      </nav>
    </header>
    <div className="game-stage" onPointerDown={tick}><div ref={area} className="game-fit-area"><div ref={content} className="game-fit-content" style={{ width: fit.width, opacity: fit.ready ? 1 : 0, transform: `translate(-50%, -50%) scale(${fit.scale})` }}>{children}</div></div></div>
    <dialog ref={dialog} className="game-help" onCancel={e => { e.preventDefault(); setPanel(null) }}>
      <div className="game-help-heading"><h2>{panel === 'pause' ? 'Take a breather' : `How to play ${game?.name || title}`}</h2><button onClick={() => setPanel(null)} className="game-tool" aria-label="Close dialog"><X size={20} /></button></div>
      <p className="game-help-description">{panel === 'pause' ? 'Your game is paused. Everything stays right where you left it.' : description || game?.description}</p>
      {panel === 'rules' && <ol>{displayRules.map((rule, i) => <li key={i}><span>{i + 1}</span>{rule}</li>)}</ol>}
      <button className="game-resume" onClick={() => setPanel(null)}><Play size={18} /> {panel === 'pause' ? 'Resume game' : 'Let’s play'}</button>
    </dialog>
  </div>
}
