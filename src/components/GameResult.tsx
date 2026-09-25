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
}

export function GameResult({ 
  game, 
  score, 
  isWin, 
  message, 
  isNewBest, 
  bestScore, 
  onRestart 
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
    <div className="absolute inset-0 z-50 bg-gray-950/80 backdrop-blur-md rounded-[2rem] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 border border-white/10 p-6 text-center">
      
      {isNewBest && (
        <div className="mb-4 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full text-sm font-bold border border-yellow-500/50">
          <Trophy size={16} />
          New Personal Best!
        </div>
      )}

      <h2 className={`text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-br ${
        isWin === false 
          ? 'from-red-400 to-rose-600' 
          : 'from-emerald-400 to-cyan-500'
      }`}>
        {message || (isWin ? 'You Won!' : (isWin === false ? 'Game Over' : 'Finished!'))}
      </h2>

      {/* Score Display */}
      {score !== undefined && (
        <div className="my-6">
          <p className="text-gray-400 text-sm font-black uppercase tracking-widest mb-1">
            {game.scoreType === 'time' ? 'Time' : 'Score'}
          </p>
          <p className="text-6xl font-black text-white leading-none">
            {formatScore(score)}
          </p>
        </div>
      )}

      {/* Best Score */}
      {bestScore !== undefined && !isNewBest && game.scoreType !== 'win-loss' && (
        <div className="mb-8 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Personal Best</p>
          <p className="text-white text-xl font-bold">{formatScore(bestScore)}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mt-4">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-gray-950 hover:bg-gray-200 rounded-2xl font-bold transition-transform active:scale-95"
        >
          <RotateCcw size={20} />
          Play Again
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-800 text-white hover:bg-gray-700 rounded-2xl font-bold border border-white/10 transition-transform active:scale-95"
        >
          <Home size={20} />
          Other Games
        </button>
      </div>
    </div>
  )
}
