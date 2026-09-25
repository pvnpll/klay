import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import { SENTENCES } from '../../data/sentences'

const gameMeta = GAMES.find(g => g.id === 'typing')!
type GameState = 'ready' | 'playing' | 'completed'

export default function Typing() {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [targetSentence, setTargetSentence] = useState<string>('')
  const [userInput, setUserInput] = useState<string>('')
  
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [timeElapsed, setTimeElapsed] = useState(0)
  
  const [bestWpm, setBestWpm] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initGame()
    return () => stopTimer()
  }, [])

  const initGame = () => {
    stopTimer()
    const randomSentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)]
    setTargetSentence(randomSentence)
    setUserInput('')
    setWpm(0)
    setAccuracy(100)
    setTimeElapsed(0)
    setGameState('ready')
    setIsNewBest(false)
    
    // Focus input after a short delay
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus()
    }, 100)
  }

  const startTimer = () => {
    startTimeRef.current = performance.now()
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(performance.now() - startTimeRef.current)
    }, 100)
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState === 'completed') return
    
    const val = e.target.value
    
    if (gameState === 'ready' && val.length === 1) {
      setGameState('playing')
      startTimer()
    }
    
    setUserInput(val)

    // Calculate accuracy
    let correctChars = 0
    for (let i = 0; i < val.length; i++) {
      if (val[i] === targetSentence[i]) {
        correctChars++
      }
    }
    const currentAccuracy = val.length === 0 ? 100 : Math.round((correctChars / val.length) * 100)
    setAccuracy(currentAccuracy)

    // Check completion
    if (val === targetSentence) {
      finishGame(val.length)
    }
  }

  const finishGame = (totalChars: number) => {
    stopTimer()
    setGameState('completed')
    
    const finalTimeMs = performance.now() - startTimeRef.current
    setTimeElapsed(finalTimeMs)
    
    // WPM calculation: (characters / 5) / (time in minutes)
    const timeInMinutes = finalTimeMs / 60000
    const words = totalChars / 5
    const finalWpm = Math.round(words / timeInMinutes)
    
    setWpm(finalWpm)
    
    const { isNewBest, bestScore } = saveScore(gameMeta, finalWpm)
    setIsNewBest(isNewBest)
    setBestWpm(bestScore)
  }

  // Render sentence with colors
  const renderSentence = () => {
    return targetSentence.split('').map((char, index) => {
      let color = 'text-gray-500'
      if (index < userInput.length) {
        color = userInput[index] === char ? 'text-white bg-indigo-500/20' : 'text-red-400 bg-red-500/20'
      }
      return (
        <span key={index} className={`transition-colors rounded-sm px-[1px] ${color}`}>
          {char}
        </span>
      )
    })
  }

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1)
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center max-w-3xl mx-auto relative">
        <div className="flex justify-between w-full mb-8 text-gray-400 font-medium bg-gray-950/80 p-4 rounded-xl border border-white/5 shadow-inner">
          <div className="text-center flex-1 border-r border-white/5">
            <p className="text-sm uppercase tracking-wider mb-1">Time</p>
            <p className="text-2xl text-white tabular-nums">{formatTime(timeElapsed)}s</p>
          </div>
          <div className="text-center flex-1 border-r border-white/5">
            <p className="text-sm uppercase tracking-wider mb-1">Accuracy</p>
            <p className="text-2xl text-white tabular-nums">{accuracy}%</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-sm uppercase tracking-wider mb-1">Best WPM</p>
            <p className="text-2xl text-indigo-400 tabular-nums">{bestWpm || '—'}</p>
          </div>
        </div>

        <div className="w-full">
          <div 
            className="text-2xl sm:text-3xl md:text-4xl leading-relaxed sm:leading-relaxed font-medium mb-8 p-6 bg-gray-900/60 rounded-2xl border border-white/10 min-h-[160px] flex items-center shadow-inner cursor-text backdrop-blur-sm"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="w-full break-words">
              {renderSentence()}
            </div>
          </div>

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              disabled={gameState === 'completed'}
              className="w-full bg-gray-900 border-2 border-white/10 focus:border-indigo-500 rounded-xl px-6 py-4 text-xl text-white placeholder-gray-600 focus:outline-none transition-colors shadow-lg"
              placeholder="Type the text above..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {gameState === 'ready' && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 animate-pulse">
                Start typing to begin
              </div>
            )}
          </div>
        </div>

        {gameState === 'completed' && (
          <GameResult
            game={gameMeta}
            score={wpm}
            isNewBest={isNewBest}
            bestScore={bestWpm}
            onRestart={initGame}
            message={`Accuracy: ${accuracy}%`}
          />
        )}
      </div>
    </GameLayout>
  )
}
