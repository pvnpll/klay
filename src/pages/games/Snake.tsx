import { useState, useEffect, useCallback, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'snake')!

const GRID_SIZE = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION = { x: 0, y: -1 }

type Point = { x: number; y: number }
type GameState = 'idle' | 'playing' | 'gameover'

export default function Snake() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE)
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION)
  const [food, setFood] = useState<Point>({ x: 5, y: 5 })
  const [score, setScore] = useState(0)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)
  const [gameState, setGameState] = useState<GameState>('idle')

  const directionRef = useRef(direction)
  const lastUpdateRef = useRef(0)
  const requestRef = useRef<number>(0)

  const scoreRef = useRef(0)
  const gameStateRef = useRef<GameState>('idle')
  gameStateRef.current = gameState

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break
      }
    }
    return newFood
  }, [])

  const resetGame = () => {
    const start = [{ x: 10, y: 10 }]
    setSnake(start)
    setDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setScore(0)
    scoreRef.current = 0
    setFood(generateFood(start))
    setGameState('playing')
    setIsNewBest(false)
    lastUpdateRef.current = performance.now()
  }

  const gameOver = () => {
    if (gameStateRef.current !== 'playing') return
    setGameState('gameover')
    const { isNewBest, bestScore: newBest } = saveScore(gameMeta, scoreRef.current)
    setIsNewBest(isNewBest)
    setBestScore(newBest)
  }

  const update = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return

    if (time - lastUpdateRef.current > 120) {
      setSnake(prevSnake => {
        const head = prevSnake[0]
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        }

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          gameOver()
          return prevSnake
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          gameOver()
          return prevSnake
        }

        const newSnake = [newHead, ...prevSnake]

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          scoreRef.current += 10
          setScore(scoreRef.current)
          setFood(generateFood(newSnake))
        } else {
          newSnake.pop()
        }

        return newSnake
      })
      lastUpdateRef.current = time
    }

    requestRef.current = requestAnimationFrame(update)
  }, [food, generateFood])

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }

      if (gameState !== 'playing') {
        if (e.key === ' ' || e.key === 'Enter') {
          resetGame()
        }
        return
      }

      const currentDir = directionRef.current
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (currentDir.y !== 1) directionRef.current = { x: 0, y: -1 }
          break
        case 'ArrowDown':
        case 's':
          if (currentDir.y !== -1) directionRef.current = { x: 0, y: 1 }
          break
        case 'ArrowLeft':
        case 'a':
          if (currentDir.x !== 1) directionRef.current = { x: -1, y: 0 }
          break
        case 'ArrowRight':
        case 'd':
          if (currentDir.x !== -1) directionRef.current = { x: 1, y: 0 }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState])

  // Touch controls
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || gameState !== 'playing') return
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }
    
    const dx = touchEnd.x - touchStart.x
    const dy = touchEnd.y - touchStart.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (Math.max(absDx, absDy) > 30) {
      const currentDir = directionRef.current
      if (absDx > absDy) {
        if (dx > 0 && currentDir.x !== -1) directionRef.current = { x: 1, y: 0 }
        else if (dx < 0 && currentDir.x !== 1) directionRef.current = { x: -1, y: 0 }
      } else {
        if (dy > 0 && currentDir.y !== -1) directionRef.current = { x: 0, y: 1 }
        else if (dy < 0 && currentDir.y !== 1) directionRef.current = { x: 0, y: -1 }
      }
    }
    setTouchStart(null)
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center relative">
        <div className="flex justify-between w-full max-w-md mb-4 px-5 text-sm font-black bg-gradient-to-r from-lime-500/20 to-emerald-500/10 py-3 rounded-2xl border border-lime-400/20 shadow-inner">
          <span className="text-lime-200">🍏 SCORE <span className="text-white text-xl ml-1 tabular-nums">{score}</span></span>
          <span className="text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestScore || 0}</span></span>
        </div>

        <div 
          className="relative bg-[#0a1f14] border-2 border-lime-400/30 rounded-3xl overflow-hidden touch-none shadow-[0_0_40px_rgba(74,222,128,0.25)]"
          style={{ width: 'min(90vw, 400px)', height: 'min(90vw, 400px)' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(74,222,128,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.4) 1px, transparent 1px)', backgroundSize: '5% 5%' }} />
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-10 backdrop-blur-sm p-6 text-center">
              <p className="text-5xl animate-float">🐍</p>
              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-lime-400 to-emerald-500 text-gray-950 px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-emerald-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                ▶ Play Snake
              </button>
              <p className="text-lime-200/70 text-sm font-bold">Eat the apples, don't crash!</p>
            </div>
          )}

          {snake.map((segment, i) => (
            <div
              key={i}
              className="absolute transition-all duration-[100ms] ease-linear"
              style={{
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                left: `${(segment.x / GRID_SIZE) * 100}%`,
                top: `${(segment.y / GRID_SIZE) * 100}%`
              }}
            >
              <div className={`w-full h-full flex items-center justify-center ${i === 0 ? 'bg-lime-300 rounded-lg shadow-[0_0_12px_rgba(163,230,53,0.9)] text-[10px] z-10' : 'bg-emerald-600 rounded-[4px]'}`}>
                {i === 0 ? '👀' : ''}
              </div>
            </div>
          ))}

          <div
            className="absolute transition-all duration-300 flex items-center justify-center animate-float"
            style={{
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              left: `${(food.x / GRID_SIZE) * 100}%`,
              top: `${(food.y / GRID_SIZE) * 100}%`
            }}
          >
            <span className="text-sm leading-none">🍎</span>
          </div>
        </div>

        <div className="mt-4 text-center text-gray-400 text-sm max-w-sm font-medium">
          <p className="hidden sm:block mb-2">⌨️ Use <strong className="text-white">Arrow Keys</strong> or <strong className="text-white">WASD</strong> to move.</p>
          <p className="sm:hidden mb-2">👆 Swipe anywhere to move.</p>
        </div>

        {gameState === 'gameover' && (
          <div className="mt-6 w-full max-w-md animate-pop-in">
            <GameResult
              game={gameMeta}
              score={score}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={resetGame}
              isWin={false}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
