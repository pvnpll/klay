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
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState

  const [uiBarPos, setUiBarPos] = useState(0)
  const [uiTarget, setUiTarget] = useState({ start: 40, width: 20 })

  const update = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return
    
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
  }, [])

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now()
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  const scoreRef = useRef(0)

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    scoreRef.current = 0
    setIsNewBest(false)
    
    barPosRef.current = 0
    barDirRef.current = 1
    speedRef.current = 60
    targetWidthRef.current = 25
    targetStartRef.current = Math.random() * (100 - targetWidthRef.current)
    
    setUiTarget({ start: targetStartRef.current, width: targetWidthRef.current })
  }

  const handleAction = () => {
    if (gameStateRef.current === 'idle') {
      startGame()
      return
    }
    
    if (gameStateRef.current !== 'playing') return

    const pos = barPosRef.current
    const targetStart = targetStartRef.current
    const targetEnd = targetStart + targetWidthRef.current

    if (pos >= targetStart && pos <= targetEnd) {
      // Hit!
      scoreRef.current += 1
      setScore(scoreRef.current)
      
      // Increase difficulty
      speedRef.current = Math.min(200, speedRef.current + 10)
      targetWidthRef.current = Math.max(5, targetWidthRef.current - 1.5)
      targetStartRef.current = Math.random() * (100 - targetWidthRef.current)
      
      setUiTarget({ start: targetStartRef.current, width: targetWidthRef.current })
    } else {
      // Miss
      setGameState('gameover')
      const { isNewBest, bestScore: newBest } = saveScore(gameMeta, scoreRef.current)
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
  }, [])

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-6 px-5 text-sm font-black bg-gradient-to-r from-rose-500/20 to-amber-500/10 py-3 rounded-2xl border border-rose-400/20 shadow-inner">
          <span className="text-rose-200">🎯 HITS <span className="text-white text-xl ml-1 tabular-nums">{score}</span></span>
          <span className="text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestScore || 0}</span></span>
        </div>

        <div 
          onClick={handleAction}
          className="w-full h-64 sm:h-80 bg-gradient-to-b from-[#2b0f2e] to-[#140b24] border-2 border-rose-400/25 rounded-3xl flex flex-col items-center justify-center relative cursor-pointer shadow-[0_0_50px_rgba(244,63,94,0.2)] overflow-hidden group select-none touch-manipulation"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 p-6 text-center">
              <p className="text-5xl animate-float">⏱️</p>
              <span className="text-2xl sm:text-3xl font-black text-white px-8 py-4 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl shadow-xl transition-transform group-active:scale-95">
                Tap to Start!
              </span>
              <p className="text-rose-200/70 text-sm font-bold">Stop the beam inside the green zone!</p>
            </div>
          )}

          <p className="text-rose-200/70 text-sm font-black uppercase tracking-widest mb-4">Stop inside the glow ✨</p>
          {/* Track */}
          <div className="w-[90%] h-12 sm:h-16 bg-black/50 rounded-full relative overflow-hidden shadow-inner border border-white/15">
            {/* Target Zone */}
            <div 
              className="absolute h-full bg-emerald-400/30 border-l-2 border-r-2 border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.6)] transition-all duration-200"
              style={{ 
                left: `${uiTarget.start}%`, 
                width: `${uiTarget.width}%` 
              }}
            />
            
            {/* Moving Indicator */}
            <div 
              className="absolute h-full w-2 sm:w-3 bg-gradient-to-b from-white to-amber-200 rounded-full shadow-[0_0_18px_rgba(255,255,255,0.9)] -ml-1 sm:-ml-1.5 pointer-events-none"
              style={{ left: `${uiBarPos}%` }}
            />
          </div>

          <div className="absolute bottom-8 text-rose-200/60 font-bold text-sm hidden sm:block">
            ⌨️ Press SPACE or CLICK to stop the beam
          </div>
          
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-red-500/20 z-10 pointer-events-none" />
          )}
        </div>

        {gameState === 'gameover' && (
          <div className="mt-6 w-full animate-pop-in">
            <GameResult
              game={gameMeta}
              score={score}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={startGame}
              message={`🎯 ${score} perfect stops!`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
