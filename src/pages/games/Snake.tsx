import { useState, useEffect, useCallback, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { getFromStorage, saveToStorage } from '../../lib/storage'

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
  const [bestScore, setBestScore] = useState<number>(
    getFromStorage<number>('klay_snake_best', 0)
  )
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
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break
      }
    }
    return newFood
  }, [])

  const startGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setScore(0)
    setFood(generateFood(INITIAL_SNAKE))
    setGameState('playing')
  }

  const updateGame = useCallback((time: number) => {
    if (gameState !== 'playing') return

    if (time - lastUpdateRef.current > 150) {
      lastUpdateRef.current = time
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
          setGameState('gameover')
          return prevSnake
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameState('gameover')
          return prevSnake
        }

        const newSnake = [newHead, ...prevSnake]

        // Check food collision
        setFood(currentFood => {
          if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
            setScore(s => s + 10)
            return generateFood(newSnake)
          }
          newSnake.pop() // Remove tail if no food eaten
          return currentFood
        })

        return newSnake
      })
    }
    requestRef.current = requestAnimationFrame(updateGame)
  }, [gameState, generateFood])

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(updateGame)
    }
    return () => cancelAnimationFrame(requestRef.current)
  }, [gameState, updateGame])

  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > bestScore) {
        setBestScore(score)
        saveToStorage('klay_snake_best', score)
      }
    }
  }, [gameState, score, bestScore])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }

      const { x, y } = directionRef.current
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (y === 0) directionRef.current = { x: 0, y: -1 }
          break
        case 'ArrowDown':
        case 's':
          if (y === 0) directionRef.current = { x: 0, y: 1 }
          break
        case 'ArrowLeft':
        case 'a':
          if (x === 0) directionRef.current = { x: -1, y: 0 }
          break
        case 'ArrowRight':
        case 'd':
          if (x === 0) directionRef.current = { x: 1, y: 0 }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <GameLayout title="Snake">
      <div className="flex flex-col items-center">
        <div className="flex justify-between w-full max-w-[400px] mb-4">
          <p className="text-xl font-bold text-emerald-400">Score: {score}</p>
          <p className="text-xl font-bold text-gray-400">Best: {bestScore}</p>
        </div>

        <div className="relative w-full max-w-[400px] aspect-square bg-gray-800 rounded-lg border-2 border-gray-700 overflow-hidden">
          {gameState === 'idle' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
              <button
                onClick={startGame}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xl transition-transform hover:scale-105 active:scale-95"
              >
                Start Game
              </button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm">
              <h2 className="text-3xl font-black text-red-400 mb-2">Game Over!</h2>
              <p className="text-gray-300 mb-6">Final Score: {score}</p>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xl transition-transform hover:scale-105 active:scale-95"
              >
                Play Again
              </button>
            </div>
          )}

          <div 
            className="w-full h-full grid"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE
              const y = Math.floor(i / GRID_SIZE)
              const isSnake = snake.some(segment => segment.x === x && segment.y === y)
              const isHead = snake[0].x === x && snake[0].y === y
              const isFood = food.x === x && food.y === y

              return (
                <div
                  key={i}
                  className={`
                    ${isHead ? 'bg-emerald-400 rounded-sm' : ''}
                    ${isSnake && !isHead ? 'bg-emerald-500/80 rounded-sm' : ''}
                    ${isFood ? 'bg-red-500 rounded-full scale-75' : ''}
                  `}
                />
              )
            })}
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-400 text-sm">
          Use <kbd className="bg-gray-800 px-2 py-1 rounded">Arrow Keys</kbd> or <kbd className="bg-gray-800 px-2 py-1 rounded">WASD</kbd> to move
        </div>
      </div>
    </GameLayout>
  )
}
