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
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState
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
    if (gameStateRef.current !== 'playing') return
    
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
  }, [])

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
    if (gameStateRef.current !== 'playing') return
    
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
    if (gameStateRef.current !== 'playing') return
    // Penalty for missing? Or just ignore.
    // Let's just ignore empty clicks to not make it too frustrating on mobile,
    // or maybe game over if you click empty space? Let's just ignore empty clicks.
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-gradient-to-br from-red-400 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse'
      case 'blue': return 'bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_0_18px_rgba(59,130,246,0.7)]'
      case 'green': return 'bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-[0_0_18px_rgba(16,185,129,0.7)]'
      case 'yellow': return 'bg-gradient-to-br from-amber-300 to-orange-500 shadow-[0_0_18px_rgba(251,191,36,0.7)]'
      default: return 'bg-white'
    }
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-red-500/20 to-emerald-500/10 py-3 rounded-2xl border border-red-400/20 shadow-inner">
          <span className="text-emerald-200">✅ SCORE <span className="text-white text-xl ml-1 tabular-nums">{score}</span></span>
          <span className="text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestScore || 0}</span></span>
        </div>

        <div 
          onMouseDown={handleMissClick}
          onTouchStart={handleMissClick}
          className="relative bg-gradient-to-b from-[#23102b] to-[#0f1a2e] border-2 border-red-400/25 rounded-3xl overflow-hidden w-full aspect-[4/3] sm:aspect-video shadow-[0_0_50px_rgba(239,68,68,0.2)] cursor-crosshair touch-none select-none"
        >
          <p className="absolute top-3 left-0 w-full text-center text-sm font-black text-white/50 pointer-events-none">Tap safe colors • NEVER red 🔴</p>
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-20 backdrop-blur-sm p-6 text-center">
              <p className="text-5xl animate-float">🚦</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-red-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                🚦 Play Safe!
              </button>
              <p className="text-red-200/70 text-sm font-bold">Tap blue / green / yellow. Avoid RED!</p>
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
                className={`absolute w-12 h-12 sm:w-16 sm:h-16 -ml-6 -mt-6 sm:-ml-8 sm:-mt-8 rounded-full border-2 border-white/30 transition-transform flex items-center justify-center text-xl ${getColorClass(target.color)} active:scale-90`}
                style={{
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  transform: `scale(${scale})`,
                  transition: 'transform 0.1s linear'
                }}
              >
                {target.color === 'red' ? '⛔' : '⭐'}
              </button>
            )
          })}
          
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
              message={message ? `⛔ ${message}` : undefined}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
