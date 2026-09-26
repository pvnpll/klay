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
    
    setScore(prev => {
      const newScore = { ...prev }
      newScore[winner] += 1
      
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
      return newScore
    })
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
        <div className="flex justify-center gap-6 w-full mb-4 px-5 py-3 rounded-2xl border border-yellow-400/20 bg-gradient-to-r from-yellow-500/15 to-orange-500/10 font-black text-sm">
          <span className="text-cyan-200">🔵 TOP <span className="text-white text-2xl ml-1 tabular-nums">{score.p2}</span></span>
          <span className="text-white/40 self-center">FIRST TO {WIN_SCORE}</span>
          <span className="text-yellow-200">🟡 BOTTOM <span className="text-white text-2xl ml-1 tabular-nums">{score.p1}</span></span>
        </div>
        <div className="w-full h-[62vh] min-h-[460px] flex flex-col">
        
        {gameState === 'idle' || gameState === 'gameover' ? (
          <div className="flex-1 w-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#241a3f] to-[#12102b] rounded-3xl border-2 border-yellow-400/25 shadow-[0_0_50px_rgba(250,204,21,0.2)] z-10 text-center gap-3">
            {gameState === 'idle' ? (
              <>
                <p className="text-5xl animate-float">⚡</p>
                <h2 className="text-3xl font-black text-white text-center">Ready for a duel?</h2>
                <p className="text-yellow-100/70 font-medium text-center mb-4">Top vs Bottom! Wait for GREEN, then smash your side first! False start = free point for rival 😈</p>
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-950 px-8 py-4 rounded-2xl font-black text-2xl shadow-lg shadow-yellow-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                  ⚡ START DUEL
                </button>
              </>
            ) : (
              <div className="w-full animate-pop-in">
                <GameResult
                  game={gameMeta}
                  isWin={true}
                  message={score.p1 >= WIN_SCORE ? "🏆 BOTTOM PLAYER WINS!" : "🏆 TOP PLAYER WINS!"}
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
              className={`relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors duration-100 rotate-180
                ${gameState === 'waiting' ? 'bg-gradient-to-b from-rose-600 to-rose-500 active:brightness-110' : ''}
                ${gameState === 'ready' ? 'bg-gradient-to-b from-lime-400 to-emerald-500 active:brightness-110 animate-pulse' : ''}
                ${gameState === 'result' && roundWinner === 'p2' ? 'bg-gradient-to-b from-yellow-300 to-amber-400' : ''}
                ${gameState === 'result' && roundWinner !== 'p2' ? 'bg-gray-800' : ''}
              `}
            >
              <div className="text-6xl font-black text-black/20 absolute right-4 bottom-4 tabular-nums">{score.p2}</div>
              {gameState === 'waiting' && <span className="text-3xl font-black text-white/90 tracking-widest uppercase">😡 Wait...</span>}
              {gameState === 'ready' && <span className="text-6xl font-black text-white drop-shadow-lg animate-pop-in">TAP! 👆</span>}
              {gameState === 'result' && roundWinner === 'p2' && falseStartBy === 'p1' && <span className="text-2xl font-black text-gray-900">False Start P1! 😂</span>}
              {gameState === 'result' && roundWinner === 'p2' && !falseStartBy && <span className="text-5xl font-black text-gray-900 animate-pop-in">+1 🎉</span>}
            </div>

            <div className="py-1 w-full bg-gray-950 z-10 text-center text-white/60 text-xs font-black tracking-widest">⚡ TAP YOUR SIDE ⚡</div>

            {/* Player 1 (BOTTOM) */}
            <div 
              onMouseDown={() => handleTap('p1')}
              onTouchStart={(e) => { e.preventDefault(); handleTap('p1') }}
              className={`relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors duration-100
                ${gameState === 'waiting' ? 'bg-gradient-to-b from-rose-600 to-rose-500 active:brightness-110' : ''}
                ${gameState === 'ready' ? 'bg-gradient-to-b from-lime-400 to-emerald-500 active:brightness-110 animate-pulse' : ''}
                ${gameState === 'result' && roundWinner === 'p1' ? 'bg-gradient-to-b from-yellow-300 to-amber-400' : ''}
                ${gameState === 'result' && roundWinner !== 'p1' ? 'bg-gray-800' : ''}
              `}
            >
              <div className="text-6xl font-black text-black/20 absolute right-4 bottom-4 tabular-nums">{score.p1}</div>
              {gameState === 'waiting' && <span className="text-3xl font-black text-white/90 tracking-widest uppercase">😡 Wait...</span>}
              {gameState === 'ready' && <span className="text-6xl font-black text-white drop-shadow-lg animate-pop-in">TAP! 👆</span>}
              {gameState === 'result' && roundWinner === 'p1' && falseStartBy === 'p2' && <span className="text-2xl font-black text-gray-900">False Start P2! 😂</span>}
              {gameState === 'result' && roundWinner === 'p1' && !falseStartBy && <span className="text-5xl font-black text-gray-900 animate-pop-in">+1 🎉</span>}
            </div>

          </div>
        )}
        </div>
      </div>
    </GameLayout>
  )
}
