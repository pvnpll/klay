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
        
        <div className="flex justify-between w-full mb-3 px-5 text-sm font-black bg-gradient-to-r from-purple-500/20 to-fuchsia-500/10 py-3 rounded-2xl border border-purple-400/20 shadow-inner">
          <span className="text-purple-200">🧠 LEVEL <span className="text-white text-xl ml-1 tabular-nums">{score + 1}</span></span>
          <span className="text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestScore || 0}</span></span>
        </div>

        <div className="h-10 mb-2 flex items-center justify-center">
          {gameState === 'showing' && (
            <div className="text-amber-300 font-black text-lg animate-pulse">👀 Memorize the glow!</div>
          )}
          {gameState === 'playing' && (
            <div className="text-cyan-300 font-black text-lg">👆 Now tap them!</div>
          )}
          {message && (
            <div className="text-emerald-300 font-black text-xl animate-pop-in">
              {message}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-b from-purple-500/15 to-indigo-500/5 border border-purple-400/20 p-3 sm:p-4 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.25)] w-full aspect-square flex flex-col relative touch-none select-none">
          {gameState === 'idle' && score === 0 && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-20 backdrop-blur-sm rounded-3xl p-6 text-center">
              <p className="text-5xl animate-float">🧠</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-purple-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                🧠 Test Memory
              </button>
              <p className="text-purple-200/70 text-sm font-bold">Watch, remember, repeat!</p>
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
              
              let tileClass = 'bg-white/5 border-white/10'
              
              if (gameState === 'showing' && isActive) {
                tileClass = 'bg-gradient-to-br from-amber-200 to-yellow-400 border-white/60 shadow-[0_0_25px_rgba(251,191,36,0.8)] scale-105'
              } else if (gameState === 'playing' && isClicked) {
                tileClass = 'bg-emerald-400 border-emerald-200 scale-95 shadow-[0_0_15px_rgba(52,211,153,0.6)]'
              } else if (gameState === 'playing') {
                tileClass = 'bg-white/5 border-white/10 hover:bg-white/15 hover:scale-[1.03] active:scale-95'
              } else if (gameState === 'gameover') {
                if (isActive && !isClicked) tileClass = 'bg-emerald-500/40 border-emerald-300/40' // missed
                if (isActive && isClicked) tileClass = 'bg-emerald-400 border-emerald-200' // got it
                if (!isActive && isClicked) tileClass = 'bg-red-500 border-red-300' // wrong click
              }

              return (
                <div
                  key={i}
                  onMouseDown={() => handleTileClick(i)}
                  onTouchStart={(e) => { e.preventDefault(); handleTileClick(i); }}
                  className={`rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-center text-xl ${tileClass}`}
                >
                  {(gameState === 'showing' && isActive) ? '✨' : (isClicked ? '✅' : '')}
                </div>
              )
            })}
          </div>
          
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-red-500/10 z-10 rounded-3xl pointer-events-none" />
          )}
        </div>

        {gameState === 'gameover' && (
          <div className="mt-6 w-full animate-pop-in">
            <GameResult
              game={gameMeta}
              score={score}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={startGame}
              message={`🧠 You reached Level ${score + 1}`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
