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
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-rose-500/20 to-orange-500/10 py-3 rounded-2xl border border-rose-400/20 shadow-inner">
          <span className="text-rose-200">⭐ SCORE <span className="text-white text-2xl ml-1 tabular-nums">{score}</span></span>
          <span className={`${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>⏳ TIME <span className="text-white text-2xl ml-1 tabular-nums">{timeLeft}s</span></span>
        </div>

        <div 
          id="stroop-container"
          className="w-full bg-gradient-to-b from-rose-500/15 to-purple-600/5 border-2 border-rose-400/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(244,63,94,0.2)] relative transition-colors duration-200 flex flex-col items-center"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-20 backdrop-blur-sm rounded-3xl p-6 text-center">
              <p className="text-5xl animate-float">🎨</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-rose-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                🎨 Test Your Brain
              </button>
              <p className="text-rose-200/70 text-sm font-bold">Say the INK color, not the word! Tricky 😵‍💫</p>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] w-full text-center">
            {gameState !== 'idle' && (
              <>
                <h2 className="text-rose-200 text-sm sm:text-base mb-4 font-black uppercase tracking-[0.2em]">
                  🎯 Tap the INK color
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
                className="bg-gradient-to-b from-slate-600 to-slate-800 hover:brightness-125 text-white py-4 rounded-2xl text-xl sm:text-2xl font-black shadow-lg active:scale-95 transition-transform touch-manipulation relative group overflow-hidden border border-white/20"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span className="hidden sm:inline text-white/50 text-sm">{i + 1}</span>
                  {c.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {gameState === 'gameover' && (
          <div className="mt-6 w-full animate-pop-in">
            <GameResult
              game={gameMeta}
              score={score}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={startGame}
              message={`🎨 ${score} correct inks!`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
