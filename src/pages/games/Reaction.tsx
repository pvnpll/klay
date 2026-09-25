import { useState, useRef, useEffect } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { getFromStorage, saveToStorage } from '../../lib/storage'

type GameState = 'ready' | 'waiting' | 'go' | 'false_start' | 'result'

export default function Reaction() {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [bestTime, setBestTime] = useState<number | null>(
    getFromStorage<number | null>('klay_reaction_best', null)
  )

  const timeoutRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleStart = () => {
    setGameState('waiting')
    setReactionTime(null)

    // Random delay between 1500ms and 5000ms
    const delay = Math.floor(Math.random() * 3500) + 1500

    timeoutRef.current = window.setTimeout(() => {
      setGameState('go')
      startTimeRef.current = performance.now()
    }, delay)
  }

  const handleClick = () => {
    if (gameState === 'ready' || gameState === 'result' || gameState === 'false_start') {
      handleStart()
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
      setGameState('result')

      if (!bestTime || time < bestTime) {
        setBestTime(time)
        saveToStorage('klay_reaction_best', time)
      }
    }
  }

  let bgColor = 'bg-gray-800 hover:bg-gray-700'
  let message = 'Click anywhere to start'
  let subMessage = ''

  if (gameState === 'waiting') {
    bgColor = 'bg-red-500 hover:bg-red-600'
    message = 'Wait for green...'
  } else if (gameState === 'go') {
    bgColor = 'bg-emerald-500 hover:bg-emerald-600'
    message = 'CLICK!'
  } else if (gameState === 'false_start') {
    bgColor = 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
    message = 'False Start!'
    subMessage = 'You clicked too early. Click to try again.'
  } else if (gameState === 'result') {
    bgColor = 'bg-blue-500 hover:bg-blue-600'
    message = `${reactionTime} ms`
    subMessage = 'Click to try again'
  }

  return (
    <GameLayout title="Reaction Test">
      <div className="flex flex-col items-center">
        <div 
          onMouseDown={handleClick}
          className={`w-full max-w-2xl h-80 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors select-none ${bgColor} border-2 border-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500`}
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
          <span className={`text-4xl md:text-6xl font-black mb-4 ${gameState === 'false_start' ? 'text-gray-900' : 'text-white'}`}>
            {message}
          </span>
          {subMessage && (
            <span className={`text-xl font-medium ${gameState === 'false_start' ? 'text-gray-800' : 'text-white/80'}`}>
              {subMessage}
            </span>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xl text-gray-400 font-medium">
            Best Time: <span className="text-white">{bestTime ? `${bestTime} ms` : '—'}</span>
          </p>
        </div>
      </div>
    </GameLayout>
  )
}
