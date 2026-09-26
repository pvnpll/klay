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
  const [, setCrashPoint] = useState(0)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const requestRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const multRef = useRef(1.00)
  const crashRef = useRef(2)
  const roundRef = useRef(1)
  const scoreRef = useRef(0)
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState

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
    if (gameStateRef.current === 'idle' || gameStateRef.current === 'gameover') {
      setScore(0)
      scoreRef.current = 0
      setRound(1)
      roundRef.current = 1
      setIsNewBest(false)
    } else {
      roundRef.current += 1
      setRound(roundRef.current)
    }
    
    const crash = generateCrashPoint()
    setCrashPoint(crash)
    crashRef.current = crash
    setMultiplier(1.00)
    multRef.current = 1.00
    setGameState('playing')
    startTimeRef.current = performance.now()
  }

  const update = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return
    
    const elapsed = (time - startTimeRef.current) / 1000
    
    // Exponential growth
    const newMult = Math.pow(1.2, elapsed)
    
    if (newMult >= crashRef.current) {
      // Crashed!
      setMultiplier(crashRef.current)
      setGameState('crashed')
      
      if (roundRef.current >= TOTAL_ROUNDS) {
        endGame(scoreRef.current) // End of game, lost this round's points
      }
      return
    }
    
    multRef.current = newMult
    setMultiplier(newMult)
    requestRef.current = requestAnimationFrame(update)
  }, [])

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  const handleBank = () => {
    if (gameStateRef.current !== 'playing') return
    
    const bankedScore = Math.floor(100 * multRef.current)
    scoreRef.current += bankedScore
    setScore(scoreRef.current)
    setGameState('banked')
    
    if (roundRef.current >= TOTAL_ROUNDS) {
      endGame(scoreRef.current)
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
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-emerald-500/20 to-amber-500/10 py-3 rounded-2xl border border-emerald-400/20 shadow-inner">
          <span className="text-emerald-200">
            🎲 ROUND <span className="text-white text-lg ml-1 tabular-nums">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</span>
          </span>
          <span className="text-amber-200">
            💰 TOTAL <span className="text-white text-lg ml-1 tabular-nums">{score}</span>
          </span>
          <span className="hidden sm:inline text-gray-300">
            👑 BEST <span className="text-white text-lg ml-1 tabular-nums">{bestScore || 0}</span>
          </span>
        </div>

        <div className="w-full bg-gradient-to-b from-[#0c2b1d] to-[#0a1428] border-2 border-emerald-400/25 rounded-3xl p-8 flex flex-col items-center shadow-[0_0_50px_rgba(52,211,153,0.2)] relative overflow-hidden">
          
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-20 backdrop-blur-sm p-6 text-center">
              <p className="text-5xl animate-float">🚀</p>
              <button
                onClick={startRound}
                className="bg-gradient-to-r from-emerald-400 to-lime-400 text-gray-950 px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-emerald-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                🚀 Risk It!
              </button>
              <p className="text-emerald-200/70 text-sm font-bold">Watch it climb. BANK before it crashes! 5 rounds.</p>
            </div>
          )}

          <div className="h-32 flex items-center justify-center mb-6 relative w-full">
            <span className={`text-7xl sm:text-8xl font-black tabular-nums tracking-tighter ${statusColor} text-glow`}>
              {multiplier.toFixed(2)}x
            </span>
            
            {gameState === 'crashed' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-4xl sm:text-5xl font-black text-red-500 -rotate-12 uppercase tracking-widest bg-gray-900/80 px-4 py-2 rounded-xl border-4 border-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,1)] animate-pop-in">
                  💥 Crashed!
                </span>
              </div>
            )}
          </div>

          <div className="h-12 mb-6 text-center flex flex-col items-center justify-center">
            {gameState === 'playing' && (
              <span className="text-xl text-emerald-300 font-black animate-pulse">
                💎 Potential: +{Math.floor(100 * multiplier)}
              </span>
            )}
            {gameState === 'banked' && (
              <span className="text-xl text-emerald-300 font-black animate-pop-in">
                ✅ Banked +{Math.floor(100 * multiplier)}!
              </span>
            )}
            {gameState === 'crashed' && (
              <span className="text-lg text-red-400 font-bold">
                Ouch! You lost this round's points!
              </span>
            )}
          </div>

          <div className="flex gap-4 w-full">
            {gameState === 'playing' ? (
              <button
                onClick={handleBank}
                className="flex-1 bg-gradient-to-r from-emerald-400 to-lime-400 text-gray-950 py-6 rounded-2xl font-black text-3xl sm:text-4xl shadow-[0_8px_0_rgb(4,120,87)] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all"
              >
                💰 BANK
              </button>
            ) : (gameState === 'banked' || gameState === 'crashed') && round < TOTAL_ROUNDS ? (
              <button
                onClick={startRound}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-400 text-white py-6 rounded-2xl font-black text-2xl sm:text-3xl shadow-lg active:scale-95 transition-all animate-pop-in"
              >
                Next Round ➔
              </button>
            ) : (gameState === 'banked' || gameState === 'crashed') && round >= TOTAL_ROUNDS ? (
              <button
                disabled
                className="flex-1 bg-white/5 text-gray-500 py-6 rounded-2xl font-black text-2xl sm:text-3xl border border-white/10"
              >
                Game Over
              </button>
            ) : null}
          </div>

        </div>

        {gameState === 'gameover' && (
          <div className="mt-6 w-full animate-pop-in">
            <GameResult
              game={gameMeta}
              score={score}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={startRound}
              message={`💰 You banked ${score} coins`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
