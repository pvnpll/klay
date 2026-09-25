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
        <div className="flex justify-between w-full mb-4 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Target: <span className="text-white">1.000s</span></span>
          <span className="text-xl">Best: <span className="text-white">{bestAccuracy ? `${bestAccuracy.toFixed(2)}%` : '—'}</span></span>
        </div>

        <div 
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          onKeyDown={handleStart}
          onKeyUp={handleStop}
          tabIndex={0}
          className={`w-full h-80 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-colors select-none shadow-2xl touch-none focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500
            ${gameState === 'idle' ? 'bg-gray-800 hover:bg-gray-700' : ''}
            ${gameState === 'holding' ? 'bg-cyan-600 scale-95' : ''}
            ${gameState === 'result' ? 'bg-gray-900' : ''}
          `}
        >
          {gameState === 'idle' && (
            <div className="text-center">
              <span className="block text-4xl sm:text-5xl font-black text-white mb-2">Hold down</span>
              <span className="block text-xl text-gray-400">Release at exactly 1.000s</span>
            </div>
          )}
          
          {gameState === 'holding' && (
            <div className="text-6xl sm:text-8xl font-black text-white tabular-nums tracking-tight">
              {showTimer ? (timeElapsed / 1000).toFixed(3) : '?.???'}
            </div>
          )}

          {gameState === 'result' && (
            <div className="text-center animate-in zoom-in duration-300">
              <div className="text-6xl sm:text-8xl font-black text-white tabular-nums tracking-tight mb-2">
                {(timeElapsed / 1000).toFixed(3)}s
              </div>
              <div className={`text-2xl font-bold ${Math.abs(1000 - timeElapsed) < 50 ? 'text-green-400' : 'text-rose-400'}`}>
                {timeElapsed < 1000 ? 'Too Early!' : timeElapsed > 1000 ? 'Too Late!' : 'Perfect!'}
              </div>
            </div>
          )}
        </div>

        {gameState === 'result' && (
          <div className="mt-8 w-full animate-in slide-in-from-bottom-4">
            <GameResult
              game={gameMeta}
              score={parseFloat((100 - Math.abs(1000 - timeElapsed) / 10).toFixed(2))}
              isNewBest={isNewBest}
              bestScore={bestAccuracy}
              onRestart={restart}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
