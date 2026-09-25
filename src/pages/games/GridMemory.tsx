import { useState } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'grid-memory')!

export default function GridMemory() {
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  
  const [gridSize, setGridSize] = useState(3)
  const [activeTiles, setActiveTiles] = useState<number[]>([])
  const [clickedTiles, setClickedTiles] = useState<number[]>([])
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)
  const [message, setMessage] = useState('')

  const startGame = () => {
    setScore(0)
    setIsNewBest(false)
    setMessage('')
    startLevel(3, 1)
  }

  const startLevel = (size: number, currentScore: number) => {
    setGridSize(size)
    setClickedTiles([])
    setGameState('showing')
    
    // Number of tiles to remember increases with score
    const numTiles = Math.min(Math.floor(currentScore / 2) + 3, Math.floor((size * size) / 2))
    
    const newTiles: number[] = []
    while (newTiles.length < numTiles) {
      const r = Math.floor(Math.random() * (size * size))
      if (!newTiles.includes(r)) {
        newTiles.push(r)
      }
    }
    setActiveTiles(newTiles)
    
    // Show tiles for a bit, then hide
    const showDuration = Math.max(800, 2000 - currentScore * 100)
    
    setTimeout(() => {
      setGameState('playing')
    }, showDuration)
  }

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return
    if (clickedTiles.includes(index)) return // already clicked
    
    const newClicked = [...clickedTiles, index]
    
    // Did they click a correct tile?
    if (activeTiles.includes(index)) {
      setClickedTiles(newClicked)
      
      // If they found all of them
      if (newClicked.length === activeTiles.length) {
        setGameState('idle') // brief pause
        setMessage('Correct!')
        const newScore = score + 1
        setScore(newScore)
        
        // Increase grid size occasionally
        let nextSize = gridSize
        if (newScore === 3) nextSize = 4
        if (newScore === 8) nextSize = 5
        if (newScore === 15) nextSize = 6
        
        setTimeout(() => {
          setMessage('')
          startLevel(nextSize, newScore + 1)
        }, 1000)
      }
    } else {
      // Wrong tile!
      setGameState('gameover')
      const { isNewBest, bestScore: newBest } = saveScore(gameMeta, score)
      setIsNewBest(isNewBest)
      setBestScore(newBest)
    }
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-md mx-auto relative">
        
        <div className="flex justify-between w-full mb-4 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Level: <span className="text-white">{score + 1}</span></span>
          <span className="text-xl">Best: <span className="text-white">{bestScore || 0}</span></span>
        </div>

        <div className="h-8 mb-2 flex items-center justify-center">
          {message && (
            <div className="text-emerald-400 font-bold text-xl animate-in fade-in zoom-in duration-200">
              {message}
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-3 sm:p-4 rounded-2xl shadow-2xl w-full aspect-square flex flex-col relative touch-none select-none">
          {gameState === 'idle' && score === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm rounded-2xl">
              <button
                onClick={startGame}
                className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 animate-in zoom-in"
              >
                Start Game
              </button>
            </div>
          )}

          <div 
            className="w-full h-full grid gap-2 sm:gap-3"
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
          >
            {Array(gridSize * gridSize).fill(null).map((_, i) => {
              const isActive = activeTiles.includes(i)
              const isClicked = clickedTiles.includes(i)
              
              let tileClass = 'bg-gray-700 shadow-md'
              
              if (gameState === 'showing' && isActive) {
                tileClass = 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-105'
              } else if (gameState === 'playing' && isClicked) {
                tileClass = 'bg-white scale-95 opacity-50'
              } else if (gameState === 'gameover') {
                if (isActive && !isClicked) tileClass = 'bg-emerald-500/50' // missed
                if (isActive && isClicked) tileClass = 'bg-white' // got it
                if (!isActive && isClicked) tileClass = 'bg-red-500' // wrong click
              }

              return (
                <div
                  key={i}
                  onMouseDown={() => handleTileClick(i)}
                  onTouchStart={(e) => { e.preventDefault(); handleTileClick(i); }}
                  className={`rounded-xl transition-all duration-200 cursor-pointer ${tileClass} ${gameState === 'playing' ? 'hover:bg-gray-600 active:scale-95' : ''}`}
                />
              )
            })}
          </div>
          
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-red-500/10 z-10 animate-in fade-in rounded-2xl pointer-events-none" />
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
              message={`You reached Level ${score + 1}`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
