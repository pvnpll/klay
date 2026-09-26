import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'number-rush')!
type GameState = 'ready' | 'playing' | 'completed'

export default function NumberRush() {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [numbers, setNumbers] = useState<number[]>([])
  const [nextExpected, setNextExpected] = useState<number>(1)
  const [timeElapsed, setTimeElapsed] = useState<number>(0)
  const [wrongFeedback, setWrongFeedback] = useState<number | null>(null)
  
  const [bestTime, setBestTime] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    initGame()
    return () => stopTimer()
  }, [])

  const initGame = () => {
    stopTimer()
    const nums = Array.from({ length: 20 }, (_, i) => i + 1)
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[nums[i], nums[j]] = [nums[j], nums[i]]
    }
    setNumbers(nums)
    setNextExpected(1)
    setTimeElapsed(0)
    setGameState('ready')
    setWrongFeedback(null)
    setIsNewBest(false)
  }

  const startTimer = () => {
    startTimeRef.current = performance.now()
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(performance.now() - startTimeRef.current)
    }, 10) // update every 10ms
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleNumberClick = (num: number) => {
    if (gameState === 'completed') return

    if (num === nextExpected) {
      if (num === 1) {
        setGameState('playing')
        startTimer()
      }
      
      setWrongFeedback(null)
      
      if (num === 20) {
        // Win!
        stopTimer()
        setGameState('completed')
        const finalTime = Math.round(performance.now() - startTimeRef.current)
        setTimeElapsed(finalTime)
        
        // Save score using storage abstraction, score is in seconds? Actually gameResult expects seconds for time, so divide by 1000
        const timeInSeconds = parseFloat((finalTime / 1000).toFixed(2))
        const { isNewBest, bestScore } = saveScore(gameMeta, timeInSeconds)
        setIsNewBest(isNewBest)
        setBestTime(bestScore)
      } else {
        setNextExpected(num + 1)
      }
    } else if (num > nextExpected) {
      // Wrong number clicked
      setWrongFeedback(num)
      setTimeout(() => setWrongFeedback(null), 300)
    }
  }

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(2)
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center max-w-2xl mx-auto relative">
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-blue-500/20 to-cyan-500/10 py-3 rounded-2xl border border-blue-400/20 shadow-inner">
          <span className="text-blue-200">🔢 NEXT <span className="text-white text-2xl ml-1 tabular-nums">{nextExpected}</span></span>
          <span className="text-cyan-200">⏱️ TIME <span className="text-white text-xl ml-1 tabular-nums">{formatTime(timeElapsed)}s</span></span>
          <span className="text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestTime ? `${bestTime}s` : '—'}</span></span>
        </div>

        {/* progress */}
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-5 border border-white/10">
          <div className="h-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 rounded-full transition-all duration-200" style={{ width: `${((nextExpected - 1) / 20) * 100}%` }} />
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3 w-full">
          {numbers.map((num) => {
            const isClicked = num < nextExpected
            const isWrong = wrongFeedback === num
            const isNext = num === nextExpected
            
            let btnClass = "bg-white/5 border-white/10 text-white"
            if (isClicked) {
              btnClass = "bg-emerald-500/20 border-emerald-400/30 text-emerald-300/50 cursor-default scale-95"
            } else if (isWrong) {
              btnClass = "bg-red-500 border-red-300 text-white animate-shake"
            } else if (isNext) {
              btnClass = "bg-gradient-to-b from-amber-300 to-orange-400 border-white/40 text-gray-950 shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-pulse scale-105"
            } else if (gameState === 'playing' || gameState === 'ready') {
              btnClass = "bg-gradient-to-b from-blue-500 to-blue-700 border-white/20 text-white shadow-lg hover:-translate-y-1 hover:brightness-110 active:scale-95"
            }

            return (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={isClicked}
                className={`aspect-square flex items-center justify-center rounded-2xl font-black text-2xl sm:text-3xl transition-all select-none border-2 tabular-nums ${btnClass} focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400`}
              >
                {isClicked ? '✅' : num}
              </button>
            )
          })}
        </div>
        
        {gameState !== 'completed' && (
          <div className="mt-6 flex justify-center w-full">
            <button
              onClick={initGame}
              className="text-sm text-gray-300 hover:text-white font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full transition-colors"
            >
              🔀 Shuffle Numbers
            </button>
          </div>
        )}

        {gameState === 'completed' && (
          <div className="mt-6 w-full animate-pop-in">
          <GameResult
            game={gameMeta}
            score={parseFloat((timeElapsed / 1000).toFixed(2))}
            isNewBest={isNewBest}
            bestScore={bestTime}
            onRestart={initGame}
            message={`🔢 1→20 in lightning time!`}
          />
          </div>
        )}
      </div>
      
      {/* Add custom shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out;
        }
      `}</style>
    </GameLayout>
  )
}
