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
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
    requestRef.current = requestAnimationFrame(update)
  }

  const update = useCallback((time: number) => {
    if (gameState !== 'playing') return
    
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
  }, [gameState])

  // Input Handling
  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!containerRef.current || gameState !== 'playing') return
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
        <div className="flex justify-between w-full mb-4 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Score: <span className="text-white">{score}</span></span>
          <span className="text-xl">Level: <span className="text-white">{level}</span></span>
          <span className="text-xl hidden sm:inline">Best: <span className="text-white">{bestScore || 0}</span></span>
        </div>

        <div 
          ref={containerRef}
          className="w-full bg-gray-900 border-2 border-white/10 rounded-3xl relative overflow-hidden shadow-2xl aspect-[3/4] touch-none select-none"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
              <button
                onClick={() => startLevel(1)}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
              >
                Start Game
              </button>
            </div>
          )}

          {gameState === 'won' && (
            <div className="absolute inset-0 bg-emerald-900/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in">
              <span className="text-4xl font-black text-white mb-6">Level {level} Cleared!</span>
              <button
                onClick={() => startLevel(level + 1, true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
              >
                Next Level
              </button>
            </div>
          )}

          {/* Bricks */}
          {bricks.map(b => b.active && (
            <div
              key={b.id}
              className={`absolute border border-gray-900 shadow-sm ${b.color}`}
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
            className="absolute bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{
              left: `${ball.x - ballR}%`,
              top: `${ball.y - ballR}%`,
              width: `${ballR * 2}%`,
              height: `${ballR * 2}%`,
            }}
          />

          {/* Paddle */}
          <div
            className="absolute bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400"
            style={{
              left: `${paddleX - paddleW/2}%`,
              top: `90%`,
              width: `${paddleW}%`,
              height: '3%',
            }}
          />
          
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-red-500/20 z-10 animate-in fade-in pointer-events-none" />
          )}
        </div>

        {gameState === 'gameover' && (
          <div className="mt-8 w-full animate-in slide-in-from-bottom-4">
            <GameResult
              game={gameMeta}
              score={score}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={() => startLevel(1)}
              message={`You reached Level ${level}`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
