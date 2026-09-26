import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'sequence')!

type Level = {
  sequence: number[]
  options: number[]
  answer: number
}

export default function Sequence() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds
  
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef<number | null>(null)

  const generateSequence = (score: number): Level => {
    // 0-4: simple addition
    // 5-9: subtraction
    // 10-14: multiplication
    // 15+: mixed / complex
    
    let type = Math.floor(Math.random() * 4)
    if (score < 5) type = 0
    else if (score < 10) type = Math.random() > 0.5 ? 0 : 1
    else if (score < 15) type = Math.random() > 0.3 ? 2 : Math.floor(Math.random() * 2)
    
    const seq = []
    let next = 0
    
    if (type === 0) {
      // Addition (e.g. 2, 4, 6, 8)
      const start = Math.floor(Math.random() * 20) + 1
      const step = Math.floor(Math.random() * (score + 2)) + 1
      for (let i = 0; i < 4; i++) seq.push(start + i * step)
      next = start + 4 * step
    } else if (type === 1) {
      // Subtraction (e.g. 20, 18, 16, 14)
      const step = Math.floor(Math.random() * (score + 2)) + 1
      const start = Math.floor(Math.random() * 50) + 20 + 4 * step
      for (let i = 0; i < 4; i++) seq.push(start - i * step)
      next = start - 4 * step
    } else if (type === 2) {
      // Multiplication (e.g. 2, 4, 8, 16)
      const start = Math.floor(Math.random() * 5) + 1
      const mult = Math.floor(Math.random() * 3) + 2 // 2, 3, or 4
      for (let i = 0; i < 4; i++) seq.push(start * Math.pow(mult, i))
      next = start * Math.pow(mult, 4)
    } else {
      // Alternate addition (e.g. +2, +3, +4...)
      const start = Math.floor(Math.random() * 10) + 1
      let current = start
      seq.push(current)
      let stepStart = Math.floor(Math.random() * 5) + 1
      for (let i = 0; i < 3; i++) {
        current += (stepStart + i)
        seq.push(current)
      }
      next = current + (stepStart + 3)
    }

    // Generate options
    const options = [next]
    while (options.length < 4) {
      // Fake options close to answer
      const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1)
      const fake = next + offset
      if (!options.includes(fake) && fake >= 0) {
        options.push(fake)
      }
    }
    
    return {
      sequence: seq,
      answer: next,
      options: options.sort(() => Math.random() - 0.5)
    }
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(60)
    setIsNewBest(false)
    setCurrentLevel(generateSequence(0))
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

  const handleOptionClick = (val: number) => {
    if (gameState !== 'playing' || !currentLevel) return
    
    if (val === currentLevel.answer) {
      const newScore = score + 1
      setScore(newScore)
      setCurrentLevel(generateSequence(newScore))
    } else {
      setTimeLeft(t => Math.max(0, t - 5)) // -5s penalty
      const el = document.getElementById('seq-container')
      if (el) {
        el.classList.add('bg-red-500/30')
        setTimeout(() => el.classList.remove('bg-red-500/30'), 200)
      }
    }
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto relative">
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-blue-500/20 to-cyan-500/10 py-3 rounded-2xl border border-blue-400/20 shadow-inner">
          <span className="text-blue-200">⭐ SCORE <span className="text-white text-2xl ml-1 tabular-nums">{score}</span></span>
          <span className={`${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>⏳ TIME <span className="text-white text-2xl ml-1 tabular-nums">{timeLeft}s</span></span>
        </div>

        <div 
          id="seq-container"
          className="w-full bg-gradient-to-b from-blue-500/15 to-indigo-600/5 border-2 border-blue-400/20 rounded-3xl p-6 sm:p-12 shadow-[0_0_50px_rgba(59,130,246,0.2)] relative transition-colors duration-200"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-20 backdrop-blur-sm rounded-3xl p-6 text-center">
              <p className="text-5xl animate-float">🔢</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:brightness-110 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                🔢 Play Sequences
              </button>
              <p className="text-blue-200/70 text-sm font-bold">Crack the pattern. What comes next?</p>
            </div>
          )}

          <div className="flex flex-col items-center justify-center min-h-[250px]">
            {currentLevel && gameState !== 'idle' && (
              <>
                <h2 className="text-blue-200 text-sm mb-8 uppercase tracking-[0.25em] font-black">🤔 What comes next?</h2>
                
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12">
                  {currentLevel.sequence.map((num, i) => (
                    <div key={i} className="text-4xl sm:text-5xl font-black text-white tabular-nums">
                      {num}<span className="text-blue-300/40">,</span>
                    </div>
                  ))}
                  <div className="text-4xl sm:text-5xl font-black text-amber-300 border-b-4 border-amber-300 pb-1 animate-pulse">
                    ?
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  {currentLevel.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOptionClick(opt)}
                      className="bg-gradient-to-b from-indigo-500 to-indigo-700 hover:brightness-110 text-white py-6 rounded-2xl text-3xl font-black shadow-lg active:scale-95 transition-transform tabular-nums touch-manipulation border border-white/20"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
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
              message={`🔢 ${score} patterns cracked!`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
