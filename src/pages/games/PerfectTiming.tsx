import { useState, useRef, useEffect, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'perfect-timing')!

export default function PerfectTiming() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  // Game state refs
  const barPosRef = useRef(0)
  const barDirRef = useRef(1)
  const targetStartRef = useRef(40)
  const targetWidthRef = useRef(20)
  const speedRef = useRef(40) // width % per second

  const requestRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  const [uiBarPos, setUiBarPos] = useState(0)
  const [uiTarget, setUiTarget] = useState({ start: 40, width: 20 })

  const update = useCallback((time: number) => {
    if (gameState !== 'playing') return
    
    if (lastTimeRef.current !== null) {
      const deltaTime = (time - lastTimeRef.current) / 1000
      
      let newPos = barPosRef.current + (speedRef.current * barDirRef.current * deltaTime)
      
      if (newPos >= 100) {
        newPos = 100
        barDirRef.current = -1
      } else if (newPos <= 0) {
        newPos = 0
        barDirRef.current = 1
      }
      
      barPosRef.current = newPos
      setUiBarPos(newPos)
    }
    
    lastTimeRef.current = time
    requestRef.current = requestAnimationFrame(update)
  }, [gameState])

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now()
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setIsNewBest(false)
    
    barPosRef.current = 0
    barDirRef.current = 1
    speedRef.current = 60
    targetWidthRef.current = 25
    targetStartRef.current = Math.random() * (100 - targetWidthRef.current)
    
    setUiTarget({ start: targetStartRef.current, width: targetWidthRef.current })
  }

  const handleAction = () => {
    if (gameState === 'idle') {
      startGame()
      return
    }
    
    if (gameState !== 'playing') return

    const pos = barPosRef.current
    const targetStart = targetStartRef.current
    const targetEnd = targetStart + targetWidthRef.current

    if (pos >= targetStart && pos <= targetEnd) {
      // Hit!
      const newScore = score + 1
      setScore(newScore)
      
      // Increase difficulty
      speedRef.current = Math.min(200, speedRef.current + 10)
      targetWidthRef.current = Math.max(5, targetWidthRef.current - 1.5)
      targetStartRef.current = Math.random() * (100 - targetWidthRef.current)
      
      setUiTarget({ start: targetStartRef.current, width: targetWidthRef.current })
    } else {
      // Miss
      setGameState('gameover')
      const { isNewBest, bestScore: newBest } = saveScore(gameMeta, score)
      setIsNewBest(isNewBest)
      setBestScore(newBest)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleAction()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, score])

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-8 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Score: <span className="text-white">{score}</span></span>
          <span className="text-xl">Best: <span className="text-white">{bestScore || 0}</span></span>
        </div>

        <div 
          onClick={handleAction}
          className="w-full h-64 sm:h-80 bg-gray-900 border-2 border-white/10 rounded-3xl flex flex-col items-center justify-center relative cursor-pointer shadow-2xl overflow-hidden group select-none touch-manipulation"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
              <span className="text-3xl sm:text-5xl font-black text-white px-8 py-4 bg-rose-600 rounded-2xl shadow-xl transition-transform group-active:scale-95">
                Click to Start
              </span>
            </div>
          )}

          {/* Track */}
          <div className="w-[90%] h-12 sm:h-16 bg-gray-800 rounded-full relative overflow-hidden shadow-inner border border-gray-700">
            {/* Target Zone */}
            <div 
              className="absolute h-full bg-emerald-500/30 border-l-2 border-r-2 border-emerald-400 transition-all duration-200"
              style={{ 
                left: `${uiTarget.start}%`, 
                width: `${uiTarget.width}%` 
              }}
            />
            
            {/* Moving Indicator */}
            <div 
              className="absolute h-full w-2 sm:w-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] -ml-1 sm:-ml-1.5 pointer-events-none"
              style={{ left: `${uiBarPos}%` }}
            />
          </div>

          <div className="absolute bottom-8 text-gray-500 font-bold hidden sm:block">
            Press SPACE or CLICK to stop the indicator
          </div>
          
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-red-500/20 z-10 animate-in fade-in" />
          )}
        </div>

        {gameState === 'gameover' && (
          <div className="mt-8 w-full animate-in slide-in-from-bottom-4">
            <GameResult
              game={gameMeta}
              score={score}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={startGame}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
