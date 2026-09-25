import { useState } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import confetti from 'canvas-confetti'

const gameMeta = GAMES.find(g => g.id === 'connect-four')!

const ROWS = 6
const COLS = 7

type Player = 'red' | 'yellow' | null
type GameState = 'playing' | 'won_red' | 'won_yellow' | 'draw'

export default function ConnectFour() {
  const [board, setBoard] = useState<Player[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'yellow'>('red')
  const [gameState, setGameState] = useState<GameState>('playing')
  const [hoverCol, setHoverCol] = useState<number | null>(null)

  const checkWin = (grid: Player[][], r: number, c: number, player: Player) => {
    const directions = [
      [[0, 1], [0, -1]], // horizontal
      [[1, 0], [-1, 0]], // vertical
      [[1, 1], [-1, -1]], // diagonal /
      [[1, -1], [-1, 1]] // diagonal \
    ]

    for (let dir of directions) {
      let count = 1
      for (let [dr, dc] of dir) {
        let nr = r + dr
        let nc = c + dc
        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === player) {
          count++
          nr += dr
          nc += dc
        }
      }
      if (count >= 4) return true
    }
    return false
  }

  const handleColumnClick = (colIndex: number) => {
    if (gameState !== 'playing') return

    // Find lowest empty slot in column
    let rowIndex = -1
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][colIndex] === null) {
        rowIndex = r
        break
      }
    }

    if (rowIndex === -1) return // Column full

    const newBoard = board.map(row => [...row])
    newBoard[rowIndex][colIndex] = currentPlayer
    setBoard(newBoard)

    if (checkWin(newBoard, rowIndex, colIndex, currentPlayer)) {
      setGameState(`won_${currentPlayer}`)
      confetti({
        particleCount: 150,
        spread: 80,
        colors: currentPlayer === 'red' ? ['#ef4444', '#dc2626'] : ['#eab308', '#ca8a04']
      })
    } else {
      // Check draw
      const isDraw = newBoard[0].every(cell => cell !== null)
      if (isDraw) {
        setGameState('draw')
      } else {
        setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red')
      }
    }
  }

  const restart = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setCurrentPlayer('red')
    setGameState('playing')
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        
        <div className="flex justify-between items-center w-full mb-6 px-8 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <div className={`flex flex-col items-center transition-opacity ${currentPlayer === 'red' && gameState === 'playing' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
            <span className="text-xs uppercase text-red-500 font-bold mb-1">Player 1</span>
            <div className="w-8 h-8 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] border-2 border-red-400" />
          </div>
          
          <span className="text-sm font-black text-gray-700">VS</span>
          
          <div className={`flex flex-col items-center transition-opacity ${currentPlayer === 'yellow' && gameState === 'playing' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
            <span className="text-xs uppercase text-yellow-400 font-bold mb-1">Player 2</span>
            <div className="w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] border-2 border-yellow-300" />
          </div>
        </div>

        <div className="w-full max-w-[500px] bg-blue-600 p-2 sm:p-4 rounded-xl shadow-[0_10px_30px_rgba(37,99,235,0.4)] relative border-b-8 border-blue-800 touch-none">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {board.map((row, rIndex) => 
              row.map((cell, cIndex) => (
                <div
                  key={`${rIndex}-${cIndex}`}
                  className="relative aspect-square cursor-pointer"
                  onClick={() => handleColumnClick(cIndex)}
                  onMouseEnter={() => setHoverCol(cIndex)}
                  onMouseLeave={() => setHoverCol(null)}
                >
                  {/* The actual hole */}
                  <div className={`absolute inset-0 rounded-full border-4 sm:border-[6px] border-blue-700 overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] ${cell === null ? 'bg-gray-900' : ''}`}>
                    {/* The piece inside the hole */}
                    {cell === 'red' && (
                      <div className="w-full h-full bg-red-500 shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.3),inset_4px_4px_10px_rgba(255,255,255,0.4)] animate-in slide-in-from-top-full duration-300" />
                    )}
                    {cell === 'yellow' && (
                      <div className="w-full h-full bg-yellow-400 shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.2),inset_4px_4px_10px_rgba(255,255,255,0.5)] animate-in slide-in-from-top-full duration-300" />
                    )}
                  </div>
                  
                  {/* Hover indicator for the entire column */}
                  {hoverCol === cIndex && gameState === 'playing' && cell === null && (
                    <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 aspect-square rounded-full opacity-50 pointer-events-none transition-colors ${currentPlayer === 'red' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                  )}
                </div>
              ))
            )}
          </div>
          
          {gameState !== 'playing' && (
            <div className="absolute inset-0 bg-black/40 rounded-xl z-10" />
          )}
        </div>

        {gameState !== 'playing' && (
          <div className="mt-8 w-full animate-in slide-in-from-bottom-4 relative z-20">
            <GameResult
              game={gameMeta}
              isWin={gameState.startsWith('won')}
              message={gameState === 'won_red' ? 'Player 1 (Red) Wins!' : gameState === 'won_yellow' ? 'Player 2 (Yellow) Wins!' : "It's a draw!"}
              onRestart={restart}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
