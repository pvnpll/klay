import { useState, useCallback, useEffect } from 'react'
import { Chess, Move } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { GameLayout } from '../../components/GameLayout'

export default function ChessGame() {
  const [game, setGame] = useState(new Chess())
  // Use fen to force re-renders when the game state changes
  const [fen, setFen] = useState(game.fen())
  const [status, setStatus] = useState('White to move')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium'>('easy')
  const [isComputing, setIsComputing] = useState(false)

  const updateStatus = useCallback((currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      setStatus(`Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins!`)
    } else if (currentGame.isDraw()) {
      setStatus('Draw!')
    } else if (currentGame.isStalemate()) {
      setStatus('Stalemate!')
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
    if (game.isGameOver()) return

    setIsComputing(true)
    
    // Simulate thinking time
    setTimeout(() => {
      const possibleMoves = game.moves({ verbose: true }) as Move[]
      
      if (possibleMoves.length === 0) {
        setIsComputing(false)
        return
      }

      // Very simple computer AI logic
      let chosenMove: Move
      
      if (difficulty === 'easy') {
        // completely random
        chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
      } else {
        // Prefer captures, otherwise random
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
  }, [game, difficulty, updateStatus])

  useEffect(() => {
    // If it's black's turn, trigger the computer move
    if (game.turn() === 'b' && !game.isGameOver()) {
      makeComputerMove()
    }
  }, [fen, game, makeComputerMove])

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    // Prevent moves if it's the computer's turn or game over
    if (game.turn() === 'b' || game.isGameOver()) return false

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // always promote to queen for simplicity in V1
      })

      if (move === null) return false

      // Successful move
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
  }

  return (
    <GameLayout title="Chess (vs AI)">
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
        
        {/* Chessboard Container */}
        <div className="w-full max-w-[400px] md:max-w-[500px] bg-gray-800 p-2 md:p-4 rounded-xl border border-gray-700 shadow-2xl">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation="white"
            customDarkSquareStyle={{ backgroundColor: '#10b981' }} // Emerald 500
            customLightSquareStyle={{ backgroundColor: '#ecfdf5' }} // Emerald 50
            animationDuration={300}
          />
        </div>

        {/* Controls Sidebar */}
        <div className="flex flex-col gap-6 w-full max-w-[300px] bg-gray-900/50 p-6 rounded-xl border border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Game Status</h3>
            <p className={`text-lg font-medium px-4 py-2 rounded-lg text-center ${
              status.includes('Checkmate') || status.includes('Draw') 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            }`}>
              {isComputing ? 'Computer thinking...' : status}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">AI Difficulty</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setDifficulty('easy')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  difficulty === 'easy' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Easy
              </button>
              <button
                onClick={() => setDifficulty('medium')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  difficulty === 'medium' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Medium
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={resetGame}
              className="w-full py-3 bg-white hover:bg-gray-200 text-gray-900 rounded-lg font-bold transition-transform active:scale-95"
            >
              Restart Game
            </button>
          </div>
        </div>

      </div>
    </GameLayout>
  )
}
