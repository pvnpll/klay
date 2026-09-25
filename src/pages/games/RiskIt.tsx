import { useState, useRef, useEffect, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'risk-it')!

export default function RiskIt() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed' | 'banked' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  
  const [multiplier, setMultiplier] = useState(1.00)
  const [crashPoint, setCrashPoint] = useState(0)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const requestRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const multRef = useRef(1.00)

  const TOTAL_ROUNDS = 5

  const generateCrashPoint = () => {
    // 1% chance of instant crash (1.00x)
    if (Math.random() < 0.01) return 1.00
    
    // e / (1 - rand) to generate crash-like curve (e = 0.99 for house edge)
    const e = 0.95
    const r = Math.random()
    const crash = Math.max(1.00, e / (1 - r))
    
    // Cap at a reasonable max for UI scale
    return Math.min(crash, 20.0)
  }

  const startRound = () => {
    if (gameState === 'idle' || gameState === 'gameover') {
      setScore(0)
      setRound(1)
      setIsNewBest(false)
    } else {
      setRound(r => r + 1)
    }
    
    setCrashPoint(generateCrashPoint())
    setMultiplier(1.00)
    multRef.current = 1.00
    setGameState('playing')
    startTimeRef.current = performance.now()
    requestRef.current = requestAnimationFrame(update)
  }

  const update = useCallback((time: number) => {
    if (gameState !== 'playing') return
    
    const elapsed = (time - startTimeRef.current) / 1000
    
    // Exponential growth
    const newMult = Math.pow(1.2, elapsed)
    
    if (newMult >= crashPoint) {
      // Crashed!
      setMultiplier(crashPoint)
      setGameState('crashed')
      
      if (round >= TOTAL_ROUNDS) {
        endGame(score) // End of game, lost this round's points
      }
      return
    }
    
    multRef.current = newMult
    setMultiplier(newMult)
    requestRef.current = requestAnimationFrame(update)
  }, [gameState, crashPoint, round, score])

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  const handleBank = () => {
    if (gameState !== 'playing') return
    
    const bankedScore = Math.floor(100 * multRef.current)
    const newTotal = score + bankedScore
    setScore(newTotal)
    setGameState('banked')
    
    if (round >= TOTAL_ROUNDS) {
      endGame(newTotal)
    }
  }

  const endGame = (finalScore: number) => {
    setGameState('gameover')
    const { isNewBest, bestScore: newBest } = saveScore(gameMeta, finalScore)
    setIsNewBest(isNewBest)
    setBestScore(newBest)
  }

  let statusColor = 'text-white'
  if (gameState === 'crashed') statusColor = 'text-red-500'
  else if (gameState === 'banked') statusColor = 'text-emerald-400'

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-8 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">
            Round: <span className="text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</span>
          </span>
          <span className="text-xl">
            Total Score: <span className="text-white font-bold">{score}</span>
          </span>
          <span className="text-xl hidden sm:inline">
            Best: <span className="text-white">{bestScore || 0}</span>
          </span>
        </div>

        <div className="w-full bg-gray-900 border-2 border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
          
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
              <button
                onClick={startRound}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
              >
                Start Game
              </button>
            </div>
          )}

          <div className="h-32 flex items-center justify-center mb-8 relative w-full">
            <span className={`text-7xl sm:text-9xl font-black tabular-nums tracking-tighter ${statusColor} drop-shadow-[0_0_15px_currentColor]`}>
              {multiplier.toFixed(2)}x
            </span>
            
            {gameState === 'crashed' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-4xl sm:text-6xl font-black text-red-500 -rotate-12 uppercase tracking-widest bg-gray-900/80 px-4 py-2 rounded-xl border-4 border-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,1)]">
                  Crashed!
                </span>
              </div>
            )}
          </div>

          <div className="h-16 mb-8 text-center flex flex-col items-center justify-center">
            {gameState === 'playing' && (
              <span className="text-2xl text-emerald-400 font-bold animate-pulse">
                Potential: +{Math.floor(100 * multiplier)}
              </span>
            )}
            {gameState === 'banked' && (
              <span className="text-2xl text-emerald-400 font-bold animate-in slide-in-from-bottom-2">
                Banked +{Math.floor(100 * multiplier)}!
              </span>
            )}
            {gameState === 'crashed' && (
              <span className="text-2xl text-red-500 font-bold">
                You lost this round's points!
              </span>
            )}
          </div>

          <div className="flex gap-4 w-full">
            {gameState === 'playing' ? (
              <button
                onClick={handleBank}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-6 rounded-2xl font-black text-3xl sm:text-4xl shadow-[0_8px_0_rgb(4,120,87)] hover:shadow-[0_4px_0_rgb(4,120,87)] hover:translate-y-1 active:shadow-none active:translate-y-2 transition-all"
              >
                BANK
              </button>
            ) : (gameState === 'banked' || gameState === 'crashed') && round < TOTAL_ROUNDS ? (
              <button
                onClick={startRound}
                className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-6 rounded-2xl font-black text-2xl sm:text-3xl shadow-lg active:scale-95 transition-all animate-in zoom-in"
              >
                Next Round ➔
              </button>
            ) : (gameState === 'banked' || gameState === 'crashed') && round >= TOTAL_ROUNDS ? (
              <button
                disabled
                className="flex-1 bg-gray-800 text-gray-600 py-6 rounded-2xl font-black text-2xl sm:text-3xl"
              >
                Game Over
              </button>
            ) : null}
          </div>

        </div>

        {gameState === 'gameover' && (
          <div className="mt-8 w-full animate-in slide-in-from-bottom-4">
            <GameResult
              game={gameMeta}
              score={score}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={startRound}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
