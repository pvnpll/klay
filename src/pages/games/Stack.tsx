import { useState, useEffect, useRef, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'stack')!

type Block = {
  id: number
  width: number
  x: number // left coordinate
  color: string
}

const COLORS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 
  'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500'
]

export default function Stack() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const [blocks, setBlocks] = useState<Block[]>([])
  const [activeBlock, setActiveBlock] = useState<Block | null>(null)

  const blocksRef = useRef<Block[]>([])
  const activeRef = useRef<Block | null>(null)
  const dirRef = useRef(1)
  const speedRef = useRef(60) // width units per second
  const offsetRef = useRef(0) // camera y offset
  
  const requestRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState

  const startGame = () => {
    const baseBlock = {
      id: 0,
      width: 60,
      x: 20, // (100 - 60) / 2
      color: COLORS[0]
    }
    
    blocksRef.current = [baseBlock]
    setBlocks([baseBlock])
    
    spawnActiveBlock(1, 60)
    
    setScore(0)
    setIsNewBest(false)
    setGameState('playing')
    offsetRef.current = 0
    speedRef.current = 50
    
    lastTimeRef.current = performance.now()
  }

  const spawnActiveBlock = (id: number, width: number) => {
    // Spawn from edge
    const dir = Math.random() > 0.5 ? 1 : -1
    dirRef.current = dir
    
    const x = dir === 1 ? -width : 100
    
    activeRef.current = {
      id,
      width,
      x,
      color: COLORS[id % COLORS.length]
    }
    setActiveBlock(activeRef.current)
  }

  const update = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return
    
    if (lastTimeRef.current !== null && activeRef.current) {
      const dt = (time - lastTimeRef.current) / 1000
      let { x, width } = activeRef.current
      
      x += speedRef.current * dirRef.current * dt
      
      // Bounce off walls (mostly to keep it on screen, it should go a bit offscreen then come back)
      if (x > 100) { x = 100; dirRef.current = -1 }
      if (x < -width) { x = -width; dirRef.current = 1 }
      
      activeRef.current = { ...activeRef.current, x }
      setActiveBlock(activeRef.current)
    }
    
    lastTimeRef.current = time
    requestRef.current = requestAnimationFrame(update)
  }, [])

  const handleTap = () => {
    if (gameState === 'idle') {
      startGame()
      return
    }
    if (gameState !== 'playing' || !activeRef.current) return

    const active = activeRef.current
    const topBlock = blocksRef.current[blocksRef.current.length - 1]
    
    // Calculate overlap
    const activeLeft = active.x
    const activeRight = active.x + active.width
    const topLeft = topBlock.x
    const topRight = topBlock.x + topBlock.width
    
    const overlapLeft = Math.max(activeLeft, topLeft)
    const overlapRight = Math.min(activeRight, topRight)
    const overlapWidth = overlapRight - overlapLeft
    
    if (overlapWidth <= 0) {
      // Complete miss
      setGameState('gameover')
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      const { isNewBest, bestScore: newBest } = saveScore(gameMeta, score)
      setIsNewBest(isNewBest)
      setBestScore(newBest)
      return
    }

    // Hit! Slice block
    let newX = overlapLeft
    let newWidth = overlapWidth
    
    // If it's a perfect match (within 2%), snap it and give bonus
    if (Math.abs(activeLeft - topLeft) < 2) {
      newX = topLeft
      newWidth = topBlock.width
      // Flash screen or something?
      const el = document.getElementById('stack-container')
      if (el) {
        el.classList.add('brightness-150')
        setTimeout(() => el.classList.remove('brightness-150'), 150)
      }
    }
    
    const finalBlock = { ...active, x: newX, width: newWidth }
    blocksRef.current = [...blocksRef.current, finalBlock]
    setBlocks(blocksRef.current)
    
    const newScore = score + 1
    setScore(newScore)
    
    // Increase speed slightly
    speedRef.current = Math.min(150, speedRef.current + 3)
    
    // Adjust camera offset if stack gets too high
    if (blocksRef.current.length > 5) {
      offsetRef.current += 1
    }
    
    spawnActiveBlock(finalBlock.id + 1, newWidth)
  }

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now()
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleTap()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/10 py-3 rounded-2xl border border-indigo-400/20 shadow-inner">
          <span className="text-indigo-200">🏗️ HEIGHT <span className="text-white text-xl ml-1 tabular-nums">{score}</span></span>
          <span className="text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestScore || 0}</span></span>
        </div>

        <div 
          id="stack-container"
          onMouseDown={handleTap}
          onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
          className="w-full bg-gradient-to-b from-[#12082e] to-[#1b0f3a] border-2 border-indigo-400/25 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(129,140,248,0.25)] aspect-[3/4] cursor-pointer touch-none select-none transition-all duration-100"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-20 backdrop-blur-sm p-6 text-center">
              <p className="text-5xl animate-float">🏗️</p>
              <button
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-indigo-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                🏗️ Build Tower
              </button>
              <p className="text-indigo-200/70 text-sm font-bold">Tap / Space to drop. Stack them high!</p>
            </div>
          )}

          <div className="absolute bottom-16 w-full text-center text-indigo-200/50 font-black text-sm z-0">
            👇 TAP or SPACE to drop 👇
          </div>

          <div 
            className="absolute bottom-0 w-full h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${offsetRef.current * 8}%)` }}
          >
            {blocks.map((b, i) => (
              <div
                key={b.id}
                className={`absolute rounded-md ${b.color} shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.4)] border border-white/20`}
                style={{
                  left: `${b.x}%`,
                  width: `${b.width}%`,
                  bottom: `${i * 8}%`,
                  height: '8%',
                }}
              />
            ))}
            
            {activeBlock && gameState === 'playing' && (
              <div
                className={`absolute rounded-md ${activeBlock.color} shadow-[0_6px_16px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] border border-white/30 animate-pop-in`}
                style={{
                  left: `${activeBlock.x}%`,
                  width: `${activeBlock.width}%`,
                  bottom: `${blocks.length * 8}%`,
                  height: '8%',
                }}
              />
            )}
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
              message={`🏗️ Tower height: ${score}`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
