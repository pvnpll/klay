import { useState, useEffect, useRef } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { getFromStorage, saveToStorage } from '../../lib/storage'
import { Star, Heart, Moon, Sun, RotateCcw } from 'lucide-react'

type Card = {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

type GameState = 'ready' | 'playing' | 'completed'

const SYMBOLS = ['star', 'heart', 'moon', 'sun']
const ICONS: Record<string, React.FC<any>> = {
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
  
  const [bestTime, setBestTime] = useState<number | null>(
    getFromStorage<number | null>('klay_memory_best', null)
  )

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
      // The state update in setTimeout might be slightly delayed, so check if all EXCEPT maybe the last pair are matched
      // Actually, better to check the next tick
      setTimeout(() => {
        setCards(latestCards => {
          if (latestCards.every(c => c.isMatched)) {
            stopTimer()
            setGameState('completed')
            const finalTime = performance.now() - startTimeRef.current
            setTimeElapsed(finalTime)
            
            if (!bestTime || finalTime < bestTime) {
              setBestTime(finalTime)
              saveToStorage('klay_memory_best', finalTime)
            }
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
    <GameLayout title="Memory Match">
      <div className="flex flex-col items-center max-w-2xl mx-auto">
        <div className="flex justify-between w-full mb-6 text-gray-400 font-medium">
          <span className="text-xl">Moves: <span className="text-white">{moves}</span></span>
          <span className="text-xl">
            Time: <span className="text-white tabular-nums">{formatTime(timeElapsed)}s</span>
          </span>
          <span className="text-xl hidden sm:inline">
            Best: <span className="text-white tabular-nums">{bestTime ? formatTime(bestTime) + 's' : '—'}</span>
          </span>
        </div>

        {gameState === 'completed' ? (
          <div className="w-full bg-purple-500/20 border-2 border-purple-500 rounded-3xl p-12 text-center flex flex-col items-center justify-center mb-8">
            <h2 className="text-4xl font-black text-purple-400 mb-4">COMPLETE!</h2>
            <p className="text-xl text-gray-300 mb-2">Moves: {moves}</p>
            <p className="text-2xl text-white mb-2">Time: {formatTime(timeElapsed)} seconds</p>
            {bestTime === timeElapsed && (
              <p className="text-yellow-400 font-bold mb-8">New Best Time!</p>
            )}
            <button
              onClick={initGame}
              className="mt-6 flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all hover:-translate-y-1"
            >
              <RotateCcw size={24} />
              PLAY AGAIN
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full aspect-[2/1]">
            {cards.map((card) => {
              const Icon = ICONS[card.symbol]
              const show = card.isFlipped || card.isMatched
              
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={show || isProcessing}
                  className="relative preserve-3d transition-transform duration-300 ease-in-out focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 rounded-xl"
                  style={{
                    transform: show ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    perspective: '1000px'
                  }}
                >
                  {/* Front of card (hidden when flipped) */}
                  <div 
                    className="absolute inset-0 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 backface-hidden flex items-center justify-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-gray-600/30"></div>
                  </div>
                  
                  {/* Back of card (visible when flipped) */}
                  <div 
                    className={`absolute inset-0 rounded-xl flex items-center justify-center ${card.isMatched ? 'bg-purple-900/50 border-purple-500/50' : 'bg-purple-600'} border-2`}
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <Icon size={40} className={card.isMatched ? 'text-purple-400/50' : 'text-white'} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
        
        {gameState !== 'completed' && (
          <div className="mt-12 flex justify-center w-full">
            <button
              onClick={initGame}
              className="text-gray-500 hover:text-gray-300 font-medium transition-colors"
            >
              Restart Game
            </button>
          </div>
        )}
      </div>
    </GameLayout>
  )
}
