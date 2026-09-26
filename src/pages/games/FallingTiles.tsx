import { useState, useRef, useEffect, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'

const gameMeta = GAMES.find(g => g.id === 'falling-tiles')!

type Tile = {
  id: number
  col: number
  y: number // percentage 0-100 (100 is bottom)
  clicked: boolean
}

export default function FallingTiles() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  
  const [bestScore, setBestScore] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const [tiles, setTiles] = useState<Tile[]>([])
  const tilesRef = useRef<Tile[]>([])
  
  const requestRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const speedRef = useRef(30) // percentage per second
  const tileIdCounter = useRef(0)
  const scoreRef = useRef(0)
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState
  
  const containerRef = useRef<HTMLDivElement>(null)

  const spawnTile = useCallback((yPos: number) => {
    const col = Math.floor(Math.random() * 4)
    const newTile: Tile = {
      id: tileIdCounter.current++,
      col,
      y: yPos,
      clicked: false
    }
    tilesRef.current = [...tilesRef.current, newTile]
  }, [])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    scoreRef.current = 0
    setIsNewBest(false)
    speedRef.current = 30
    tileIdCounter.current = 0
    
    // Initial tiles
    tilesRef.current = []
    spawnTile(0)
    spawnTile(-25)
    spawnTile(-50)
    spawnTile(-75)
    
    setTiles(tilesRef.current)
    lastTimeRef.current = performance.now()
  }

  const update = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return
    
    if (lastTimeRef.current !== null) {
      const deltaTime = (time - lastTimeRef.current) / 1000
      
      // Speed increases slightly over time
      speedRef.current += deltaTime * 2
      
      let newTiles = tilesRef.current.map(t => ({
        ...t,
        y: t.y + speedRef.current * deltaTime
      }))
      
      // Check for missed tiles
      const missed = newTiles.find(t => !t.clicked && t.y > 100)
      if (missed) {
        setGameState('gameover')
        const { isNewBest, bestScore: newBest } = saveScore(gameMeta, scoreRef.current)
        setIsNewBest(isNewBest)
        setBestScore(newBest)
        return
      }
      
      // Remove clicked tiles that have fallen far offscreen
      newTiles = newTiles.filter(t => t.y < 125)
      
      // Spawn new tiles if the highest tile is far down enough
      const highestTile = newTiles.reduce((min, t) => t.y < min.y ? t : min, newTiles[0])
      if (highestTile && highestTile.y > -25) {
        const col = Math.floor(Math.random() * 4)
        newTiles.push({
          id: tileIdCounter.current++,
          col,
          y: highestTile.y - 30, // Spacing
          clicked: false
        })
      }
      
      tilesRef.current = newTiles
      setTiles(newTiles)
    }
    
    lastTimeRef.current = time
    requestRef.current = requestAnimationFrame(update)
  }, [])

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now()
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  const handleTileClick = (id: number) => {
    if (gameStateRef.current !== 'playing') return
    
    const tileIndex = tilesRef.current.findIndex(t => t.id === id)
    if (tileIndex === -1) return
    const tile = tilesRef.current[tileIndex]
    
    if (tile.clicked) return
    
    // Must click the lowest unclicked tile
    const lowestUnclicked = tilesRef.current
      .filter(t => !t.clicked)
      .reduce((max, t) => t.y > max.y ? t : max, tilesRef.current[0])
      
    if (lowestUnclicked && lowestUnclicked.id !== id) {
      // Clicked wrong tile (out of order)
      setGameState('gameover')
      const { isNewBest, bestScore: newBest } = saveScore(gameMeta, scoreRef.current)
      setIsNewBest(isNewBest)
      setBestScore(newBest)
      return
    }
    
    // Valid click
    tilesRef.current[tileIndex].clicked = true
    scoreRef.current += 1
    setScore(scoreRef.current)
  }
  
  const handleMissClick = () => {
    if (gameStateRef.current !== 'playing') return
    // Clicking empty space = game over
    setGameState('gameover')
    const { isNewBest, bestScore: newBest } = saveScore(gameMeta, scoreRef.current)
    setIsNewBest(isNewBest)
    setBestScore(newBest)
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-md mx-auto">
        <div className="flex justify-between w-full mb-4 px-5 text-sm font-black bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 py-3 rounded-2xl border border-indigo-400/20 shadow-inner">
          <span className="text-indigo-200">🎹 SCORE <span className="text-white text-xl ml-1 tabular-nums">{score}</span></span>
          <span className="text-gray-300">👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestScore || 0}</span></span>
        </div>

        <div 
          ref={containerRef}
          onMouseDown={handleMissClick}
          onTouchStart={handleMissClick}
          className="relative bg-gradient-to-b from-[#1a1440] to-[#0d0b26] border-2 border-indigo-400/25 rounded-3xl overflow-hidden w-full aspect-[3/4] shadow-[0_0_50px_rgba(99,102,241,0.25)] cursor-pointer touch-none select-none"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-3 items-center justify-center z-20 backdrop-blur-sm p-6 text-center">
              <p className="text-5xl animate-float">🎹</p>
              <button
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg shadow-indigo-500/30 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                🎵 Start Tiles
              </button>
              <p className="text-indigo-200/70 text-sm font-bold">Tap the lowest black tile. Don't miss!</p>
            </div>
          )}

          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none opacity-20">
            <div className="border-r border-white/40" />
            <div className="border-r border-white/40" />
            <div className="border-r border-white/40" />
            <div />
          </div>

          {/* Tiles */}
          {tiles.map((tile) => (
            <div
              key={tile.id}
              onMouseDown={(e) => { e.stopPropagation(); handleTileClick(tile.id) }}
              onTouchStart={(e) => { e.stopPropagation(); handleTileClick(tile.id) }}
              className={`absolute w-1/4 h-[25%] rounded-xl border-2 transition-all duration-100 ${
                tile.clicked ? 'bg-white/10 border-white/10 scale-95' : 'bg-gradient-to-b from-gray-900 to-black border-cyan-300/40 hover:border-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.35)] active:scale-95'
              }`}
              style={{
                left: `${tile.col * 25}%`,
                top: `${tile.y}%`,
              }}
            >
              {!tile.clicked && (
                <span className="absolute inset-0 flex items-center justify-center text-2xl">🎶</span>
              )}
            </div>
          ))}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-red-500/20 z-10 pointer-events-none" />
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
              message={`🎹 You tapped ${score} tiles`}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
