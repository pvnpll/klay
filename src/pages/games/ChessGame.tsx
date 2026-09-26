import { useState, useCallback, useEffect } from 'react'
import { Chess, Move } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'chess')!

export default function ChessGame() {
  const [game, setGame] = useState(new Chess())
  const [fen, setFen] = useState(game.fen())
  const [status, setStatus] = useState('White to move')
  const [gameMode, setGameMode] = useState<'1P' | '2P'>('1P')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium'>('easy')
  const [isComputing, setIsComputing] = useState(false)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')

  const updateStatus = useCallback((currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      setStatus(`Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins!`)
      saveScore(gameMeta, 1)
    } else if (currentGame.isDraw()) {
      setStatus('Draw!')
      saveScore(gameMeta, 1)
    } else if (currentGame.isStalemate()) {
      setStatus('Stalemate!')
      saveScore(gameMeta, 1)
    } else {
      let statusText = currentGame.turn() === 'w' ? 'White to move' : 'Black to move'
      if (currentGame.isCheck()) {
        statusText += ' (Check)'
      }
      setStatus(statusText)
    }
    setFen(currentGame.fen())
  }, [])

  const evaluateBoard = (chess: Chess) => {
    const pieceValues: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 }
    let value = 0
    const board = chess.board()
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c]
        if (piece) {
          const val = pieceValues[piece.type] || 0
          value += piece.color === 'w' ? val : -val
        }
      }
    }
    return value
  }

  const minimax = (chess: Chess, depth: number, isMaximizing: boolean): number => {
    if (depth === 0 || chess.isGameOver()) {
      return evaluateBoard(chess)
    }

    const moves = chess.moves({ verbose: true }) as Move[]
    if (isMaximizing) {
      let bestVal = -Infinity
      for (const move of moves) {
        chess.move(move)
        bestVal = Math.max(bestVal, minimax(chess, depth - 1, false))
        chess.undo()
      }
      return bestVal
    } else {
      let bestVal = Infinity
      for (const move of moves) {
        chess.move(move)
        bestVal = Math.min(bestVal, minimax(chess, depth - 1, true))
        chess.undo()
      }
      return bestVal
    }
  }

  const getBestMove = (chess: Chess, depth: number): Move | null => {
    const moves = chess.moves({ verbose: true }) as Move[]
    if (moves.length === 0) return null

    // To add some variety, shuffle the moves first
    for (let i = moves.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [moves[i], moves[j]] = [moves[j], moves[i]];
    }

    let bestMove = moves[0]
    const isMaximizing = chess.turn() === 'w'
    let bestVal = isMaximizing ? -Infinity : Infinity

    for (const move of moves) {
      chess.move(move)
      const boardValue = minimax(chess, depth - 1, !isMaximizing)
      chess.undo()
      if (isMaximizing) {
        if (boardValue > bestVal) {
          bestVal = boardValue
          bestMove = move
        }
      } else {
        if (boardValue < bestVal) {
          bestVal = boardValue
          bestMove = move
        }
      }
    }
    return bestMove
  }

  const makeComputerMove = useCallback(() => {
    if (game.isGameOver() || gameMode === '2P') return

    setIsComputing(true)
    
    // Simulate thinking time
    setTimeout(() => {
      let chosenMove: Move | null = null
      
      if (difficulty === 'easy') {
        const moves = game.moves({ verbose: true }) as Move[]
        if (moves.length > 0) {
          chosenMove = moves[Math.floor(Math.random() * moves.length)]
        }
      } else {
        // Medium difficulty uses depth 2 minimax
        chosenMove = getBestMove(game, 2)
      }

      if (!chosenMove) {
        setIsComputing(false)
        return
      }

      try {
        game.move({
          from: chosenMove.from,
          to: chosenMove.to,
          promotion: 'q'
        })
        setGame(new Chess(game.fen()))
        updateStatus(game)
      } catch (e) {
        console.error(e)
      }
      setIsComputing(false)
    }, 100)
  }, [game, difficulty, gameMode, updateStatus])

  useEffect(() => {
    if (gameMode === '1P' && game.turn() === 'b' && !game.isGameOver()) {
      makeComputerMove()
    }
  }, [fen, game, gameMode, makeComputerMove])

  const onDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!targetSquare) return false
    
    // In 1P mode, prevent human from moving Black's pieces
    if (gameMode === '1P' && game.turn() === 'b') return false
    
    if (game.isGameOver()) return false

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      })

      if (move === null) return false

      setGame(new Chess(game.fen()))
      updateStatus(game)
      return true
    } catch (e) {
      return false
    }
  }

  const resetGame = () => {
    const newGame = new Chess()
    setGame(newGame)
    setFen(newGame.fen())
    updateStatus(newGame)
    setIsComputing(false)
    setOrientation('white')
  }

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'white' ? 'black' : 'white')
  }

  return (
    <GameLayout title="♟️ Chess">
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
        
        <div className="w-full max-w-[400px] md:max-w-[500px] bg-gradient-to-b from-amber-500/15 to-stone-500/5 p-2 md:p-4 rounded-3xl border border-amber-300/20 shadow-[0_0_50px_rgba(251,191,36,0.2)] backdrop-blur-md">
          <Chessboard
            options={{
              position: fen,
              onPieceDrop: onDrop,
              boardOrientation: orientation,
              darkSquareStyle: { backgroundColor: '#b45309' },
              lightSquareStyle: { backgroundColor: '#fef3c7' },
              animationDurationInMs: 300
            }}
          />
        </div>

        <div className="flex flex-col gap-5 w-full max-w-[300px] bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl">
          <div>
            <h3 className="text-sm font-black text-amber-200 mb-2 uppercase tracking-widest">♟️ Game Status</h3>
            <p className={`text-lg font-black px-4 py-3 rounded-2xl text-center shadow-inner border ${
              status.includes('Checkmate') || status.includes('Draw') 
                ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              {isComputing ? '🤖 Computer thinking...' : status}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black text-gray-300 mb-2 uppercase tracking-widest">🎮 Mode</h3>
            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setGameMode('1P')}
                className={`flex-1 py-2 rounded-xl font-black transition-all ${
                  gameMode === '1P' 
                    ? 'bg-gradient-to-r from-emerald-400 to-lime-400 text-gray-950 shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                🤖 1P
              </button>
              <button
                onClick={() => setGameMode('2P')}
                className={`flex-1 py-2 rounded-xl font-black transition-all ${
                  gameMode === '2P' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                👯 2P
              </button>
            </div>
          </div>

          {gameMode === '1P' && (
            <div className="animate-pop-in">
              <h3 className="text-xs font-black text-gray-300 mb-2 uppercase tracking-widest">🤖 AI Level</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`flex-1 py-2 rounded-xl font-black transition-all border ${
                    difficulty === 'easy' 
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/50' 
                      : 'bg-black/30 text-gray-400 hover:bg-white/10 border-transparent'
                  }`}
                >
                  😌 Easy
                </button>
                <button
                  onClick={() => setDifficulty('medium')}
                  className={`flex-1 py-2 rounded-xl font-black transition-all border ${
                    difficulty === 'medium' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/50' 
                      : 'bg-black/30 text-gray-400 hover:bg-white/10 border-transparent'
                  }`}
                >
                  🔥 Spicy
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <button
              onClick={toggleOrientation}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-colors border border-white/10"
            >
              🔄 Flip Board
            </button>
            <button
              onClick={resetGame}
              className="w-full py-3 bg-gradient-to-r from-amber-300 to-orange-400 hover:brightness-110 text-gray-950 rounded-2xl font-black transition-transform active:scale-95"
            >
              ♟️ New Game
            </button>
          </div>
        </div>

        {game.isGameOver() && (
          <div className="w-full md:max-w-sm animate-pop-in">
          <GameResult
            game={gameMeta}
            message={`🏆 ${status}`}
            onRestart={resetGame}
          />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
