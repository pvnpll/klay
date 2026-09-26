import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'target-click')!

const TOTAL_TARGETS = 20

export default function TargetClick() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [targetsHit, setTargetsHit] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [targetPos, setTargetPos] = useState({ top: 50, left: 50 })
  
  const [bestTime, setBestTime] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => stopTimer()
  }, [])

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const generateTarget = () => {
    // Keep target away from edges, between 10% and 90%
    setTargetPos({
      top: 10 + Math.random() * 80,
      left: 10 + Math.random() * 80
    })
  }

  const startGame = () => {
    setTargetsHit(0)
    setTimeElapsed(0)
    setGameState('playing')
    setIsNewBest(false)
    generateTarget()
    
    startTimeRef.current = performance.now()
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(performance.now() - startTimeRef.current)
    }, 10)
  }

  const handleTargetClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation() // Prevent container click
    if (gameState !== 'playing') return

    const newHits = targetsHit + 1
    if (newHits >= TOTAL_TARGETS) {
      // Win
      stopTimer()
      setTargetsHit(newHits)
      setGameState('gameover')
      
      const finalTime = Math.round(performance.now() - startTimeRef.current)
      setTimeElapsed(finalTime)
      
      const timeInSeconds = parseFloat((finalTime / 1000).toFixed(2))
      const { isNewBest, bestScore } = saveScore(gameMeta, timeInSeconds)
      setIsNewBest(isNewBest)
      setBestTime(bestScore)
    } else {
      setTargetsHit(newHits)
      generateTarget()
    }
  }
  
  const handleMissClick = () => {
    if (gameState !== 'playing') return
    // Penalty for missing? Let's say +0.5s penalty? Or just nothing (already lose time).
    // Just lose time is enough.
  }

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(2)
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center relative w-full max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-blue-500/20 to-cyan-500/10 py-3 rounded-2xl border border-blue-400/20 shadow-inner">
          <span className="text-blue-200">🎯 TARGETS <span className="text-white text-xl ml-1 tabular-nums">{targetsHit}/{TOTAL_TARGETS}</span></span>
          <span className="text-cyan-200">⏱️ TIME <span className="text-white text-xl ml-1 tabular-nums">{formatTime(timeElapsed)}s</span></span>
          <span className="hidden sm:inline text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestTime ? `${bestTime}s` : '—'}</span></span>
        </div>

        {/* progress bar */}
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4 border border-white/10">
          <div className="h-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 rounded-full transition-all duration-200" style={{ width: `${(targetsHit / TOTAL_TARGETS) * 100}%` }} />
        </div>

        <div 
          ref={containerRef}
          onClick={handleMissClick}
          className="relative bg-gradient-to-b from-[#0a1a3a] to-[#0b1030] border-2 border-blue-400/25 rounded-3xl overflow-hidden w-full aspect-[4/3] sm:aspect-video shadow-[0_0_50px_rgba(59,130,246,0.25)] cursor-crosshair touch-none select-none"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-10 backdrop-blur-sm p-6 text-center">
              <p className="text-5xl animate-float">🎯</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                ⚡ Start Training
              </button>
              <p className="text-blue-200/70 text-sm font-bold">Smash {TOTAL_TARGETS} targets as fast as you can!</p>
            </div>
          )}

          {gameState === 'playing' && (
            <button
              onMouseDown={handleTargetClick}
              onTouchStart={handleTargetClick}
              className="absolute w-12 h-12 sm:w-16 sm:h-16 -ml-6 -mt-6 sm:-ml-8 sm:-mt-8 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-300 to-orange-500 shadow-[0_0_25px_rgba(251,146,60,0.8)] border-2 border-white/50 focus:outline-none animate-pop-in active:scale-90 transition-transform"
              style={{
                top: `${targetPos.top}%`,
                left: `${targetPos.left}%`,
              }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/60 flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white"></div>
              </div>
            </button>
          )}
        </div>

        {gameState === 'gameover' && (
          <div className="mt-6 w-full animate-pop-in">
            <GameResult
              game={gameMeta}
              score={parseFloat((timeElapsed / 1000).toFixed(2))}
              isNewBest={isNewBest}
              bestScore={bestTime}
              onRestart={startGame}
              message={`🎯 ${TOTAL_TARGETS} targets smashed!`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
