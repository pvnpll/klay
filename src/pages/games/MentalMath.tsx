import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'mental-math')!

export default function MentalMath() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  
  const [equation, setEquation] = useState({ q: '', a: 0 })
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)

  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef<number | null>(null)

  const generateEquation = () => {
    // Difficulty scales slightly with score
    const maxNum = Math.min(10 + Math.floor(score / 5) * 5, 50)
    
    const ops = ['+', '-', '*']
    const op = ops[Math.floor(Math.random() * ops.length)]
    
    let n1, n2, a
    
    if (op === '+') {
      n1 = Math.floor(Math.random() * maxNum) + 1
      n2 = Math.floor(Math.random() * maxNum) + 1
      a = n1 + n2
    } else if (op === '-') {
      n1 = Math.floor(Math.random() * maxNum) + 10
      n2 = Math.floor(Math.random() * n1)
      a = n1 - n2
    } else {
      // Keep multiplication simpler
      const multMax = Math.min(12, 5 + Math.floor(score / 10))
      n1 = Math.floor(Math.random() * multMax) + 2
      n2 = Math.floor(Math.random() * multMax) + 2
      a = n1 * n2
    }
    
    setEquation({ q: `${n1} ${op} ${n2} = `, a })
    setInput('')
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(30)
    setIsNewBest(false)
    setInput('')
    generateEquation()
  }

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!)
            handleGameOver(score)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState, score])

  const handleGameOver = (finalScore: number) => {
    setGameState('gameover')
    const { isNewBest, bestScore: newBest } = saveScore(gameMeta, finalScore)
    setIsNewBest(isNewBest)
    setBestScore(newBest)
  }

  const triggerFlash = (type: 'correct' | 'wrong') => {
    setFlash(type)
    setTimeout(() => setFlash(null), 200)
  }

  const submitAnswer = () => {
    if (gameState !== 'playing' || input === '') return
    
    const parsed = parseInt(input)
    if (parsed === equation.a) {
      setScore(s => s + 1)
      setTimeLeft(t => Math.min(60, t + 2)) // +2 seconds for correct
      triggerFlash('correct')
      generateEquation()
    } else {
      setTimeLeft(t => Math.max(0, t - 3)) // -3 seconds for wrong
      triggerFlash('wrong')
      setInput('')
    }
  }

  const handleKeyClick = (key: string) => {
    if (gameState !== 'playing') return
    if (key === 'ENTER') {
      submitAnswer()
    } else if (key === 'BACKSPACE') {
      setInput(prev => prev.slice(0, -1))
    } else if (input.length < 4) {
      setInput(prev => prev + key)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      if (e.key >= '0' && e.key <= '9') handleKeyClick(e.key)
      if (e.key === 'Backspace') handleKeyClick('BACKSPACE')
      if (e.key === 'Enter') handleKeyClick('ENTER')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, input])

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-md mx-auto relative">
        
        <div className="flex justify-between w-full mb-4 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Score: <span className="text-white">{score}</span></span>
          <span className={`text-xl ${timeLeft <= 5 ? 'text-red-500 animate-pulse font-bold' : ''}`}>
            Time: <span className="text-white tabular-nums">{timeLeft}s</span>
          </span>
        </div>

        <div className={`w-full bg-gray-900 border-2 rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-2xl transition-colors duration-150
          ${flash === 'correct' ? 'border-emerald-500 bg-emerald-950/30' : ''}
          ${flash === 'wrong' ? 'border-red-500 bg-red-950/30' : ''}
          ${flash === null ? 'border-white/10' : ''}
        `}>
          
          {gameState === 'idle' && (
            <button
              onClick={startGame}
              className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 w-full"
            >
              Start Timer
            </button>
          )}

          {gameState !== 'idle' && (
            <>
              <div className="text-4xl sm:text-5xl font-black mb-6 text-white text-center w-full min-h-[60px] flex items-center justify-center">
                {gameState === 'playing' ? (
                  <span>
                    {equation.q}
                    <span className="text-amber-400 border-b-4 border-amber-400/50 pb-1 ml-2 min-w-[60px] inline-block text-center">
                      {input}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-500">Time's Up!</span>
                )}
              </div>

              {/* Virtual Numpad */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[280px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleKeyClick(num.toString())}
                    disabled={gameState !== 'playing'}
                    className="bg-gray-800 hover:bg-gray-700 text-white h-14 sm:h-16 rounded-xl font-bold text-2xl active:scale-95 transition-transform disabled:opacity-50 touch-manipulation"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => handleKeyClick('BACKSPACE')}
                  disabled={gameState !== 'playing'}
                  className="bg-gray-800 hover:bg-gray-700 text-rose-400 h-14 sm:h-16 rounded-xl font-bold text-xl active:scale-95 transition-transform disabled:opacity-50 touch-manipulation"
                >
                  ⌫
                </button>
                <button
                  onClick={() => handleKeyClick('0')}
                  disabled={gameState !== 'playing'}
                  className="bg-gray-800 hover:bg-gray-700 text-white h-14 sm:h-16 rounded-xl font-bold text-2xl active:scale-95 transition-transform disabled:opacity-50 touch-manipulation"
                >
                  0
                </button>
                <button
                  onClick={() => handleKeyClick('ENTER')}
                  disabled={gameState !== 'playing'}
                  className="bg-amber-600 hover:bg-amber-500 text-white h-14 sm:h-16 rounded-xl font-bold text-xl active:scale-95 transition-transform disabled:opacity-50 touch-manipulation"
                >
                  Enter
                </button>
              </div>
            </>
          )}

        </div>

        {gameState === 'gameover' && (
          <div className="mt-8 w-full animate-in slide-in-from-bottom-4">
            <GameResult
              game={gameMeta}
              score={score}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={startGame}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
