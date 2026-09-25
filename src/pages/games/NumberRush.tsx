import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { getFromStorage, saveToStorage } from '../../lib/storage'
import { RotateCcw } from 'lucide-react'

type GameState = 'ready' | 'playing' | 'completed'

export default function NumberRush() {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [numbers, setNumbers] = useState<number[]>([])
  const [nextExpected, setNextExpected] = useState<number>(1)
  const [timeElapsed, setTimeElapsed] = useState<number>(0)
  const [wrongFeedback, setWrongFeedback] = useState<number | null>(null)
  
  const [bestTime, setBestTime] = useState<number | null>(
    getFromStorage<number | null>('klay_number_rush_best', null)
  )

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
        const finalTime = performance.now() - startTimeRef.current
        setTimeElapsed(finalTime)
        
        if (!bestTime || finalTime < bestTime) {
          setBestTime(finalTime)
          saveToStorage('klay_number_rush_best', finalTime)
        }
      } else {
        setNextExpected(num + 1)
      }
    } else if (num > nextExpected) {
      // Wrong number clicked (if they haven't clicked it yet)
      setWrongFeedback(num)
      setTimeout(() => setWrongFeedback(null), 300)
    }
  }

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(2)
  }

  return (
    <GameLayout title="Number Rush">
      <div className="flex flex-col items-center max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-6 text-gray-400 font-medium">
          <span className="text-xl">
            Time: <span className="text-white tabular-nums">{formatTime(timeElapsed)}s</span>
          </span>
          <span className="text-xl">
            Best: <span className="text-white tabular-nums">{bestTime ? formatTime(bestTime) + 's' : '—'}</span>
          </span>
        </div>

        {gameState === 'completed' ? (
          <div className="w-full bg-emerald-500/20 border-2 border-emerald-500 rounded-3xl p-12 text-center flex flex-col items-center justify-center mb-8">
            <h2 className="text-4xl font-black text-emerald-400 mb-4">COMPLETE!</h2>
            <p className="text-2xl text-white mb-2">Time: {formatTime(timeElapsed)} seconds</p>
            {bestTime === timeElapsed && (
              <p className="text-yellow-400 font-bold mb-8">New Best Time!</p>
            )}
            <button
              onClick={initGame}
              className="mt-6 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all hover:-translate-y-1"
            >
              <RotateCcw size={24} />
              PLAY AGAIN
            </button>
          </div>
        ) : (
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
        )}
        
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
