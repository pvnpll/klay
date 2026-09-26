import { useState, useEffect, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'sudoku')!

type Cell = {
  value: number | null
  isFixed: boolean
  isError: boolean
}

// Generate Sudoku
const generateSudoku = () => {
  const board: (number | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null))
  
  const isValid = (grid: (number | null)[][], row: number, col: number, num: number) => {
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false
      if (grid[x][col] === num) return false
    }
    const startRow = row - row % 3, startCol = col - col % 3
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i + startRow][j + startCol] === num) return false
      }
    }
    return true
  }

  const fillBoard = (grid: (number | null)[][]): boolean => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] === null) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
          for (let num of nums) {
            if (isValid(grid, i, j, num)) {
              grid[i][j] = num
              if (fillBoard(grid)) return true
              grid[i][j] = null
            }
          }
          return false
        }
      }
    }
    return true
  }

  fillBoard(board)

  // Remove cells for Hard difficulty (around 50-55 removed)
  const cellsToRemove = 53
  let removed = 0
  while (removed < cellsToRemove) {
    const r = Math.floor(Math.random() * 9)
    const c = Math.floor(Math.random() * 9)
    if (board[r][c] !== null) {
      board[r][c] = null
      removed++
    }
  }

  return board.map(row => row.map(val => ({
    value: val,
    isFixed: val !== null,
    isError: false
  })))
}

export default function Sudoku() {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [gameState, setGameState] = useState<'playing' | 'won'>('playing')
  const [timeElapsed, setTimeElapsed] = useState(0)

  const [bestTime, setBestTime] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const initGame = useCallback(() => {
    setGrid(generateSudoku())
    setSelectedCell(null)
    setGameState('playing')
    setTimeElapsed(0)
    setIsNewBest(false)
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  useEffect(() => {
    if (gameState !== 'playing') return
    const timer = setInterval(() => {
      setTimeElapsed(t => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [gameState])

  const checkWin = (currentGrid: Cell[][]) => {
    // Check if fully filled
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentGrid[r][c].value === null || currentGrid[r][c].isError) return
      }
    }
    setGameState('won')
    const { isNewBest, bestScore } = saveScore(gameMeta, timeElapsed)
    setIsNewBest(isNewBest)
    setBestTime(bestScore)
  }

  const handleInput = (num: number | null) => {
    if (gameState !== 'playing' || !selectedCell) return
    const [r, c] = selectedCell
    if (grid[r][c].isFixed) return

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
    newGrid[r][c].value = num
    
    // Check basic errors (duplicates in row/col/box)
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (newGrid[i][j].value !== null) {
          let hasError = false
          const val = newGrid[i][j].value
          // row
          for (let x = 0; x < 9; x++) if (x !== j && newGrid[i][x].value === val) hasError = true
          // col
          for (let x = 0; x < 9; x++) if (x !== i && newGrid[x][j].value === val) hasError = true
          // box
          const startR = i - i % 3, startC = j - j % 3
          for (let r2 = 0; r2 < 3; r2++) {
            for (let c2 = 0; c2 < 3; c2++) {
              if ((r2 + startR !== i || c2 + startC !== j) && newGrid[r2 + startR][c2 + startC].value === val) {
                hasError = true
              }
            }
          }
          newGrid[i][j].isError = hasError
        } else {
          newGrid[i][j].isError = false
        }
      }
    }

    setGrid(newGrid)
    checkWin(newGrid)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      if (e.key >= '1' && e.key <= '9') handleInput(parseInt(e.key))
      if (e.key === 'Backspace' || e.key === 'Delete') handleInput(null)
      
      if (selectedCell) {
        let [r, c] = selectedCell
        if (e.key === 'ArrowUp' && r > 0) setSelectedCell([r - 1, c])
        if (e.key === 'ArrowDown' && r < 8) setSelectedCell([r + 1, c])
        if (e.key === 'ArrowLeft' && c > 0) setSelectedCell([r, c - 1])
        if (e.key === 'ArrowRight' && c < 8) setSelectedCell([r, c + 1])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, gameState, grid])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-md mx-auto">
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-indigo-500/20 to-blue-500/10 py-3 rounded-2xl border border-indigo-400/20 shadow-inner">
          <span className="text-indigo-200">⏱️ TIME <span className="text-white text-xl ml-1 tabular-nums">{formatTime(timeElapsed)}</span></span>
          <span className="text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestTime ? formatTime(bestTime) : '—'}</span></span>
        </div>

        <div className="bg-gradient-to-b from-indigo-500/15 to-blue-500/5 p-2 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.25)] border border-indigo-400/20 mb-6 w-full max-w-[400px] aspect-square flex flex-col">
          {grid.map((row, r) => (
            <div key={r} className="flex flex-1">
              {row.map((cell, c) => {
                const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c
                const isHighlighted = selectedCell && !isSelected && (selectedCell[0] === r || selectedCell[1] === c)
                
                let cellClass = 'bg-[#0b1030] hover:bg-white/10'
                if (isSelected) cellClass = 'bg-indigo-500/50'
                else if (isHighlighted) cellClass = 'bg-indigo-500/15'
                if (cell.isError) cellClass = 'bg-red-500/30 text-red-300'
                if (cell.isFixed) cellClass += ' font-black text-indigo-100'
                else cellClass += ' text-amber-300 font-black'
                
                const borderB = r === 2 || r === 5 ? 'border-b-4 border-b-indigo-300/40' : 'border-b'
                const borderR = c === 2 || c === 5 ? 'border-r-4 border-r-indigo-300/40' : 'border-r'

                return (
                  <div
                    key={c}
                    onClick={() => setSelectedCell([r, c])}
                    className={`flex-1 flex items-center justify-center text-lg sm:text-2xl cursor-pointer transition-colors border-t border-l border-white/10 ${borderB} ${borderR} ${cellClass}`}
                  >
                    {cell.value || ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-5 gap-2 w-full max-w-[400px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleInput(num)}
              className="bg-gradient-to-b from-indigo-500 to-indigo-700 hover:brightness-110 text-white h-12 rounded-2xl font-black text-xl active:scale-95 transition-transform touch-manipulation border border-white/20 shadow-lg"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleInput(null)}
            className="bg-red-500/30 hover:bg-red-500/50 text-red-200 h-12 rounded-2xl font-black text-xl active:scale-95 transition-transform touch-manipulation border border-red-400/30"
          >
            ⌫
          </button>
        </div>

        {gameState === 'won' && (
          <div className="mt-6 w-full animate-pop-in">
            <GameResult
              game={gameMeta}
              score={timeElapsed}
              isNewBest={isNewBest}
              bestScore={bestTime}
              onRestart={initGame}
              message="🧩 Puzzle Solved!"
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
