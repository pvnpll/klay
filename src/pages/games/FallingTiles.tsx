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
    requestRef.current = requestAnimationFrame(update)
  }

  const update = useCallback((time: number) => {
    if (gameState !== 'playing') return
    
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
        const { isNewBest, bestScore: newBest } = saveScore(gameMeta, score)
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
  }, [gameState, score])

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, update])

  const handleTileClick = (id: number) => {
    if (gameState !== 'playing') return
    
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
      const { isNewBest, bestScore: newBest } = saveScore(gameMeta, score)
      setIsNewBest(isNewBest)
      setBestScore(newBest)
      return
    }
    
    // Valid click
    tilesRef.current[tileIndex].clicked = true
    setScore(s => s + 1)
  }
  
  const handleMissClick = () => {
    if (gameState !== 'playing') return
    // Clicking empty space = game over
    setGameState('gameover')
    const { isNewBest, bestScore: newBest } = saveScore(gameMeta, score)
    setIsNewBest(isNewBest)
    setBestScore(newBest)
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-md mx-auto">
        <div className="flex justify-between w-full mb-4 px-4 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <span className="text-xl">Score: <span className="text-white">{score}</span></span>
          <span className="text-xl">Best: <span className="text-white">{bestScore || 0}</span></span>
        </div>

        <div 
          ref={containerRef}
          onMouseDown={handleMissClick}
          onTouchStart={handleMissClick}
          className="relative bg-gray-100 border-4 border-gray-900 rounded-xl overflow-hidden w-full aspect-[3/4] shadow-2xl cursor-pointer touch-none select-none"
        >
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
              <button
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95"
              >
                Start Game
              </button>
            </div>
          )}

          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none opacity-20">
            <div className="border-r border-black" />
            <div className="border-r border-black" />
            <div className="border-r border-black" />
            <div />
          </div>

          {/* Tiles */}
          {tiles.map((tile) => (
            <div
              key={tile.id}
              onMouseDown={(e) => { e.stopPropagation(); handleTileClick(tile.id) }}
              onTouchStart={(e) => { e.stopPropagation(); handleTileClick(tile.id) }}
              className={`absolute w-1/4 h-[25%] transition-colors duration-100 ${
                tile.clicked ? 'bg-gray-400 opacity-50' : 'bg-black hover:bg-gray-800 shadow-md'
              }`}
              style={{
                left: `${tile.col * 25}%`,
                top: `${tile.y}%`,
              }}
            />
          ))}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-red-500/20 z-10 animate-in fade-in" />
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
