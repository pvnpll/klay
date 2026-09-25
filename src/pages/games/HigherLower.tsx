import { useState, useEffect } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { getFromStorage, saveToStorage } from '../../lib/storage'
import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'

type GameState = 'playing' | 'gameover'

export default function HigherLower() {
  const [gameState, setGameState] = useState<GameState>('playing')
  const [currentNumber, setCurrentNumber] = useState<number>(0)
  const [score, setScore] = useState<number>(0)
  const [bestScore, setBestScore] = useState<number>(
    getFromStorage<number>('klay_higher_lower_best', 0)
  )

  useEffect(() => {
    startNewGame()
  }, [])

  const generateNumber = (exclude?: number): number => {
    let num = Math.floor(Math.random() * 100) + 1
    while (num === exclude) {
      num = Math.floor(Math.random() * 100) + 1
    }
    return num
  }

  const startNewGame = () => {
    setCurrentNumber(generateNumber())
    setScore(0)
    setGameState('playing')
  }

  const handleGuess = (guess: 'higher' | 'lower') => {
    if (gameState !== 'playing') return

    const nextNumber = generateNumber(currentNumber)
    const isHigher = nextNumber > currentNumber

    if ((guess === 'higher' && isHigher) || (guess === 'lower' && !isHigher)) {
      // Correct
      const newScore = score + 1
      setScore(newScore)
      setCurrentNumber(nextNumber)
      
      if (newScore > bestScore) {
        setBestScore(newScore)
        saveToStorage('klay_higher_lower_best', newScore)
      }
    } else {
      // Incorrect
      setCurrentNumber(nextNumber)
      setGameState('gameover')
    }
  }

  return (
    <GameLayout title="Higher or Lower">
      <div className="flex flex-col items-center max-w-md mx-auto">
        <div className="flex justify-between w-full mb-8 text-gray-400 font-medium">
          <span className="text-xl">Score: <span className="text-white">{score}</span></span>
          <span className="text-xl">Best: <span className="text-white">{bestScore}</span></span>
        </div>

        <div className="bg-gray-800 rounded-3xl w-full aspect-square flex flex-col items-center justify-center border-4 border-gray-700 shadow-xl mb-8 relative overflow-hidden">
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center backdrop-blur-sm z-10">
              <span className="text-3xl font-black text-red-400 mb-2">INCORRECT</span>
              <span className="text-white font-medium text-lg">Final Score: {score}</span>
            </div>
          )}
          
          <span className="text-8xl md:text-9xl font-black text-white drop-shadow-md">
            {currentNumber || '?'}
          </span>
        </div>

        {gameState === 'playing' ? (
          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => handleGuess('higher')}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-xl transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
            >
              <ArrowUp size={24} />
              HIGHER
            </button>
            <button
              onClick={() => handleGuess('lower')}
              className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-xl font-bold text-xl transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-400"
            >
              LOWER
              <ArrowDown size={24} />
            </button>
          </div>
        ) : (
          <button
            onClick={startNewGame}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-4 px-8 rounded-xl font-bold text-xl transition-all w-full hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
          >
            <RotateCcw size={24} />
            PLAY AGAIN
          </button>
        )}
      </div>
    </GameLayout>
  )
}
