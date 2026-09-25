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
        <div className="flex justify-between w-full mb-6 text-gray-400 font-medium">
          <span className="text-xl">
            Time: <span className="text-white tabular-nums">{formatTime(timeElapsed)}s</span>
          </span>
          <span className="text-xl">
            Best: <span className="text-white tabular-nums">{bestTime ? `${bestTime}s` : '—'}</span>
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 w-full">
          {numbers.map((num) => {
            const isClicked = num < nextExpected
            const isWrong = wrongFeedback === num
            
            let btnClass = "bg-gray-800 hover:bg-gray-700 text-white"
            if (isClicked) {
              btnClass = "bg-emerald-500/20 text-emerald-500/50 cursor-default"
            } else if (isWrong) {
              btnClass = "bg-red-500 text-white animate-shake"
            } else if (gameState === 'playing' || gameState === 'ready') {
              btnClass = "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:-translate-y-1"
            }

            return (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={isClicked}
                className={`aspect-square flex items-center justify-center rounded-xl font-bold text-2xl sm:text-3xl transition-all select-none ${btnClass} focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400`}
              >
                {num}
              </button>
            )
          })}
        </div>
        
        {gameState !== 'completed' && (
          <div className="mt-8 flex justify-center w-full">
            <button
              onClick={initGame}
              className="text-gray-500 hover:text-gray-300 font-medium transition-colors"
            >
              Restart Game
            </button>
          </div>
        )}

        {gameState === 'completed' && (
          <GameResult
            game={gameMeta}
            score={parseFloat((timeElapsed / 1000).toFixed(2))}
            isNewBest={isNewBest}
            bestScore={bestTime}
            onRestart={initGame}
          />
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
