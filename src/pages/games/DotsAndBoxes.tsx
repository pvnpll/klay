import { useState, useMemo } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import confetti from 'canvas-confetti'

const gameMeta = GAMES.find(g => g.id === 'dots-and-boxes')!

const GRID_W = 5 // 5 dots = 4 boxes wide
const GRID_H = 5

type Player = 'p1' | 'p2'

type Edge = {
  id: string
  r: number
  c: number
  dir: 'h' | 'v'
  owner: Player | null
}

type Box = {
  r: number
  c: number
  owner: Player | null
}

export default function DotsAndBoxes() {
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing')
  const [currentPlayer, setCurrentPlayer] = useState<Player>('p1')
  const [score, setScore] = useState({ p1: 0, p2: 0 })
  
  // Initial state setup
  const initialEdges: Edge[] = useMemo(() => {
    const arr: Edge[] = []
    // Horizontal edges
    for (let r = 0; r < GRID_H; r++) {
      for (let c = 0; c < GRID_W - 1; c++) {
        arr.push({ id: `h-${r}-${c}`, r, c, dir: 'h', owner: null })
      }
    }
    // Vertical edges
    for (let r = 0; r < GRID_H - 1; r++) {
      for (let c = 0; c < GRID_W; c++) {
        arr.push({ id: `v-${r}-${c}`, r, c, dir: 'v', owner: null })
      }
    }
    return arr
  }, [])

  const initialBoxes: Box[] = useMemo(() => {
    const arr: Box[] = []
    for (let r = 0; r < GRID_H - 1; r++) {
      for (let c = 0; c < GRID_W - 1; c++) {
        arr.push({ r, c, owner: null })
      }
    }
    return arr
  }, [])

  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes)

  const handleEdgeClick = (edgeId: string) => {
    if (gameState !== 'playing') return
    
    const edgeIndex = edges.findIndex(e => e.id === edgeId)
    if (edgeIndex === -1 || edges[edgeIndex].owner !== null) return

    const newEdges = [...edges]
    newEdges[edgeIndex] = { ...newEdges[edgeIndex], owner: currentPlayer }
    
    // Check if any boxes were completed
    let boxesCompleted = 0
    const newBoxes = [...boxes]
    
    for (let i = 0; i < newBoxes.length; i++) {
      if (newBoxes[i].owner === null) {
        const r = newBoxes[i].r
        const c = newBoxes[i].c
        
        // A box is formed by: h(r,c), h(r+1,c), v(r,c), v(r,c+1)
        const top = newEdges.find(e => e.id === `h-${r}-${c}`)?.owner !== null
        const bottom = newEdges.find(e => e.id === `h-${r+1}-${c}`)?.owner !== null
        const left = newEdges.find(e => e.id === `v-${r}-${c}`)?.owner !== null
        const right = newEdges.find(e => e.id === `v-${r}-${c+1}`)?.owner !== null
        
        if (top && bottom && left && right) {
          newBoxes[i] = { ...newBoxes[i], owner: currentPlayer }
          boxesCompleted++
        }
      }
    }

    setEdges(newEdges)
    setBoxes(newBoxes)
    
    if (boxesCompleted > 0) {
      // Player gets to go again, update score
      const newScore = { ...score }
      newScore[currentPlayer] += boxesCompleted
      setScore(newScore)
      
      // Check for game over
      if (newBoxes.every(b => b.owner !== null)) {
        setGameState('gameover')
        if (newScore.p1 > newScore.p2) {
           confetti({ particleCount: 150, spread: 80, colors: ['#f97316', '#ea580c'] })
        } else if (newScore.p2 > newScore.p1) {
           confetti({ particleCount: 150, spread: 80, colors: ['#3b82f6', '#2563eb'] })
        }
      }
    } else {
      // Next player's turn
      setCurrentPlayer(currentPlayer === 'p1' ? 'p2' : 'p1')
    }
  }

  const restart = () => {
    setEdges(initialEdges)
    setBoxes(initialBoxes)
    setScore({ p1: 0, p2: 0 })
    setCurrentPlayer('p1')
    setGameState('playing')
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        
        <div className="flex justify-between items-center w-full mb-6 px-8 text-gray-400 font-medium bg-gray-950/80 py-3 rounded-xl border border-white/5 shadow-inner">
          <div className={`flex flex-col items-center transition-opacity ${currentPlayer === 'p1' && gameState === 'playing' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
            <span className="text-xs uppercase text-orange-500 font-bold mb-1">Player 1</span>
            <span className="text-3xl font-black text-orange-400 tabular-nums">{score.p1}</span>
          </div>
          
          <span className="text-sm font-black text-gray-700">VS</span>
          
          <div className={`flex flex-col items-center transition-opacity ${currentPlayer === 'p2' && gameState === 'playing' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
            <span className="text-xs uppercase text-blue-400 font-bold mb-1">Player 2</span>
            <span className="text-3xl font-black text-blue-400 tabular-nums">{score.p2}</span>
          </div>
        </div>

        <div className="w-full max-w-[400px] aspect-square relative touch-none select-none my-8">
          
          {/* Draw Boxes */}
          {boxes.map((box, i) => (
            <div
              key={`box-${i}`}
              className={`absolute transition-colors duration-300 ${box.owner === 'p1' ? 'bg-orange-500/40' : box.owner === 'p2' ? 'bg-blue-500/40' : 'bg-transparent'}`}
              style={{
                left: `${(box.c / (GRID_W - 1)) * 100}%`,
                top: `${(box.r / (GRID_H - 1)) * 100}%`,
                width: `${100 / (GRID_W - 1)}%`,
                height: `${100 / (GRID_H - 1)}%`,
              }}
            />
          ))}

          {/* Draw Edges */}
          {edges.map((edge) => {
            const isHorizontal = edge.dir === 'h'
            const isOwned = edge.owner !== null
            let edgeColor = 'bg-gray-800 hover:bg-gray-700'
            if (edge.owner === 'p1') edgeColor = 'bg-orange-500'
            if (edge.owner === 'p2') edgeColor = 'bg-blue-500'

            return (
              <div
                key={edge.id}
                onClick={() => handleEdgeClick(edge.id)}
                className={`absolute cursor-pointer rounded-full transition-colors ${edgeColor} ${isOwned ? 'z-10 shadow-[0_0_10px_currentColor]' : 'z-0 opacity-50 hover:opacity-100'}`}
                style={{
                  left: isHorizontal ? `${(edge.c / (GRID_W - 1)) * 100}%` : `${(edge.c / (GRID_W - 1)) * 100}%`,
                  top: isHorizontal ? `${(edge.r / (GRID_H - 1)) * 100}%` : `${(edge.r / (GRID_H - 1)) * 100}%`,
                  width: isHorizontal ? `${100 / (GRID_W - 1)}%` : '12px',
                  height: isHorizontal ? '12px' : `${100 / (GRID_H - 1)}%`,
                  transform: isHorizontal ? 'translate(0, -6px)' : 'translate(-6px, 0)',
                }}
              />
            )
          })}

          {/* Draw Dots */}
          {Array.from({ length: GRID_H }).map((_, r) => 
            Array.from({ length: GRID_W }).map((_, c) => (
              <div
                key={`dot-${r}-${c}`}
                className="absolute w-4 h-4 bg-gray-500 rounded-full z-20 pointer-events-none"
                style={{
                  left: `${(c / (GRID_W - 1)) * 100}%`,
                  top: `${(r / (GRID_H - 1)) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))
          )}

        </div>

        {gameState === 'gameover' && (
          <div className="mt-8 w-full animate-in slide-in-from-bottom-4">
            <GameResult
              game={gameMeta}
              isWin={score.p1 !== score.p2}
              message={score.p1 > score.p2 ? 'Player 1 Wins!' : score.p2 > score.p1 ? 'Player 2 Wins!' : "It's a Tie!"}
              onRestart={restart}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
