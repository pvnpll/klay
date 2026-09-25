import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { getFromStorage, saveToStorage } from '../../lib/storage'
import { SENTENCES } from '../../data/sentences'
import { RotateCcw } from 'lucide-react'

type GameState = 'ready' | 'playing' | 'completed'

export default function Typing() {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [targetSentence, setTargetSentence] = useState<string>('')
  const [userInput, setUserInput] = useState<string>('')
  
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [timeElapsed, setTimeElapsed] = useState(0)
  
  const [bestWpm, setBestWpm] = useState<number | null>(
    getFromStorage<number | null>('klay_typing_best', null)
  )

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
    
    if (!bestWpm || finalWpm > bestWpm) {
      setBestWpm(finalWpm)
      saveToStorage('klay_typing_best', finalWpm)
    }
  }

  // Render sentence with colors
  const renderSentence = () => {
    return targetSentence.split('').map((char, index) => {
      let color = 'text-gray-500'
      if (index < userInput.length) {
        color = userInput[index] === char ? 'text-white bg-emerald-500/20' : 'text-red-400 bg-red-500/20'
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
    <GameLayout title="Typing Race">
      <div className="flex flex-col items-center max-w-3xl mx-auto">
        <div className="flex justify-between w-full mb-8 text-gray-400 font-medium bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
          <div className="text-center flex-1 border-r border-gray-800">
            <p className="text-sm uppercase tracking-wider mb-1">Time</p>
            <p className="text-2xl text-white tabular-nums">{formatTime(timeElapsed)}s</p>
          </div>
          <div className="text-center flex-1 border-r border-gray-800">
            <p className="text-sm uppercase tracking-wider mb-1">Accuracy</p>
            <p className="text-2xl text-white tabular-nums">{accuracy}%</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-sm uppercase tracking-wider mb-1">Best WPM</p>
            <p className="text-2xl text-indigo-400 tabular-nums">{bestWpm || '—'}</p>
          </div>
        </div>

        {gameState === 'completed' ? (
          <div className="w-full bg-indigo-500/20 border-2 border-indigo-500 rounded-3xl p-12 text-center flex flex-col items-center justify-center mb-8 animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl font-black text-indigo-400 mb-6">FINISHED!</h2>
            
            <div className="grid grid-cols-3 gap-6 w-full max-w-md mb-8">
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">WPM</p>
                <p className="text-3xl text-white font-bold">{wpm}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Accuracy</p>
                <p className="text-3xl text-white font-bold">{accuracy}%</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Time</p>
                <p className="text-3xl text-white font-bold">{formatTime(timeElapsed)}s</p>
              </div>
            </div>

            {bestWpm === wpm && wpm > 0 && (
              <p className="text-yellow-400 font-bold mb-6 text-xl">New Personal Best!</p>
            )}
            
            <button
              onClick={initGame}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all hover:-translate-y-1"
            >
              <RotateCcw size={24} />
              PLAY AGAIN
            </button>
          </div>
        ) : (
          <div className="w-full">
            <div 
              className="text-2xl sm:text-3xl md:text-4xl leading-relaxed sm:leading-relaxed font-medium mb-8 p-6 bg-gray-800/50 rounded-2xl border border-gray-700 min-h-[160px] flex items-center shadow-inner cursor-text"
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
                className="w-full bg-gray-900 border-2 border-gray-700 focus:border-indigo-500 rounded-xl px-6 py-4 text-xl text-white placeholder-gray-600 focus:outline-none transition-colors shadow-lg"
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
        )}
      </div>
    </GameLayout>
  )
}
