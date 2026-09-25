import { useState, useRef, useEffect, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'dont-touch-red')!

type Target = {
  id: number
  x: number
  y: number
  color: 'red' | 'blue' | 'green' | 'yellow'
  createdAt: number
  lifespan: number
}

export default function DontTouchRed() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [targets, setTargets] = useState<Target[]>([])
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)
  const [message, setMessage] = useState('')

  const requestRef = useRef<number | null>(null)
  const targetsRef = useRef<Target[]>([])
  const scoreRef = useRef(0)
  const lastSpawnRef = useRef<number>(0)
  const idCounter = useRef(0)

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    scoreRef.current = 0
    setIsNewBest(false)
    setTargets([])
    targetsRef.current = []
    lastSpawnRef.current = performance.now()
    setMessage('')
    requestRef.current = requestAnimationFrame(update)
  }

  const handleGameOver = (msg: string) => {
    setGameState('gameover')
    setMessage(msg)
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
    const { isNewBest, bestScore: newBest } = saveScore(gameMeta, scoreRef.current)
    setIsNewBest(isNewBest)
    setBestScore(newBest)
  }

  const update = useCallback((time: number) => {
    if (gameState !== 'playing') return
    
    // Spawn new targets
    // Spawn rate increases with score
    const spawnInterval = Math.max(400, 1500 - scoreRef.current * 20)
    
    if (time - lastSpawnRef.current > spawnInterval) {
      const isRed = Math.random() < 0.3 // 30% chance of red
      const colors = ['blue', 'green', 'yellow'] as const
      const color = isRed ? 'red' : colors[Math.floor(Math.random() * colors.length)]
      
      const newTarget: Target = {
        id: idCounter.current++,
        x: 10 + Math.random() * 80, // 10% to 90%
        y: 10 + Math.random() * 80,
        color,
        createdAt: time,
        lifespan: Math.max(1000, 3000 - scoreRef.current * 30)
      }
      
      targetsRef.current = [...targetsRef.current, newTarget]
      lastSpawnRef.current = time
    }
    
    // Check for expired targets
    let expiredSafe = false
    const currentTargets = targetsRef.current.filter(t => {
      const age = time - t.createdAt
      if (age > t.lifespan) {
        if (t.color !== 'red') expiredSafe = true
        return false
      }
      return true
    })
    
    if (expiredSafe) {
      handleGameOver("You missed a safe target!")
      return
    }
    
    targetsRef.current = currentTargets
    setTargets([...currentTargets])
    
    requestRef.current = requestAnimationFrame(update)
  }, [gameState])

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  const handleTargetClick = (e: React.MouseEvent | React.TouchEvent, id: number, color: string) => {
    e.stopPropagation()
    if (gameState !== 'playing') return
    
    if (color === 'red') {
      handleGameOver("You touched RED!")
      return
    }
    
    // Valid click
    scoreRef.current += 1
    setScore(scoreRef.current)
    targetsRef.current = targetsRef.current.filter(t => t.id !== id)
    setTargets([...targetsRef.current])
  }

  const handleMissClick = () => {
    if (gameState !== 'playing') return
    // Penalty for missing? Or just ignore.
    // Let's just ignore empty clicks to not make it too frustrating on mobile,
    // or maybe game over if you click empty space? Let's just ignore empty clicks.
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'
      case 'blue': return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]'
      case 'green': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]'
      case 'yellow': return 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
      default: return 'bg-white'
    }
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-4 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Score: <span className="text-white">{score}</span></span>
          <span className="text-xl">Best: <span className="text-white">{bestScore || 0}</span></span>
        </div>

        <div 
          onMouseDown={handleMissClick}
          onTouchStart={handleMissClick}
          className="relative bg-gray-900 border-2 border-white/10 rounded-3xl overflow-hidden w-full aspect-[4/3] sm:aspect-video shadow-2xl cursor-crosshair touch-none select-none"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
              <button
                onClick={startGame}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
              >
                Start Game
              </button>
            </div>
          )}

          {targets.map(target => {
            const age = performance.now() - target.createdAt
            const scale = Math.max(0, 1 - (age / target.lifespan))
            
            return (
              <button
                key={target.id}
                onMouseDown={(e) => handleTargetClick(e, target.id, target.color)}
                onTouchStart={(e) => handleTargetClick(e, target.id, target.color)}
                className={`absolute w-12 h-12 sm:w-16 sm:h-16 -ml-6 -mt-6 sm:-ml-8 sm:-mt-8 rounded-full border-2 border-white/20 transition-transform ${getColorClass(target.color)}`}
                style={{
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  transform: `scale(${scale})`,
                  transition: 'transform 0.1s linear'
                }}
              />
            )
          })}
          
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
              message={message}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
