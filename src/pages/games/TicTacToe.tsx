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

  const minimax = (squares: Player[], isMaximizing: boolean): number => {
    const state = checkWinner(squares)
    if (state === 'winner_o') return 10
    if (state === 'winner_x') return -10
    if (state === 'draw') return 0

    if (isMaximizing) {
      let bestScore = -Infinity
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'O'
          const score = minimax(squares, false)
          squares[i] = null
          bestScore = Math.max(score, bestScore)
        }
      }
      return bestScore
    } else {
      let bestScore = Infinity
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'X'
          const score = minimax(squares, true)
          squares[i] = null
          bestScore = Math.min(score, bestScore)
        }
      }
      return bestScore
    }
  }

  const getBestMove = (squares: Player[]) => {
    let bestScore = -Infinity
    let move = 0
    
    // Quick opening optimization to save CPU
    const emptySpots = squares.filter(s => !s).length
    if (emptySpots === 9) return 4 // center
    if (emptySpots === 8 && !squares[4]) return 4 // take center if human didn't

    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'O'
        const score = minimax(squares, false)
        squares[i] = null
        if (score > bestScore) {
          bestScore = score
          move = i
        }
      }
    }
    return move
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
        const bestMoveIndex = getBestMove([...newBoard])
        newBoard[bestMoveIndex] = 'O'
        setBoard([...newBoard])
        setGameState(checkWinner(newBoard))
        setXIsNext(true)
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
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-5xl mb-4 animate-float">⭕</p>
          <h2 className="text-3xl font-black text-white mb-2">Choose Your Battle! ⚔️</h2>
          <p className="text-gray-300 font-medium mb-8">Outsmart the computer or a friend!</p>
          <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={() => setMode('pvc')}
              className="flex flex-col items-center gap-2 bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 hover:from-emerald-500/30 text-white p-8 rounded-3xl border border-emerald-400/25 shadow-xl transition-transform hover:-translate-y-2 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500"
            >
              <Cpu size={48} className="text-emerald-300" />
              <span className="text-xl font-black">🤖 1 Player</span>
              <span className="text-emerald-200/70 text-sm font-bold">vs Unbeatable Computer</span>
            </button>
            <button
              onClick={() => setMode('pvp')}
              className="flex flex-col items-center gap-2 bg-gradient-to-b from-blue-500/20 to-blue-500/5 hover:from-blue-500/30 text-white p-8 rounded-3xl border border-blue-400/25 shadow-xl transition-transform hover:-translate-y-2 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
            >
              <User size={48} className="text-blue-300" />
              <span className="text-xl font-black">👯 2 Players</span>
              <span className="text-blue-200/70 text-sm font-bold">Local Match</span>
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  let getResultMessage = () => {
    if (gameState === 'winner_x') return '🎉 Player X Wins!'
    if (gameState === 'winner_o') return mode === 'pvc' ? '🤖 Computer Wins!' : '🎉 Player O Wins!'
    if (gameState === 'draw') return '🤝 It\'s a Draw!'
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
        <div className="flex justify-between items-center w-full max-w-sm mb-6 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
          <div className={`text-xl font-black px-3 py-1 rounded-xl transition-all ${xIsNext ? 'text-blue-300 bg-blue-500/20 scale-110 shadow-lg' : 'text-gray-500'}`}>
            ❌ X
          </div>
          <div className="text-white/30 font-black text-sm">VS</div>
          <div className={`text-xl font-black px-3 py-1 rounded-xl transition-all ${!xIsNext ? 'text-red-300 bg-red-500/20 scale-110 shadow-lg' : 'text-gray-500'}`}>
            {mode === 'pvc' ? '🤖 O' : '⭕ O'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-gradient-to-b from-indigo-500/20 to-fuchsia-500/10 p-3 rounded-3xl shadow-[0_0_40px_rgba(139,92,246,0.25)] border border-white/15">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className="w-24 h-24 sm:w-28 sm:h-28 bg-[#0d0d24] rounded-2xl flex items-center justify-center text-6xl font-black hover:bg-[#17173a] hover:scale-[1.03] active:scale-95 transition-all border border-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500 shadow-inner"
              disabled={!!cell || gameState !== 'playing' || (mode === 'pvc' && !xIsNext)}
            >
              {cell && (
                <span className={`animate-pop-in ${cell === 'X' ? 'text-blue-400 text-glow' : 'text-rose-400 text-glow'}`}>
                  {cell === 'X' ? '❌' : '⭕'}
                </span>
              )}
            </button>
          ))}
        </div>

        {gameState !== 'playing' && (
          <div className="mt-6 w-full max-w-sm animate-pop-in">
          <GameResult
            game={gameMeta}
            message={getResultMessage()}
            isWin={getIsWin()}
            onRestart={resetGame}
          />
          </div>
        )}
        
        <div className="mt-8 flex justify-center w-full">
          <button
            onClick={() => {
              setMode(null)
              resetGame()
            }}
            className="text-sm text-gray-400 hover:text-white font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full transition-colors"
          >
            🔀 Change Mode
          </button>
        </div>
      </div>
    </GameLayout>
  )
}
