import { useState, useEffect, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import confetti from 'canvas-confetti'

const gameMeta = GAMES.find(g => g.id === '2048')!

type Board = number[][]

const GRID_SIZE = 4

const getEmptyBoard = (): Board => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))

const getRandomEmptyCell = (board: Board) => {
  const emptyCells: { r: number; c: number }[] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) {
        emptyCells.push({ r, c })
      }
    }
  }
  if (emptyCells.length === 0) return null
  return emptyCells[Math.floor(Math.random() * emptyCells.length)]
}

const spawnTile = (board: Board): Board => {
  const newBoard = board.map(row => [...row])
  const emptyCell = getRandomEmptyCell(newBoard)
  if (emptyCell) {
    newBoard[emptyCell.r][emptyCell.c] = Math.random() < 0.9 ? 2 : 4
  }
  return newBoard
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => spawnTile(spawnTile(getEmptyBoard())))
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [hasContinued, setHasContinued] = useState(false)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const checkGameOver = (currentBoard: Board) => {
    // Check for empty cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentBoard[r][c] === 0) return false
      }
    }
    // Check for possible merges
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = currentBoard[r][c]
        if (
          (r < GRID_SIZE - 1 && currentBoard[r + 1][c] === val) ||
          (c < GRID_SIZE - 1 && currentBoard[r][c + 1] === val)
        ) {
          return false
        }
      }
    }
    return true
  }

  const moveLeft = (currentBoard: Board): { newBoard: Board; points: number; moved: boolean } => {
    let moved = false
    let points = 0
    const newBoard = getEmptyBoard()

    for (let r = 0; r < GRID_SIZE; r++) {
      const row = currentBoard[r].filter(val => val !== 0)
      const mergedRow: number[] = []
      
      let c = 0
      while (c < row.length) {
        if (c < row.length - 1 && row[c] === row[c + 1]) {
          const newVal = row[c] * 2
          mergedRow.push(newVal)
          points += newVal
          moved = true
          c += 2
        } else {
          mergedRow.push(row[c])
          c++
        }
      }
      
      for (let i = 0; i < mergedRow.length; i++) {
        newBoard[r][i] = mergedRow[i]
      }
      
      if (mergedRow.length !== row.length || currentBoard[r].some((val, i) => val !== newBoard[r][i])) {
        moved = true
      }
    }
    return { newBoard, points, moved }
  }

  const rotateRight = (matrix: Board): Board => {
    const result = getEmptyBoard()
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        result[c][GRID_SIZE - 1 - r] = matrix[r][c]
      }
    }
    return result
  }

  const rotateLeft = (matrix: Board): Board => {
    const result = getEmptyBoard()
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        result[GRID_SIZE - 1 - c][r] = matrix[r][c]
      }
    }
    return result
  }

  const handleMove = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver || (won && !hasContinued)) return

    setBoard(prev => {
      let currentBoard = prev
      let rotations = 0

      if (direction === 'RIGHT') rotations = 2
      else if (direction === 'DOWN') rotations = 1
      else if (direction === 'UP') rotations = 3

      for (let i = 0; i < rotations; i++) {
        currentBoard = rotateRight(currentBoard)
      }

      const { newBoard, points, moved } = moveLeft(currentBoard)
      
      let finalBoard = newBoard
      for (let i = 0; i < rotations; i++) {
        finalBoard = rotateLeft(finalBoard)
      }

      if (moved) {
        setScore(s => s + points)
        const spawnedBoard = spawnTile(finalBoard)
        
        // Check win condition
        if (!won) {
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              if (spawnedBoard[r][c] === 2048) {
                setWon(true)
                confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#f59e0b', '#fbbf24', '#fcd34d']
                })
              }
            }
          }
        }
        
        if (checkGameOver(spawnedBoard)) {
          setGameOver(true)
          const { isNewBest, bestScore: newBest } = saveScore(gameMeta, score + points)
          setIsNewBest(isNewBest)
          setBestScore(newBest)
        }
        
        return spawnedBoard
      }
      return prev
    })
  }, [gameOver, won, hasContinued, score])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') handleMove('UP')
      else if (e.key === 'ArrowDown' || e.key === 's') handleMove('DOWN')
      else if (e.key === 'ArrowLeft' || e.key === 'a') handleMove('LEFT')
      else if (e.key === 'ArrowRight' || e.key === 'd') handleMove('RIGHT')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleMove])

  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }
    const dx = touchEnd.x - touchStart.x
    const dy = touchEnd.y - touchStart.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        handleMove(dx > 0 ? 'RIGHT' : 'LEFT')
      } else {
        handleMove(dy > 0 ? 'DOWN' : 'UP')
      }
    }
    setTouchStart(null)
  }

  const resetGame = () => {
    setBoard(spawnTile(spawnTile(getEmptyBoard())))
    setScore(0)
    setGameOver(false)
    setWon(false)
    setHasContinued(false)
    setIsNewBest(false)
  }

  const getColor = (val: number) => {
    const colors: Record<number, string> = {
      0: 'bg-gray-800/50',
      2: 'bg-gray-200 text-gray-800',
      4: 'bg-yellow-100 text-gray-800',
      8: 'bg-orange-300 text-white shadow-[0_0_15px_rgba(253,186,116,0.5)]',
      16: 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)]',
      32: 'bg-red-400 text-white shadow-[0_0_20px_rgba(248,113,113,0.5)]',
      64: 'bg-red-600 text-white shadow-[0_0_25px_rgba(220,38,38,0.6)]',
      128: 'bg-yellow-400 text-white shadow-[0_0_30px_rgba(250,204,21,0.6)] text-4xl md:text-5xl',
      256: 'bg-yellow-500 text-white shadow-[0_0_30px_rgba(234,179,8,0.7)] text-4xl md:text-5xl',
      512: 'bg-amber-500 text-white shadow-[0_0_35px_rgba(245,158,11,0.8)] text-4xl md:text-5xl',
      1024: 'bg-amber-600 text-white shadow-[0_0_40px_rgba(217,119,6,0.9)] text-3xl md:text-4xl',
      2048: 'bg-yellow-300 text-gray-900 shadow-[0_0_50px_rgba(253,224,71,1)] text-3xl md:text-4xl font-black',
    }
    return colors[val] || 'bg-neutral-900 text-white shadow-[0_0_50px_rgba(255,255,255,1)] text-3xl md:text-4xl font-black'
  }

  return (
    <GameLayout title="🎯 2048">
      <div className="flex flex-col items-center max-w-lg mx-auto">
        <div className="w-full flex justify-between items-end mb-6">
          <div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-glow pb-1">
              2048
            </h2>
            <p className="text-amber-100/70 text-sm font-bold">Merge tiles & reach 2048! 🔥</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/5 border border-white/10 px-5 py-2 rounded-2xl text-center shadow-inner">
              <p className="text-amber-200 text-xs uppercase font-black tracking-widest mb-1">⭐ Score</p>
              <p className="text-white font-black text-2xl leading-none tabular-nums">{score}</p>
            </div>
            <div className="hidden sm:block bg-white/5 border border-white/10 px-5 py-2 rounded-2xl text-center shadow-inner">
              <p className="text-gray-300 text-xs uppercase font-black tracking-widest mb-1">👑 Best</p>
              <p className="text-white font-black text-2xl leading-none tabular-nums">{bestScore || 0}</p>
            </div>
          </div>
        </div>

        <div 
          className="relative bg-gradient-to-b from-amber-500/15 to-orange-600/5 p-3 md:p-4 rounded-3xl backdrop-blur-md shadow-[0_0_50px_rgba(251,146,60,0.2)] border border-amber-400/20 touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-4 gap-3 md:gap-4 bg-black/30 p-2 md:p-3 rounded-2xl">
            {board.map((row, r) => (
              row.map((cell, c) => (
                <div 
                  key={`${r}-${c}`}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-3xl md:text-4xl transition-all duration-150 tabular-nums ${getColor(cell)} ${cell !== 0 ? 'scale-100' : 'scale-95'}`}
                >
                  {cell !== 0 ? cell : ''}
                </div>
              ))
            ))}
          </div>

          {/* Overlays */}
          {gameOver && (
            <div className="absolute inset-0 z-30 p-4">
              <GameResult
                game={gameMeta}
                score={score}
                isNewBest={isNewBest}
                bestScore={bestScore}
                onRestart={resetGame}
                message={`🧩 You scored ${score}!`}
                mode="overlay"
              />
            </div>
          )}
          {won && !hasContinued && !gameOver && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center animate-pop-in z-10 gap-2">
              <p className="text-5xl animate-float">🎉</p>
              <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-orange-500">
                You made 2048!
              </h3>
              <p className="text-white text-lg font-black mb-4">Score: {score}</p>
              
              <div className="flex gap-4">
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-gradient-to-r from-lime-400 to-emerald-400 text-gray-950 rounded-2xl font-black hover:brightness-110 transition-transform active:scale-95"
                >
                  🔁 Play Again
                </button>
                <button
                  onClick={() => setHasContinued(true)}
                  className="px-6 py-3 bg-white/10 text-white rounded-2xl font-bold border border-white/15 hover:bg-white/20 transition-transform active:scale-95"
                >
                  😤 Keep Going
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-gray-300 text-sm font-medium">
          <p className="hidden md:block">⌨️ Use <strong className="text-white">Arrow Keys</strong> or <strong className="text-white">WASD</strong> to move tiles.</p>
          <p className="md:hidden">👆 Swipe to move tiles.</p>
        </div>
      </div>
    </GameLayout>
  )
}
