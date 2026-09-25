import { useState, useEffect, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore } from '../../utils/storage'
import confetti from 'canvas-confetti'

const gameMeta = GAMES.find(g => g.id === 'word-guess')!

const WORD_LIST = [
  'APPLE', 'BRAIN', 'CLOCK', 'DREAM', 'EARTH', 'FLAME', 'GHOST', 'HEART', 
  'IMAGE', 'JUICE', 'KNIFE', 'LEMON', 'MAGIC', 'NIGHT', 'OCEAN', 'PIZZA', 
  'QUEEN', 'RIVER', 'SMILE', 'TRAIN', 'UNITE', 'VOICE', 'WATER', 'YOUTH', 'ZEBRA',
  'PLANT', 'SOUND', 'LIGHT', 'BREAD', 'MUSIC', 'SPACE', 'STORM', 'STONE', 'CROWN'
]

type LetterObj = { id: number, letter: string, used: boolean }

export default function WordGuess() {
  const [targetWord, setTargetWord] = useState('')
  const [scrambled, setScrambled] = useState<LetterObj[]>([])
  const [currentGuess, setCurrentGuess] = useState<number[]>([]) // stores ids
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')

  const shuffleWord = (word: string) => {
    let arr = word.split('').map((l, i) => ({ id: i, letter: l, used: false }))
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Prevent it from accidentally matching the word
    if (arr.map(a => a.letter).join('') === word && word.length > 1) {
      return shuffleWord(word)
    }
    return arr
  }

  const initGame = useCallback(() => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
    setTargetWord(randomWord)
    setScrambled(shuffleWord(randomWord))
    setCurrentGuess([])
    setGameState('playing')
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  const handleLetterClick = (id: number) => {
    if (gameState !== 'playing') return
    const letterObj = scrambled.find(s => s.id === id)
    if (!letterObj || letterObj.used) return

    setScrambled(prev => prev.map(s => s.id === id ? { ...s, used: true } : s))
    const newGuess = [...currentGuess, id]
    setCurrentGuess(newGuess)

    if (newGuess.length === targetWord.length) {
      const guessStr = newGuess.map(gid => scrambled.find(s => s.id === gid)!.letter).join('')
      if (guessStr === targetWord) {
        setGameState('won')
        saveScore(gameMeta, 1)
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#16a34a', '#4ade80']
        })
      } else {
        setGameState('lost')
        saveScore(gameMeta, 0)
      }
    }
  }

  const handleRemoveLetter = () => {
    if (gameState !== 'playing' || currentGuess.length === 0) return
    const idToRestore = currentGuess[currentGuess.length - 1]
    setCurrentGuess(prev => prev.slice(0, -1))
    setScrambled(prev => prev.map(s => s.id === idToRestore ? { ...s, used: false } : s))
  }

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center max-w-lg mx-auto">
        
        <div className="mb-8 mt-4 text-center">
          <h2 className="text-gray-400 mb-2">Unscramble the word:</h2>
          <div className="flex gap-2 justify-center flex-wrap">
            {scrambled.map((item) => (
              <button
                key={item.id}
                onClick={() => handleLetterClick(item.id)}
                disabled={item.used || gameState !== 'playing'}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-2xl font-black uppercase transition-all
                  ${item.used 
                    ? 'bg-gray-800 text-gray-700 cursor-not-allowed scale-95' 
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg active:scale-95'
                  }`}
              >
                {item.letter}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full flex flex-col items-center mb-8">
          <div className="flex gap-2 mb-4">
            {Array(targetWord.length).fill(null).map((_, i) => {
              const letterId = currentGuess[i]
              const letter = letterId !== undefined ? scrambled.find(s => s.id === letterId)?.letter : ''
              
              let boxClass = 'bg-gray-900 border-gray-700 text-white'
              if (gameState === 'won') boxClass = 'bg-emerald-500 border-emerald-500 text-white scale-105'
              else if (gameState === 'lost') boxClass = 'bg-red-500 border-red-500 text-white'

              return (
                <div
                  key={i}
                  className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-black uppercase transition-all duration-300 ${boxClass}`}
                >
                  {letter}
                </div>
              )
            })}
          </div>
          
          <button
            onClick={handleRemoveLetter}
            disabled={currentGuess.length === 0 || gameState !== 'playing'}
            className="text-gray-400 hover:text-white px-4 py-2 font-bold disabled:opacity-50 transition-colors"
          >
            ⌫ Backspace
          </button>
        </div>

        {gameState !== 'playing' && (
          <GameResult
            game={gameMeta}
            isWin={gameState === 'won'}
            message={gameState === 'won' ? 'Perfect!' : `Word was ${targetWord}`}
            onRestart={initGame}
          />
        )}
      </div>
    </GameLayout>
  )
}
