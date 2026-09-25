import { useState, useEffect } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore } from '../../utils/storage'
import { User, Cpu } from 'lucide-react'
import confetti from 'canvas-confetti'

const gameMeta = GAMES.find(g => g.id === 'tic-tac-toe')!
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
    if (gameState !== 'playing') {
      saveScore(gameMeta, 1)
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
        const available = newBoard.map((val, i) => val === null ? i : null).filter(val => val !== null)
        if (available.length > 0) {
          const randomIndex = available[Math.floor(Math.random() * available.length)] as number
          newBoard[randomIndex] = 'O'
          setBoard([...newBoard])
          setGameState(checkWinner(newBoard))
          setXIsNext(true)
        }
      }, 150)
    }
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setXIsNext(true)
    setGameState('playing')
  }

  if (!mode) {
    return (
      <GameLayout title={gameMeta.name}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-3xl font-black text-white mb-8">Choose Game Mode</h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={() => setMode('pvc')}
              className="flex flex-col items-center gap-4 bg-gray-900 hover:bg-gray-800 text-white p-8 rounded-3xl border border-white/10 shadow-xl transition-transform hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500"
            >
              <Cpu size={48} className="text-emerald-400" />
              <span className="text-xl font-bold">1 Player</span>
              <span className="text-gray-400 text-sm">vs Computer</span>
            </button>
            <button
              onClick={() => setMode('pvp')}
              className="flex flex-col items-center gap-4 bg-gray-900 hover:bg-gray-800 text-white p-8 rounded-3xl border border-white/10 shadow-xl transition-transform hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
            >
              <User size={48} className="text-blue-400" />
              <span className="text-xl font-bold">2 Players</span>
              <span className="text-gray-400 text-sm">Local Match</span>
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  let getResultMessage = () => {
    if (gameState === 'winner_x') return 'Player X Wins!'
    if (gameState === 'winner_o') return mode === 'pvc' ? 'Computer Wins!' : 'Player O Wins!'
    if (gameState === 'draw') return 'It\'s a Draw!'
    return ''
  }

  let getIsWin = () => {
    if (gameState === 'winner_x') return true
    if (gameState === 'draw') return undefined
    return false
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center relative">
        <div className="flex justify-between items-center w-full max-w-sm mb-8 px-6 py-4 bg-gray-950/80 rounded-2xl border border-white/5 shadow-inner">
          <div className={`text-2xl font-black ${xIsNext ? 'text-blue-400 scale-110' : 'text-gray-500'} transition-all`}>
            Player X
          </div>
          <div className="text-gray-600 font-bold">VS</div>
          <div className={`text-2xl font-black ${!xIsNext ? 'text-red-400 scale-110' : 'text-gray-500'} transition-all`}>
            {mode === 'pvc' ? 'Computer O' : 'Player O'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-gray-800 p-3 rounded-3xl shadow-2xl">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-900 rounded-2xl flex items-center justify-center text-6xl font-black hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500"
              disabled={!!cell || gameState !== 'playing' || (mode === 'pvc' && !xIsNext)}
            >
              {cell && (
                <span className={cell === 'X' ? 'text-blue-500' : 'text-red-500'}>
                  {cell}
                </span>
              )}
            </button>
          ))}
        </div>

        {gameState !== 'playing' && (
          <GameResult
            game={gameMeta}
            message={getResultMessage()}
            isWin={getIsWin()}
            onRestart={resetGame}
          />
        )}
        
        <div className="mt-12 flex justify-center w-full">
          <button
            onClick={() => {
              setMode(null)
              resetGame()
            }}
            className="text-gray-500 hover:text-gray-300 font-medium transition-colors"
          >
            Change Mode
          </button>
        </div>
      </div>
    </GameLayout>
  )
}
