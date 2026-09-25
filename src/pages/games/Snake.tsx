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
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setScore(0)
    setFood(generateFood(INITIAL_SNAKE))
    setGameState('playing')
    setIsNewBest(false)
    lastUpdateRef.current = performance.now()
  }

  const gameOver = () => {
    setGameState('gameover')
    const { isNewBest, bestScore: newBest } = saveScore(gameMeta, score)
    setIsNewBest(isNewBest)
    setBestScore(newBest)
  }

  const update = useCallback((time: number) => {
    if (gameState !== 'playing') return

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
          setScore(s => s + 10)
          setFood(generateFood(newSnake))
        } else {
          newSnake.pop()
        }

        return newSnake
      })
      lastUpdateRef.current = time
    }

    requestRef.current = requestAnimationFrame(update)
  }, [food, gameState, generateFood])

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update)
    }
    return () => cancelAnimationFrame(requestRef.current)
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
        <div className="flex justify-between w-full max-w-md mb-4 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Score: <span className="text-white">{score}</span></span>
          <span className="text-xl">Best: <span className="text-white">{bestScore || 0}</span></span>
        </div>

        <div 
          className="relative bg-gray-900 border-2 border-white/10 rounded-xl overflow-hidden touch-none shadow-2xl"
          style={{ width: 'min(90vw, 400px)', height: 'min(90vw, 400px)' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <button
                onClick={resetGame}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95"
              >
                Play Game
              </button>
            </div>
          )}

          {snake.map((segment, i) => (
            <div
              key={i}
              className={`absolute rounded-sm ${i === 0 ? 'bg-green-400' : 'bg-green-600'}`}
              style={{
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                left: `${(segment.x / GRID_SIZE) * 100}%`,
                top: `${(segment.y / GRID_SIZE) * 100}%`
              }}
            />
          ))}

          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              left: `${(food.x / GRID_SIZE) * 100}%`,
              top: `${(food.y / GRID_SIZE) * 100}%`
            }}
          />
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm max-w-sm">
          <p className="hidden sm:block mb-2">Use <strong className="text-gray-300">Arrow Keys</strong> or <strong className="text-gray-300">WASD</strong> to move.</p>
          <p className="sm:hidden mb-2">Swipe to move.</p>
        </div>

        {gameState === 'gameover' && (
          <GameResult
            game={gameMeta}
            score={score}
            isNewBest={isNewBest}
            bestScore={bestScore}
            onRestart={resetGame}
            isWin={false}
          />
        )}
      </div>
    </GameLayout>
  )
}
