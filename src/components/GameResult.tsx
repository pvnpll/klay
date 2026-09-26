import { useNavigate } from 'react-router-dom'
import type { GameMetadata } from '../data/games'
import { Trophy, RotateCcw, Home } from 'lucide-react'

interface GameResultProps {
  game: GameMetadata
  score?: number
  isWin?: boolean
  message?: string
  isNewBest?: boolean
  bestScore?: number
  onRestart: () => void
  mode?: 'overlay' | 'inline'
}

export function GameResult({ 
  game, 
  score, 
  isWin, 
  message, 
  isNewBest, 
  bestScore, 
  onRestart,
  mode = 'inline',
}: GameResultProps) {
  const navigate = useNavigate()

  const formatScore = (val: number) => {
    if (game.scoreType === 'time' || game.scoreType === 'lower-is-better') {
      return `${val}s`
    }
    if (game.scoreType === 'accuracy') {
      return `${val}%`
    }
    return val
  }

  return (
    <div className={`${mode === 'overlay' ? 'absolute inset-0 z-50 bg-gray-950/80 backdrop-blur-md rounded-[2rem] border border-white/10' : 'relative z-10 w-full bg-gradient-to-b from-white/10 to-white/[0.03] backdrop-blur-md rounded-3xl border border-white/15 shadow-2xl'} flex flex-col items-center justify-center animate-pop-in p-6 text-center overflow-hidden`}>
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.25),transparent_60%)]" />
      
      {isNewBest && (
        <div className="relative mb-4 inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-950 px-4 py-1.5 rounded-full text-sm font-black border border-yellow-200 shadow-lg shadow-yellow-500/30 animate-pop-in">
          <Trophy size={16} />
          🏆 New Personal Best!
        </div>
      )}

      <h2 className={`relative text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-br ${
        isWin === false 
          ? 'from-red-400 to-rose-600' 
          : 'from-amber-300 via-fuchsia-400 to-cyan-300'
      }`}>
        {message || (isWin ? '🎉 You Won!' : (isWin === false ? '💥 Game Over' : '🏁 Finished!'))}
      </h2>

      {/* Score Display */}
      {score !== undefined && (
        <div className="relative my-6">
          <p className="text-gray-300 text-sm font-black uppercase tracking-widest mb-1">
            {game.scoreType === 'time' ? '⏱️ Time' : game.scoreType === 'accuracy' ? '🎯 Accuracy' : '⭐ Score'}
          </p>
          <p className="text-6xl font-black text-white leading-none text-glow">
            {formatScore(score)}
          </p>
        </div>
      )}

      {/* Best Score */}
      {bestScore !== undefined && !isNewBest && game.scoreType !== 'win-loss' && (
        <div className="relative mb-8 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
          <p className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-1">👑 Personal Best</p>
          <p className="text-white text-xl font-black">{formatScore(bestScore)}</p>
        </div>
      )}

      <div className="relative flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-4">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-lime-400 to-emerald-400 text-gray-950 hover:brightness-110 rounded-2xl font-black shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 hover:-translate-y-0.5"
        >
          <RotateCcw size={20} />
          🔁 Play Again
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/10 text-white hover:bg-white/20 rounded-2xl font-bold border border-white/10 transition-transform active:scale-95"
        >
          <Home size={20} />
          Other Games
        </button>
      </div>
    </div>
  )
}
