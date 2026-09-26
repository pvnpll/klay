import { useState, useRef, useEffect } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'one-second')!

export default function OneSecond() {
  const [gameState, setGameState] = useState<'idle' | 'holding' | 'result'>('idle')
  const [timeElapsed, setTimeElapsed] = useState<number>(0)
  
  const [bestAccuracy, setBestAccuracy] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const startTimeRef = useRef<number>(0)
  const animationRef = useRef<number | null>(null)

  const updateTime = () => {
    setTimeElapsed(performance.now() - startTimeRef.current)
    animationRef.current = requestAnimationFrame(updateTime)
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
    if (gameState === 'result') return
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== ' ') return
    if (e.type === 'keydown' && (e as React.KeyboardEvent).repeat) return
    
    e.preventDefault()
    setGameState('holding')
    setTimeElapsed(0)
    setIsNewBest(false)
    startTimeRef.current = performance.now()
    animationRef.current = requestAnimationFrame(updateTime)
  }

  const handleStop = (e?: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
    if (gameState !== 'holding') return
    if (e && e.type === 'keyup' && (e as React.KeyboardEvent).key !== ' ') return
    if (e) e.preventDefault()
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    
    const finalTime = performance.now() - startTimeRef.current
    setTimeElapsed(finalTime)
    setGameState('result')
    
    // Calculate accuracy. 1000ms is 100%. 0ms or 2000ms is 0%.
    const diff = Math.abs(1000 - finalTime)
    // Map diff to percentage. If diff is 0, accuracy = 100%. If diff >= 1000, accuracy = 0%.
    let accuracy = 100 - (diff / 10)
    accuracy = Math.max(0, Math.min(100, accuracy))
    // Round to 2 decimal places
    accuracy = parseFloat(accuracy.toFixed(2))

    const { isNewBest, bestScore } = saveScore(gameMeta, accuracy)
    setIsNewBest(isNewBest)
    setBestAccuracy(bestScore)
  }

  useEffect(() => {
    const handleMouseUp = () => handleStop()
    const handleTouchEnd = () => handleStop()
    
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleTouchEnd)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [gameState])

  const restart = () => {
    setGameState('idle')
    setTimeElapsed(0)
    setIsNewBest(false)
  }

  // Hide timer after 300ms to make it hard
  const showTimer = gameState === 'result' || (gameState === 'holding' && timeElapsed < 300)

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center relative w-full max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-cyan-500/20 to-blue-500/10 py-3 rounded-2xl border border-cyan-400/20 shadow-inner">
          <span className="text-cyan-200">🎯 TARGET <span className="text-white text-xl ml-1 tabular-nums">1.000s</span></span>
          <span className="text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestAccuracy ? `${bestAccuracy.toFixed(2)}%` : '—'}</span></span>
        </div>

        <div 
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          onKeyDown={handleStart}
          onKeyUp={handleStop}
          tabIndex={0}
          className={`w-full h-80 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all select-none shadow-2xl touch-none focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500 border-2
            ${gameState === 'idle' ? 'bg-gradient-to-b from-cyan-500/15 to-blue-600/5 border-cyan-400/25 hover:border-cyan-300/40' : ''}
            ${gameState === 'holding' ? 'bg-gradient-to-b from-cyan-400 to-blue-500 border-white/40 scale-95 shadow-[0_0_60px_rgba(34,211,238,0.5)]' : ''}
            ${gameState === 'result' ? 'bg-gradient-to-b from-slate-500/15 to-slate-700/10 border-white/15' : ''}
          `}
        >
          {gameState === 'idle' && (
            <div className="text-center flex flex-col items-center gap-2">
              <span className="text-5xl animate-float">⏱️</span>
              <span className="block text-4xl sm:text-5xl font-black text-white">Hold down</span>
              <span className="block text-base font-bold text-cyan-200/80">Release at exactly 1.000s</span>
              <span className="block text-xs font-black uppercase tracking-widest text-white/40 mt-2">Timer vanishes after 300ms 😈</span>
            </div>
          )}

          {gameState === 'holding' && (
            <div className="text-6xl sm:text-8xl font-black text-white tabular-nums tracking-tight drop-shadow-lg">
              {showTimer ? (timeElapsed / 1000).toFixed(3) : '?.???'}
            </div>
          )}

          {gameState === 'result' && (
            <div className="text-center animate-pop-in">
              <div className="text-6xl sm:text-8xl font-black text-white tabular-nums tracking-tight mb-2">
                {(timeElapsed / 1000).toFixed(3)}s
              </div>
              <div className={`text-2xl font-black ${Math.abs(1000 - timeElapsed) < 50 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {timeElapsed < 1000 ? '🐢 Too Early!' : timeElapsed > 1000 ? '🐇 Too Late!' : '🎯 Perfect!'}
              </div>
            </div>
          )}
        </div>

        {gameState === 'result' && (
          <div className="mt-6 w-full animate-pop-in">
            <GameResult
              game={gameMeta}
              score={parseFloat((100 - Math.abs(1000 - timeElapsed) / 10).toFixed(2))}
              isNewBest={isNewBest}
              bestScore={bestAccuracy}
              onRestart={restart}
              message={`⏱️ You hit ${(timeElapsed / 1000).toFixed(3)}s`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
