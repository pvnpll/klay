import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GameMetadata } from '../data/games'
import { Trophy, RotateCcw, Home } from 'lucide-react'
interface GameResultProps { game: GameMetadata; score?: number; isWin?: boolean; message?: string; isNewBest?: boolean; bestScore?: number; onRestart: () => void; mode?: 'overlay' | 'inline' }
export function GameResult({ game, score, isWin, message, isNewBest, bestScore, onRestart, mode = 'inline' }: GameResultProps) {
  const navigate = useNavigate(), dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  const format = (value: number) => game.scoreType === 'time' || game.scoreType === 'lower-is-better' ? `${value}s` : game.scoreType === 'accuracy' ? `${value}%` : value
  return <><span hidden data-game-result="true" />{createPortal(<dialog ref={dialog} className="game-result-dialog" aria-label="Game result" onCancel={e => e.preventDefault()}>
    <div data-mode={mode} className="relative flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-gradient-to-b from-fuchsia-500/20 via-transparent to-cyan-400/10" />
      <span className="relative text-5xl mb-4" aria-hidden="true">{isWin === false ? '🎮' : isNewBest ? '🏆' : '🎉'}</span>
      {isNewBest && <p className="relative inline-flex items-center gap-2 text-sm bg-amber-300 text-gray-950 px-4 py-2 rounded-full font-black mb-4"><Trophy size={16} /> New personal best!</p>}
      <h2 className={`relative text-3xl font-black mb-2 ${isWin === false ? 'text-rose-300' : 'text-amber-200'}`}>{message || (isWin ? 'You won!' : isWin === false ? 'Game over' : 'Finished!')}</h2>
      {score !== undefined && <div className="relative my-6"><p className="text-gray-300 text-xs font-bold uppercase tracking-widest mb-2">{game.scoreType === 'time' ? 'Time' : game.scoreType === 'accuracy' ? 'Accuracy' : 'Score'}</p><p className="text-6xl font-black text-white tabular-nums">{format(score)}</p></div>}
      {bestScore !== undefined && !isNewBest && game.scoreType !== 'win-loss' && <p className="relative text-sm text-gray-300 mb-4">Personal best <strong className="text-amber-200 ml-2">{format(bestScore)}</strong></p>}
      <div className="relative flex flex-col gap-3 w-full mt-4"><button onClick={onRestart} className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-amber-200 to-orange-300 text-gray-950 rounded-2xl font-black"><RotateCcw size={18} /> Play again</button><button onClick={() => navigate('/')} className="flex items-center justify-center gap-2 py-3 bg-white/10 text-white rounded-2xl font-bold border border-white/10"><Home size={18} /> Other games</button></div>
    </div>
  </dialog>, document.fullscreenElement || document.body)}</>
}
