import { useState, useRef, useEffect } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import confetti from 'canvas-confetti'

const gameMeta = GAMES.find(g => g.id === 'reaction-duel')!

type GameState = 'idle' | 'waiting' | 'ready' | 'result' | 'gameover'
type Player = 'p1' | 'p2'

export default function ReactionDuel() {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState({ p1: 0, p2: 0 })
  const [roundWinner, setRoundWinner] = useState<Player | null>(null)
  const [falseStartBy, setFalseStartBy] = useState<Player | null>(null)

  const timeoutRef = useRef<number | null>(null)
  const WIN_SCORE = 5

  const startRound = () => {
    setGameState('waiting')
    setRoundWinner(null)
    setFalseStartBy(null)
    
    // Random wait between 2 and 6 seconds
    const waitTime = 2000 + Math.random() * 4000
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setGameState('ready')
    }, waitTime)
  }

  const startGame = () => {
    setScore({ p1: 0, p2: 0 })
    startRound()
  }

  const handleTap = (player: Player) => {
    if (gameState === 'idle' || gameState === 'result' || gameState === 'gameover') return
    
    if (gameState === 'waiting') {
      // False start! Opponent gets point
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      const winner = player === 'p1' ? 'p2' : 'p1'
      setFalseStartBy(player)
      finishRound(winner)
    } else if (gameState === 'ready') {
      // Valid tap!
      finishRound(player)
    }
  }

  const finishRound = (winner: Player) => {
    setRoundWinner(winner)
    setGameState('result')
    
    const newScore = { ...score }
    newScore[winner] += 1
    setScore(newScore)
    
    if (newScore[winner] >= WIN_SCORE) {
      setTimeout(() => {
        setGameState('gameover')
        if (winner === 'p1') {
          confetti({ particleCount: 150, origin: { y: 0.9 }, angle: 90 }) // Bottom
        } else {
          confetti({ particleCount: 150, origin: { y: 0.1 }, angle: 270 }) // Top
        }
      }, 1000)
    } else {
      setTimeout(() => {
        startRound()
      }, 2000)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-lg mx-auto h-[70vh] min-h-[500px]">
        
        {gameState === 'idle' || gameState === 'gameover' ? (
          <div className="flex-1 w-full flex flex-col items-center justify-center p-8 bg-gray-900 rounded-3xl border-2 border-white/10 shadow-2xl z-10">
            {gameState === 'idle' ? (
              <>
                <h2 className="text-3xl font-black text-white mb-4 text-center">Ready for a duel?</h2>
                <p className="text-gray-400 text-center mb-8">One player takes the top of the device, the other takes the bottom. Wait for GREEN, then tap your side first!</p>
                <button
                  onClick={startGame}
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-black text-2xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
                >
                  START DUEL
                </button>
              </>
            ) : (
              <div className="w-full animate-in slide-in-from-bottom-4">
                <GameResult
                  game={gameMeta}
                  isWin={true}
                  message={score.p1 >= WIN_SCORE ? "BOTTOM PLAYER WINS!" : "TOP PLAYER WINS!"}
                  onRestart={startGame}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-900 relative">
            
            {/* Player 2 (TOP - Inverted) */}
            <div 
              onMouseDown={() => handleTap('p2')}
              onTouchStart={(e) => { e.preventDefault(); handleTap('p2') }}
              className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors duration-100 rotate-180
                ${gameState === 'waiting' ? 'bg-rose-500 active:bg-rose-600' : ''}
                ${gameState === 'ready' ? 'bg-emerald-500 active:bg-emerald-400' : ''}
                ${gameState === 'result' && roundWinner === 'p2' ? 'bg-yellow-400' : ''}
                ${gameState === 'result' && roundWinner !== 'p2' ? 'bg-gray-800' : ''}
              `}
            >
              <div className="text-6xl font-black text-black/20 absolute right-4 bottom-4">{score.p2}</div>
              {gameState === 'waiting' && <span className="text-3xl font-black text-white/80 tracking-widest uppercase">Wait...</span>}
              {gameState === 'ready' && <span className="text-5xl font-black text-white drop-shadow-md">TAP!</span>}
              {gameState === 'result' && roundWinner === 'p2' && falseStartBy === 'p1' && <span className="text-3xl font-black text-gray-900">False Start P1!</span>}
              {gameState === 'result' && roundWinner === 'p2' && !falseStartBy && <span className="text-5xl font-black text-gray-900">+1</span>}
            </div>

            <div className="h-2 w-full bg-gray-900 z-10 shadow-xl" />

            {/* Player 1 (BOTTOM) */}
            <div 
              onMouseDown={() => handleTap('p1')}
              onTouchStart={(e) => { e.preventDefault(); handleTap('p1') }}
              className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors duration-100
                ${gameState === 'waiting' ? 'bg-rose-500 active:bg-rose-600' : ''}
                ${gameState === 'ready' ? 'bg-emerald-500 active:bg-emerald-400' : ''}
                ${gameState === 'result' && roundWinner === 'p1' ? 'bg-yellow-400' : ''}
                ${gameState === 'result' && roundWinner !== 'p1' ? 'bg-gray-800' : ''}
              `}
            >
              <div className="text-6xl font-black text-black/20 absolute right-4 bottom-4">{score.p1}</div>
              {gameState === 'waiting' && <span className="text-3xl font-black text-white/80 tracking-widest uppercase">Wait...</span>}
              {gameState === 'ready' && <span className="text-5xl font-black text-white drop-shadow-md">TAP!</span>}
              {gameState === 'result' && roundWinner === 'p1' && falseStartBy === 'p2' && <span className="text-3xl font-black text-gray-900">False Start P2!</span>}
              {gameState === 'result' && roundWinner === 'p1' && !falseStartBy && <span className="text-5xl font-black text-gray-900">+1</span>}
            </div>

          </div>
        )}
      </div>
    </GameLayout>
  )
}
