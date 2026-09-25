import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'stroop-test')!

const COLORS = [
  { name: 'RED', class: 'text-red-500' },
  { name: 'BLUE', class: 'text-blue-500' },
  { name: 'GREEN', class: 'text-emerald-500' },
  { name: 'YELLOW', class: 'text-amber-400' },
  { name: 'PURPLE', class: 'text-purple-500' }
]

export default function StroopTest() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds
  
  const [currentWord, setCurrentWord] = useState(COLORS[0])
  const [currentColorClass, setCurrentColorClass] = useState(COLORS[1])
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef<number | null>(null)

  const generateRound = () => {
    const randomWord = COLORS[Math.floor(Math.random() * COLORS.length)]
    
    // Most of the time it should be mismatched to be hard
    const matchChance = 0.2
    let randomColor
    if (Math.random() < matchChance) {
      randomColor = randomWord
    } else {
      let filtered = COLORS.filter(c => c.name !== randomWord.name)
      randomColor = filtered[Math.floor(Math.random() * filtered.length)]
    }
    
    setCurrentWord(randomWord)
    setCurrentColorClass(randomColor)
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(45)
    setIsNewBest(false)
    generateRound()
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

  const handleColorClick = (colorName: string) => {
    if (gameState !== 'playing') return
    
    // We must match the INK color (currentColorClass)
    if (colorName === currentColorClass.name) {
      setScore(s => s + 1)
      generateRound()
    } else {
      setTimeLeft(t => Math.max(0, t - 3)) // -3s penalty
      const el = document.getElementById('stroop-container')
      if (el) {
        el.classList.add('bg-red-500/30')
        setTimeout(() => el.classList.remove('bg-red-500/30'), 200)
      }
    }
  }

  // Keyboard support for 1-5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      const num = parseInt(e.key)
      if (num >= 1 && num <= COLORS.length) {
        handleColorClick(COLORS[num - 1].name)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, currentColorClass])

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto relative">
        <div className="flex justify-between w-full mb-4 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Score: <span className="text-white">{score}</span></span>
          <span className={`text-xl ${timeLeft <= 5 ? 'text-red-500 animate-pulse font-bold' : ''}`}>
            Time: <span className="text-white tabular-nums">{timeLeft}s</span>
          </span>
        </div>

        <div 
          id="stroop-container"
          className="w-full bg-gray-900 border-2 border-white/10 rounded-3xl p-6 shadow-2xl relative transition-colors duration-200 flex flex-col items-center"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm rounded-3xl">
              <button
                onClick={startGame}
                className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
              >
                Start Game
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] w-full text-center">
            {gameState !== 'idle' && (
              <>
                <h2 className="text-gray-400 text-lg sm:text-xl mb-4 font-bold uppercase tracking-wider">
                  Select the INK color
                </h2>
                <div className={`text-6xl sm:text-8xl font-black uppercase tracking-tighter ${currentColorClass.class} drop-shadow-lg`}>
                  {currentWord.name}
                </div>
              </>
            )}
          </div>
          
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-8">
            {COLORS.map((c, i) => (
              <button
                key={c.name}
                onClick={() => handleColorClick(c.name)}
                disabled={gameState !== 'playing'}
                className="bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl text-xl sm:text-2xl font-bold shadow-sm active:scale-95 transition-transform touch-manipulation relative group overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span className="hidden sm:inline text-gray-500 text-sm">{i + 1}</span>
                  {c.name}
                </div>
              </button>
            ))}
          </div>
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
