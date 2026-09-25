import { useState, useEffect, useRef, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'pong')!

export default function Pong() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState({ p1: 0, ai: 0 })
  const [winner, setWinner] = useState<'p1' | 'ai' | null>(null)

  // Game state for rendering
  const [paddle1X, setPaddle1X] = useState(50) // Player (bottom)
  const [paddle2X, setPaddle2X] = useState(50) // AI (top)
  const [ball, setBall] = useState({ x: 50, y: 50 })

  // Mutable refs for physics loop
  const p1Ref = useRef(50)
  const p2Ref = useRef(50)
  const ballRef = useRef({ x: 50, y: 50, dx: 0, dy: 0 })
  const scoreRef = useRef({ p1: 0, ai: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  const requestRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  const paddleW = 20
  const paddleH = 3
  const ballR = 2
  const WIN_SCORE = 5

  const resetBall = (serveToPlayer: boolean) => {
    const speed = 40
    // Angle slightly off vertical
    const angle = serveToPlayer ? (Math.PI / 2 + (Math.random() - 0.5)) : (-Math.PI / 2 + (Math.random() - 0.5))
    ballRef.current = {
      x: 50,
      y: 50,
      dx: speed * Math.sin(angle),
      dy: speed * Math.cos(angle)
    }
  }

  const startGame = () => {
    setScore({ p1: 0, ai: 0 })
    scoreRef.current = { p1: 0, ai: 0 }
    setWinner(null)
    setGameState('playing')
    
    p1Ref.current = 50
    p2Ref.current = 50
    resetBall(true)
    
    lastTimeRef.current = performance.now()
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
    requestRef.current = requestAnimationFrame(update)
  }

  const handleScore = (scorer: 'p1' | 'ai') => {
    scoreRef.current[scorer] += 1
    setScore({ ...scoreRef.current })
    
    if (scoreRef.current[scorer] >= WIN_SCORE) {
      setWinner(scorer)
      setGameState('gameover')
      // Save 1 if win, 0 if lose
      saveScore(gameMeta, scorer === 'p1' ? 1 : 0)
    } else {
      resetBall(scorer === 'ai') // serve to loser
    }
  }

  const update = useCallback((time: number) => {
    if (gameState !== 'playing') return
    
    if (lastTimeRef.current !== null) {
      const dt = (time - lastTimeRef.current) / 1000
      let { x, y, dx, dy } = ballRef.current
      
      x += dx * dt
      y += dy * dt
      
      // Wall collisions (left/right)
      if (x <= ballR) { x = ballR; dx = Math.abs(dx) }
      if (x >= 100 - ballR) { x = 100 - ballR; dx = -Math.abs(dx) }
      
      // Player 1 (Bottom) collision
      const p1X = p1Ref.current
      if (y >= 90 - ballR && y <= 90 + paddleH && dy > 0 && x >= p1X - paddleW/2 && x <= p1X + paddleW/2) {
        y = 90 - ballR
        const hitPos = (x - p1X) / (paddleW / 2) // -1 to 1
        const speed = Math.min(100, Math.sqrt(dx*dx + dy*dy) * 1.1) // speed up
        const angle = hitPos * (Math.PI / 3) // max 60 deg
        dx = speed * Math.sin(angle)
        dy = -speed * Math.cos(angle)
      }
      
      // AI (Top) collision
      const p2X = p2Ref.current
      if (y <= 10 + ballR + paddleH && y >= 10 && dy < 0 && x >= p2X - paddleW/2 && x <= p2X + paddleW/2) {
        y = 10 + ballR + paddleH
        const hitPos = (x - p2X) / (paddleW / 2)
        const speed = Math.min(100, Math.sqrt(dx*dx + dy*dy) * 1.1)
        const angle = hitPos * (Math.PI / 3)
        dx = speed * Math.sin(angle)
        dy = Math.abs(speed * Math.cos(angle)) // force positive (down)
      }
      
      // Scoring
      if (y > 105) {
        handleScore('ai')
        return
      } else if (y < -5) {
        handleScore('p1')
        return
      }
      
      // AI Logic (moves towards ball X)
      const aiSpeed = 35 * dt
      if (p2X < x - 2) p2Ref.current += aiSpeed
      else if (p2X > x + 2) p2Ref.current -= aiSpeed
      p2Ref.current = Math.max(paddleW/2, Math.min(100 - paddleW/2, p2Ref.current))
      
      ballRef.current = { x, y, dx, dy }
      setBall({ x, y })
      setPaddle2X(p2Ref.current)
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
      p1Ref.current = percent
      setPaddle1X(percent)
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
        
        <div className="flex justify-between items-center w-full mb-4 px-8 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase">AI</span>
            <span className="text-3xl text-zinc-500 font-black tabular-nums">{score.ai}</span>
          </div>
          <span className="text-sm font-black text-gray-700">VS</span>
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase text-blue-400">You</span>
            <span className="text-3xl text-white font-black tabular-nums">{score.p1}</span>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="w-full bg-gray-900 border-2 border-white/10 rounded-3xl relative overflow-hidden shadow-2xl aspect-[3/4] touch-none select-none"
        >
          {/* Center Line */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 border-t border-dashed border-white/20" />

          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
              <button
                onClick={startGame}
                className="bg-white hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
              >
                Start Game
              </button>
            </div>
          )}

          {/* Ball */}
          <div
            className="absolute bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]"
            style={{
              left: `${ball.x - ballR}%`,
              top: `${ball.y - ballR}%`,
              width: `${ballR * 2}%`,
              height: `${ballR * 2}%`,
            }}
          />

          {/* AI Paddle (Top) */}
          <div
            className="absolute bg-zinc-600 rounded-full shadow-[0_0_15px_rgba(82,82,91,0.5)] border border-zinc-500"
            style={{
              left: `${paddle2X - paddleW/2}%`,
              top: `10%`,
              width: `${paddleW}%`,
              height: `${paddleH}%`,
            }}
          />

          {/* Player Paddle (Bottom) */}
          <div
            className="absolute bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400"
            style={{
              left: `${paddle1X - paddleW/2}%`,
              top: `90%`,
              width: `${paddleW}%`,
              height: `${paddleH}%`,
            }}
          />
        </div>

        {gameState === 'gameover' && (
          <div className="mt-8 w-full animate-in slide-in-from-bottom-4">
            <GameResult
              game={gameMeta}
              isWin={winner === 'p1'}
              message={winner === 'p1' ? 'You beat the AI!' : 'The AI beat you!'}
              onRestart={startGame}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
