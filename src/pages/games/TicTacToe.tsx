import { useState, useEffect } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { RotateCcw, User, Cpu } from 'lucide-react'
import confetti from 'canvas-confetti'

type Player = 'X' | 'O' | null
type GameMode = 'pvp' | 'pvc' | null
type GameState = 'playing' | 'winner_x' | 'winner_o' | 'draw'

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
]

export default function TicTacToe() {
  const [mode, setMode] = useState<GameMode>(null)
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState<boolean>(true)
  const [gameState, setGameState] = useState<GameState>('playing')

  useEffect(() => {
    if (gameState === 'winner_x' || gameState === 'winner_o') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: gameState === 'winner_x' ? ['#3b82f6', '#60a5fa'] : ['#ef4444', '#f87171']
      })
    }
  }, [gameState])

  const checkWinner = (squares: Player[]): GameState => {
    for (let i = 0; i < WIN_COMBOS.length; i++) {
      const [a, b, c] = WIN_COMBOS[i]
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a] === 'X' ? 'winner_x' : 'winner_o'
      }
    }
    if (!squares.includes(null)) {
      return 'draw'
    }
    return 'playing'
  }

  const handleClick = (index: number) => {
    if (board[index] || gameState !== 'playing') return

    // If it's PvC and it's O's turn, player shouldn't be able to click
    if (mode === 'pvc' && !xIsNext) return

    const newBoard = [...board]
    newBoard[index] = xIsNext ? 'X' : 'O'
    
    setBoard(newBoard)
    
    const newState = checkWinner(newBoard)
    setGameState(newState)
    setXIsNext(!xIsNext)

    // Computer's turn
    if (mode === 'pvc' && newState === 'playing') {
      setTimeout(() => {
        makeComputerMove(newBoard)
      }, 500)
    }
  }

  const makeComputerMove = (currentBoard: Player[]) => {
    const emptyIndices = currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[]
    if (emptyIndices.length > 0) {
      // Random move
      const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
      const newBoard = [...currentBoard]
      newBoard[randomIndex] = 'O'
      
      setBoard(newBoard)
      setGameState(checkWinner(newBoard))
      setXIsNext(true)
    }
  }

  const startNewGame = (newMode: GameMode) => {
    setMode(newMode)
    setBoard(Array(9).fill(null))
    setXIsNext(true)
    setGameState('playing')
  }

  if (!mode) {
    return (
      <GameLayout title="Tic-Tac-Toe">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto py-12 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4">Choose Game Mode</h2>
          
          <button
            onClick={() => startNewGame('pvc')}
            className="flex items-center justify-center gap-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-bold text-xl transition-all hover:-translate-y-1"
          >
            <Cpu size={28} />
            Player vs Computer
          </button>
          
          <button
            onClick={() => startNewGame('pvp')}
            className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-bold text-xl transition-all hover:-translate-y-1"
          >
            <User size={28} />
            Player vs Player
          </button>
        </div>
      </GameLayout>
    )
  }

  let statusText = ''
  let statusColor = 'text-white'
  
  if (gameState === 'playing') {
    statusText = xIsNext ? "Player X's Turn" : "Player O's Turn"
    if (mode === 'pvc' && !xIsNext) {
      statusText = "Computer is thinking..."
      statusColor = 'text-gray-400'
    }
  } else if (gameState === 'winner_x') {
    statusText = 'Player X Wins!'
    statusColor = 'text-emerald-400'
  } else if (gameState === 'winner_o') {
    statusText = mode === 'pvc' ? 'Computer Wins!' : 'Player O Wins!'
    statusColor = 'text-rose-400'
  } else if (gameState === 'draw') {
    statusText = "It's a Draw!"
    statusColor = 'text-yellow-400'
  }

  return (
    <GameLayout title="Tic-Tac-Toe">
      <div className="flex flex-col items-center max-w-md mx-auto">
        <div className="flex justify-between w-full mb-8 text-gray-400 font-medium">
          <button 
            onClick={() => setMode(null)}
            className="hover:text-white transition-colors"
          >
            Change Mode
          </button>
          <span className="bg-gray-800 px-3 py-1 rounded-full text-sm">
            {mode === 'pvc' ? 'vs Computer' : 'Player vs Player'}
          </span>
        </div>

        <div className={`text-2xl font-bold mb-8 h-8 ${statusColor} transition-colors`}>
          {statusText}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full aspect-square max-w-[320px] mb-10">
          {board.map((cell, index) => {
            let cellColor = 'text-gray-700'
            if (cell === 'X') cellColor = 'text-emerald-400'
            if (cell === 'O') cellColor = 'text-rose-400'

            return (
              <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={cell !== null || gameState !== 'playing' || (mode === 'pvc' && !xIsNext)}
                className="bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center text-5xl sm:text-6xl font-black transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500"
              >
                <span className={`${cellColor} drop-shadow-sm`}>
                  {cell}
                </span>
              </button>
            )
          })}
        </div>

        {gameState !== 'playing' && (
          <button
            onClick={() => startNewGame(mode)}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 px-8 rounded-xl font-bold text-xl transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 w-full max-w-[320px]"
          >
            <RotateCcw size={24} />
            PLAY AGAIN
          </button>
        )}
      </div>
    </GameLayout>
  )
}
