import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import { Star, Heart, Moon, Sun } from 'lucide-react'

const gameMeta = GAMES.find(g => g.id === 'memory')!
type GameState = 'ready' | 'playing' | 'completed'

type SymbolType = 'star' | 'heart' | 'moon' | 'sun'
const SYMBOLS: SymbolType[] = ['star', 'heart', 'moon', 'sun']

interface Card {
  id: number
  symbol: SymbolType
  isFlipped: boolean
  isMatched: boolean
}

const ICONS = {
  star: Star,
  heart: Heart,
  moon: Moon,
  sun: Sun
}

export default function Memory() {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [cards, setCards] = useState<Card[]>([])
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  
  const [bestTime, setBestTime] = useState<number | undefined>(() => {
    return getStats().bests[gameMeta.id]
  })
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  
  // Prevent clicking when checking pairs
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    initGame()
    return () => stopTimer()
  }, [])

  const initGame = () => {
    stopTimer()
    
    // Create 4 pairs
    let newCards: Card[] = []
    let idCounter = 0
    SYMBOLS.forEach(symbol => {
      newCards.push({ id: idCounter++, symbol, isFlipped: false, isMatched: false })
      newCards.push({ id: idCounter++, symbol, isFlipped: false, isMatched: false })
    })

    // Shuffle
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newCards[i], newCards[j]] = [newCards[j], newCards[i]]
    }

    setCards(newCards)
    setFlippedIds([])
    setMoves(0)
    setTimeElapsed(0)
    setGameState('ready')
    setIsProcessing(false)
    setIsNewBest(false)
  }

  const startTimer = () => {
    startTimeRef.current = performance.now()
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(performance.now() - startTimeRef.current)
    }, 100) // update every 100ms
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleCardClick = (id: number) => {
    if (isProcessing || gameState === 'completed') return
    
    const clickedCard = cards.find(c => c.id === id)
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return

    if (gameState === 'ready') {
      setGameState('playing')
      startTimer()
    }

    // Flip the card
    const newCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c)
    setCards(newCards)
    
    const newFlippedIds = [...flippedIds, id]
    setFlippedIds(newFlippedIds)

    // If we flipped two cards, check for match
    if (newFlippedIds.length === 2) {
      setMoves(m => m + 1)
      setIsProcessing(true)
      
      const card1 = newCards.find(c => c.id === newFlippedIds[0])!
      const card2 = newCards.find(c => c.id === newFlippedIds[1])!
      
      if (card1.symbol === card2.symbol) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            newFlippedIds.includes(c.id) ? { ...c, isMatched: true } : c
          ))
          setFlippedIds([])
          setIsProcessing(false)
          checkWinCondition()
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            newFlippedIds.includes(c.id) ? { ...c, isFlipped: false } : c
          ))
          setFlippedIds([])
          setIsProcessing(false)
        }, 1000)
      }
    }
  }

  const checkWinCondition = () => {
    setCards(currentCards => {
      setTimeout(() => {
        setCards(latestCards => {
          if (latestCards.every(c => c.isMatched)) {
            stopTimer()
            setGameState('completed')
            const finalTime = Math.round(performance.now() - startTimeRef.current)
            setTimeElapsed(finalTime)
            
            const timeInSeconds = parseFloat((finalTime / 1000).toFixed(1))
            const { isNewBest, bestScore } = saveScore(gameMeta, timeInSeconds)
            setIsNewBest(isNewBest)
            setBestTime(bestScore)
          }
          return latestCards
        })
      }, 0)
      return currentCards
    })
  }

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1)
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center max-w-2xl mx-auto relative">
        <div className="flex justify-between w-full mb-6 px-6 py-3 rounded-2xl border border-purple-400/20 bg-gradient-to-r from-purple-500/15 to-fuchsia-500/10 text-sm font-black shadow-inner">
          <span className="text-purple-200">👣 MOVES <span className="text-white text-xl ml-1 tabular-nums">{moves}</span></span>
          <span className="text-fuchsia-200">
            ⏱️ TIME <span className="text-white text-xl ml-1 tabular-nums">{formatTime(timeElapsed)}s</span>
          </span>
          <span className="hidden sm:inline text-gray-300">
            👑 BEST <span className="text-white text-xl ml-1 tabular-nums">{bestTime ? `${bestTime}s` : '—'}</span>
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full">
          {cards.map((card) => {
            const Icon = ICONS[card.symbol]
            const show = card.isFlipped || card.isMatched
            
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={show || isProcessing || gameState === 'completed'}
                className="relative aspect-square transition-transform duration-300 ease-in-out focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 rounded-2xl hover:-translate-y-1 active:scale-95"
                style={{
                  transform: show ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 rounded-2xl border-2 border-white/20 flex items-center justify-center shadow-lg text-3xl"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  ❓
                </div>
                
                <div 
                  className={`absolute inset-0 rounded-2xl flex items-center justify-center border-2 shadow-[0_0_20px_rgba(168,85,247,0.35)] ${card.isMatched ? 'bg-emerald-500/90 border-emerald-200' : 'bg-gradient-to-br from-amber-300 to-orange-400 border-white/40'}`}
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <Icon size={40} className={card.isMatched ? 'text-white' : 'text-gray-900'} />
                </div>
              </button>
            )
          })}
        </div>
        
        {gameState !== 'completed' && (
          <div className="mt-8 flex justify-center w-full">
            <button
              onClick={initGame}
              className="text-sm text-gray-400 hover:text-white font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full transition-colors"
            >
              🔀 Shuffle & Restart
            </button>
          </div>
        )}

        {gameState === 'completed' && (
          <div className="mt-6 w-full animate-pop-in">
          <GameResult
            game={gameMeta}
            score={parseFloat((timeElapsed / 1000).toFixed(1))}
            isNewBest={isNewBest}
            bestScore={bestTime}
            message={`🎉 Completed in ${moves} moves!`}
            onRestart={initGame}
          />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
