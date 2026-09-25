import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'odd-one-out')!

const PAIRS = [
  ['😀', '😃'], ['😅', '😂'], ['🙂', '🙃'], ['😊', '😇'],
  ['🥰', '😍'], ['😋', '😛'], ['😎', '🤓'], ['🤔', '🤫'],
  ['😐', '😑'], ['😏', '😒'], ['😔', '😟'], ['😠', '😡'],
  ['🍎', '🍅'], ['🍊', '🍑'], ['🍇', '🫐'], ['🥑', '🥝'],
  ['🍔', '🥪'], ['🍟', '🌭'], ['🍕', '🧀'], ['🍦', '🍧'],
  ['⚽', '🏀'], ['🚗', '🚙'], ['📱', '📲'], ['⌚', '⏰'],
  ['🌞', '🌝'], ['🌲', '🌳'], ['🐶', '🐱'], ['🐻', '🐼']
]

export default function OddOneOut() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  
  const [gridSize, setGridSize] = useState(3)
  const [items, setItems] = useState<string[]>([])
  const [oddIndex, setOddIndex] = useState(-1)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef<number | null>(null)

  const generateLevel = (currentScore: number) => {
    // Determine grid size based on score
    let size = 3
    if (currentScore > 3) size = 4
    if (currentScore > 8) size = 5
    if (currentScore > 15) size = 6
    if (currentScore > 25) size = 7
    if (currentScore > 40) size = 8
    
    setGridSize(size)
    
    const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)]
    // 50% chance to swap normal/odd
    const isSwapped = Math.random() > 0.5
    const normalItem = isSwapped ? pair[1] : pair[0]
    const oddItem = isSwapped ? pair[0] : pair[1]
    
    const totalItems = size * size
    const targetIndex = Math.floor(Math.random() * totalItems)
    
    const newItems = Array(totalItems).fill(normalItem)
    newItems[targetIndex] = oddItem
    
    setItems(newItems)
    setOddIndex(targetIndex)
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(30)
    setIsNewBest(false)
    generateLevel(0)
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

  const handleItemClick = (index: number) => {
    if (gameState !== 'playing') return
    
    if (index === oddIndex) {
      // Correct!
      const newScore = score + 1
      setScore(newScore)
      setTimeLeft(t => Math.min(60, t + 2)) // +2s bonus
      generateLevel(newScore)
    } else {
      // Wrong!
      setTimeLeft(t => Math.max(0, t - 3)) // -3s penalty
      // Flash red screen effect could be added here
      const el = document.getElementById('grid-container')
      if (el) {
        el.classList.add('bg-red-500/30')
        setTimeout(() => el.classList.remove('bg-red-500/30'), 200)
      }
    }
  }

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
          id="grid-container"
          className="w-full aspect-square bg-gray-900 border-2 border-white/10 rounded-3xl p-2 sm:p-6 shadow-2xl relative transition-colors duration-200"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm rounded-3xl">
              <button
                onClick={startGame}
                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
              >
                Start Game
              </button>
            </div>
          )}

          <div 
            className="w-full h-full grid gap-1 sm:gap-2"
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
          >
            {items.map((item, i) => {
              // Dynamically scale font size based on grid size
              let textClass = 'text-4xl sm:text-6xl'
              if (gridSize >= 5) textClass = 'text-3xl sm:text-5xl'
              if (gridSize >= 7) textClass = 'text-2xl sm:text-4xl'
              
              return (
                <button
                  key={i}
                  onClick={() => handleItemClick(i)}
                  disabled={gameState !== 'playing'}
                  className={`flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-lg sm:rounded-xl shadow-sm active:scale-95 transition-transform touch-manipulation ${textClass}`}
                >
                  {item}
                </button>
              )
            })}
          </div>
          
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-red-500/20 z-10 animate-in fade-in rounded-3xl pointer-events-none" />
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
