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

  const makeComputerMove = useCallback(() => {
    if (game.isGameOver() || gameMode === '2P') return

    setIsComputing(true)
    
    // Simulate thinking time
    setTimeout(() => {
      const possibleMoves = game.moves({ verbose: true }) as Move[]
      
      if (possibleMoves.length === 0) {
        setIsComputing(false)
        return
      }

      let chosenMove: Move
      if (difficulty === 'easy') {
        chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
      } else {
        const captures = possibleMoves.filter(m => m.flags.includes('c') || m.flags.includes('e'))
        if (captures.length > 0) {
          chosenMove = captures[Math.floor(Math.random() * captures.length)]
        } else {
          chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
        }
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
    }, 500)
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
    <GameLayout title="Chess">
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
        
        <div className="w-full max-w-[400px] md:max-w-[500px] bg-gray-900/80 p-2 md:p-4 rounded-xl border border-gray-700/50 shadow-2xl backdrop-blur-md">
          <Chessboard
            options={{
              position: fen,
              onPieceDrop: onDrop,
              boardOrientation: orientation,
              darkSquareStyle: { backgroundColor: '#10b981' },
              lightSquareStyle: { backgroundColor: '#ecfdf5' },
              animationDurationInMs: 300
            }}
          />
        </div>

        <div className="flex flex-col gap-6 w-full max-w-[300px] bg-gray-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Game Status</h3>
            <p className={`text-lg font-bold px-4 py-3 rounded-xl text-center shadow-inner ${
              status.includes('Checkmate') || status.includes('Draw') 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isComputing ? 'Computer thinking...' : status}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Mode</h3>
            <div className="flex bg-gray-950 p-1 rounded-xl">
              <button
                onClick={() => setGameMode('1P')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  gameMode === '1P' 
                    ? 'bg-emerald-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                1 Player
              </button>
              <button
                onClick={() => setGameMode('2P')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  gameMode === '2P' 
                    ? 'bg-emerald-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                2 Player
              </button>
            </div>
          </div>

          {gameMode === '1P' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <h3 className="text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">AI Difficulty</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                    difficulty === 'easy' 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                      : 'bg-gray-950 text-gray-400 hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  Easy
                </button>
                <button
                  onClick={() => setDifficulty('medium')}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                    difficulty === 'medium' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
                      : 'bg-gray-950 text-gray-400 hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  Medium
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <button
              onClick={toggleOrientation}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
            >
              Flip Board
            </button>
            <button
              onClick={resetGame}
              className="w-full py-3 bg-white hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-transform active:scale-95"
            >
              Restart Game
            </button>
          </div>
        </div>

        {game.isGameOver() && (
          <GameResult
            game={gameMeta}
            message={status}
            onRestart={resetGame}
          />
        )}
      </div>
    </GameLayout>
  )
}
