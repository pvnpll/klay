import { useState, useEffect, useRef, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'breakout')!

type Brick = {
  id: number
  x: number
  y: number
  w: number
  h: number
  active: boolean
  color: string
}

const COLORS = ['bg-red-500', 'bg-orange-500', 'bg-emerald-500', 'bg-blue-500']

export default function Breakout() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'won'>('idle')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  // Game state for rendering
  const [paddleX, setPaddleX] = useState(50)
  const [ball, setBall] = useState({ x: 50, y: 80 })
  const [bricks, setBricks] = useState<Brick[]>([])

  // Mutable refs for physics loop
  const paddleRef = useRef(50)
  const ballRef = useRef({ x: 50, y: 80, dx: 0, dy: 0 })
  const bricksRef = useRef<Brick[]>([])
  const scoreRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const requestRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState

  const paddleW = 20
  const ballR = 2

  const generateBricks = (lvl: number) => {
    const rows = Math.min(4 + Math.floor(lvl / 2), 8)
    const cols = 6
    const brickW = 100 / cols
    const brickH = 5
    const newBricks: Brick[] = []
    
    let id = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newBricks.push({
          id: id++,
          x: c * brickW,
          y: 10 + r * brickH,
          w: brickW,
          h: brickH,
          active: true,
          color: COLORS[r % COLORS.length]
        })
      }
    }
    return newBricks
  }

  const startLevel = (lvl: number, keepScore = false) => {
    if (!keepScore) {
      setScore(0)
      scoreRef.current = 0
    }
    setLevel(lvl)
    setGameState('playing')
    setIsNewBest(false)
    
    paddleRef.current = 50
    setPaddleX(50)
    
    const speedBase = 35 + (lvl * 5)
    // Random angle upwards
    const angle = (Math.random() * Math.PI / 2) + Math.PI / 4 // 45 to 135 degrees upwards
    
    ballRef.current = { 
      x: 50, 
      y: 80, 
      dx: Math.cos(angle) * speedBase, 
      dy: -Math.sin(angle) * speedBase 
    }
    setBall({ x: 50, y: 80 })
    
    const newBricks = generateBricks(lvl)
    bricksRef.current = newBricks
    setBricks(newBricks)
    
    lastTimeRef.current = performance.now()
  }

  const update = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return
    
    if (lastTimeRef.current !== null) {
      const dt = (time - lastTimeRef.current) / 1000
      let { x, y, dx, dy } = ballRef.current
      
      x += dx * dt
      y += dy * dt
      
      // Wall collisions
      if (x <= ballR) { x = ballR; dx = Math.abs(dx) }
      if (x >= 100 - ballR) { x = 100 - ballR; dx = -Math.abs(dx) }
      if (y <= ballR) { y = ballR; dy = Math.abs(dy) }
      
      // Paddle collision (y = 90)
      const px = paddleRef.current
      if (y >= 90 - ballR && y <= 92 && dy > 0 && x >= px - paddleW/2 && x <= px + paddleW/2) {
        y = 90 - ballR
        // Bounce angle depends on where it hit the paddle
        const hitPos = (x - px) / (paddleW / 2) // -1 to 1
        const maxAngle = Math.PI / 3 // 60 degrees
        const speed = Math.sqrt(dx*dx + dy*dy) * 1.02 // slight speed up on hit
        
        dx = speed * Math.sin(hitPos * maxAngle)
        dy = -speed * Math.cos(hitPos * maxAngle)
      }
      
      // Floor collision (Death)
      if (y >= 100) {
        setGameState('gameover')
        const { isNewBest, bestScore: newBest } = saveScore(gameMeta, scoreRef.current)
        setIsNewBest(isNewBest)
        setBestScore(newBest)
        return
      }
      
      // Brick collisions
      let hitBrick = false
      for (let b of bricksRef.current) {
        if (!b.active) continue
        
        // Simple AABB
        if (x + ballR >= b.x && x - ballR <= b.x + b.w &&
            y + ballR >= b.y && y - ballR <= b.y + b.h) {
          
          b.active = false
          hitBrick = true
          scoreRef.current += 10
          setScore(scoreRef.current)
          
          // Reverse direction depending on hit side
          // Simple heuristic: which side was it closest to?
          const overlapL = (x + ballR) - b.x
          const overlapR = (b.x + b.w) - (x - ballR)
          const overlapT = (y + ballR) - b.y
          const overlapB = (b.y + b.h) - (y - ballR)
          
          const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB)
          
          if (minOverlap === overlapL || minOverlap === overlapR) {
            dx = -dx
          } else {
            dy = -dy
          }
          break // Only hit one brick per frame to prevent weirdness
        }
      }
      
      ballRef.current = { x, y, dx, dy }
      setBall({ x, y })
      
      if (hitBrick) {
        setBricks([...bricksRef.current])
        // Check win
        if (!bricksRef.current.some(b => b.active)) {
          setGameState('won')
          return
        }
      }
    }
    
    lastTimeRef.current = time
    requestRef.current = requestAnimationFrame(update)
  }, [])

  // Single game-loop driver: starts whenever gameState becomes playing.
  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now()
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  // Input Handling
  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!containerRef.current || gameStateRef.current !== 'playing') return
      const rect = containerRef.current.getBoundingClientRect()
      let percent = ((clientX - rect.left) / rect.width) * 100
      percent = Math.max(paddleW/2, Math.min(100 - paddleW/2, percent))
      paddleRef.current = percent
      setPaddleX(percent)
    }

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleMove(e.touches[0].clientX)
    }

    if (gameState === 'playing') {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [gameState])

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-red-500/20 via-orange-500/10 to-amber-500/20 py-3 rounded-2xl border border-red-400/20 shadow-inner">
          <span className="text-red-200">🧱 SCORE <span className="text-white text-xl ml-1 tabular-nums">{score}</span></span>
          <span className="text-amber-200">🏁 LEVEL <span className="text-white text-xl ml-1 tabular-nums">{level}</span></span>
          <span className="hidden sm:inline text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestScore || 0}</span></span>
        </div>

        <div 
          ref={containerRef}
          className="w-full bg-gradient-to-b from-[#160a2e] to-[#0b1030] border-2 border-fuchsia-400/25 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.25)] aspect-[3/4] touch-none select-none"
        >
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-20 backdrop-blur-sm p-6 text-center">
              <p className="text-5xl animate-float">🧱</p>
              <button
                onClick={() => startLevel(1)}
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-red-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                🕹️ Smash Bricks
              </button>
              <p className="text-orange-200/80 text-sm font-bold">Move with mouse / finger. Don't drop the ball!</p>
            </div>
          )}

          {gameState === 'won' && (
            <div className="absolute inset-0 bg-emerald-950/80 flex flex-col gap-4 items-center justify-center z-20 backdrop-blur-sm animate-pop-in p-6 text-center">
              <span className="text-5xl">🎉</span>
              <span className="text-4xl font-black text-white">Level {level} Cleared!</span>
              <button
                onClick={() => startLevel(level + 1, true)}
                className="bg-gradient-to-r from-emerald-400 to-lime-400 text-gray-950 px-8 py-4 rounded-2xl font-black text-xl shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                Next Level ➜
              </button>
            </div>
          )}

          {/* Bricks */}
          {bricks.map(b => b.active && (
            <div
              key={b.id}
              className={`absolute rounded-lg border border-black/30 shadow-[inset_0_2px_0_rgba(255,255,255,0.35)] ${b.color}`}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.w}%`,
                height: `${b.h}%`,
              }}
            />
          ))}

          {/* Ball */}
          <div
            className="absolute rounded-full bg-gradient-to-br from-white to-amber-200 shadow-[0_0_16px_rgba(255,255,255,0.9)]"
            style={{
              left: `${ball.x - ballR}%`,
              top: `${ball.y - ballR}%`,
              width: `${ballR * 2}%`,
              height: `${ballR * 2}%`,
            }}
          />

          {/* Paddle */}
          <div
            className="absolute bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.7)] border border-white/40"
            style={{
              left: `${paddleX - paddleW/2}%`,
              top: `90%`,
              width: `${paddleW}%`,
              height: '3%',
            }}
          />
          
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
              onRestart={() => startLevel(1)}
              message={`🧱 You reached Level ${level}`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
