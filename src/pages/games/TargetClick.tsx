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
        <div className="flex justify-between w-full mb-4 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Targets: <span className="text-white">{targetsHit}/{TOTAL_TARGETS}</span></span>
          <span className="text-xl">Time: <span className="text-white tabular-nums">{formatTime(timeElapsed)}s</span></span>
          <span className="text-xl hidden sm:inline">Best: <span className="text-white">{bestTime ? `${bestTime}s` : '—'}</span></span>
        </div>

        <div 
          ref={containerRef}
          onClick={handleMissClick}
          className="relative bg-gray-900 border-2 border-white/10 rounded-2xl overflow-hidden w-full aspect-[4/3] sm:aspect-video shadow-2xl cursor-crosshair touch-none select-none"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
              <button
                onClick={startGame}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
              >
                Start Training
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <button
              onMouseDown={handleTargetClick}
              onTouchStart={handleTargetClick}
              className="absolute w-12 h-12 sm:w-16 sm:h-16 -ml-6 -mt-6 sm:-ml-8 sm:-mt-8 rounded-full flex items-center justify-center bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] focus:outline-none"
              style={{
                top: `${targetPos.top}%`,
                left: `${targetPos.left}%`,
              }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/40 flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white"></div>
              </div>
            </button>
          )}

          {gameState === 'gameover' && (
            <GameResult
              game={gameMeta}
              score={parseFloat((timeElapsed / 1000).toFixed(2))}
              isNewBest={isNewBest}
              bestScore={bestTime}
              onRestart={startGame}
            />
          )}
        </div>
      </div>
    </GameLayout>
  )
}
