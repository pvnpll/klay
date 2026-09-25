import { useState, useRef, useEffect } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'reaction')!
type GameState = 'ready' | 'waiting' | 'go' | 'false_start' | 'result' | 'round_result'

const TOTAL_ROUNDS = 5

export default function Reaction() {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [roundScores, setRoundScores] = useState<number[]>([])
  
  const [bestTime, setBestTime] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const timeoutRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const startNextRound = (isFirst: boolean = false) => {
    if (isFirst) {
      setRoundScores([])
      setIsNewBest(false)
    }
    
    setGameState('waiting')
    setReactionTime(null)

    const delay = Math.floor(Math.random() * 3500) + 1500

    timeoutRef.current = window.setTimeout(() => {
      setGameState('go')
      startTimeRef.current = performance.now()
    }, delay)
  }

  const handleClick = () => {
    if (gameState === 'ready') {
      startNextRound(true)
      return
    }

    if (gameState === 'false_start' || gameState === 'round_result') {
      startNextRound()
      return
    }
    
    if (gameState === 'result') {
      startNextRound(true)
      return
    }

    if (gameState === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setGameState('false_start')
      return
    }

    if (gameState === 'go') {
      const time = Math.round(performance.now() - startTimeRef.current)
      setReactionTime(time)
      
      const newScores = [...roundScores, time]
      setRoundScores(newScores)
      
      if (newScores.length >= TOTAL_ROUNDS) {
        setGameState('result')
        const avg = Math.round(newScores.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS)
        const { isNewBest, bestScore } = saveScore(gameMeta, avg)
        setIsNewBest(isNewBest)
        setBestTime(bestScore)
      } else {
        setGameState('round_result')
      }
    }
  }

  let bgColor = 'bg-gray-800 hover:bg-gray-700'
  let message = 'Click to start'
  let subMessage = '5 rounds'

  if (gameState === 'waiting') {
    bgColor = 'bg-red-500 hover:bg-red-600'
    message = 'Wait for green...'
    subMessage = ''
  } else if (gameState === 'go') {
    bgColor = 'bg-emerald-500 hover:bg-emerald-600'
    message = 'CLICK!'
    subMessage = ''
  } else if (gameState === 'false_start') {
    bgColor = 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
    message = 'False Start!'
    subMessage = 'You clicked too early. Click to try again.'
  } else if (gameState === 'round_result') {
    bgColor = 'bg-blue-500 hover:bg-blue-600'
    message = `${reactionTime} ms`
    subMessage = 'Click to continue'
  } else if (gameState === 'result') {
    bgColor = 'bg-blue-500 hover:bg-blue-600'
    const avg = Math.round(roundScores.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS)
    message = `Average: ${avg} ms`
    subMessage = ''
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center relative w-full max-w-2xl mx-auto">
        <div className="w-full flex justify-between mb-4 text-gray-400 font-medium px-4">
          <span className="text-xl">
            Round: <span className="text-white">{Math.min(roundScores.length + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</span>
          </span>
          <span className="text-xl">
            Best Avg: <span className="text-white">{bestTime ? `${bestTime}ms` : '—'}</span>
          </span>
        </div>

        <div 
          onMouseDown={handleClick}
          className={`w-full h-80 sm:h-96 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all select-none ${bgColor} border-2 border-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500 shadow-2xl touch-manipulation`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              handleClick()
            }
          }}
          role="button"
          aria-label={message}
        >
          <span className={`text-4xl sm:text-5xl md:text-7xl font-black mb-4 text-center px-4 ${gameState === 'false_start' ? 'text-gray-900' : 'text-white'}`}>
            {message}
          </span>
          {subMessage && (
            <span className={`text-lg sm:text-xl font-bold text-center px-4 ${gameState === 'false_start' ? 'text-gray-800' : 'text-white/80'}`}>
              {subMessage}
            </span>
          )}
        </div>

        {gameState === 'result' && (
          <GameResult
            game={gameMeta}
            score={Math.round(roundScores.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS)}
            isNewBest={isNewBest}
            bestScore={bestTime}
            onRestart={() => startNextRound(true)}
          />
        )}
      </div>
    </GameLayout>
  )
}
