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

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty'
type GuessRow = {
  letters: string[];
  statuses: LetterStatus[];
}

const MAX_GUESSES = 6
const WORD_LENGTH = 5

export default function WordGuess() {
  const [targetWord, setTargetWord] = useState('')
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [message, setMessage] = useState('')

  const initGame = useCallback(() => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
    setTargetWord(randomWord)
    setGuesses([])
    setCurrentGuess('')
    setGameState('playing')
    setMessage('')
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2000)
  }

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH) {
      showMessage('Not enough letters')
      return
    }
    
    // Evaluate guess
    const targetLetters = targetWord.split('')
    const guessLetters = currentGuess.split('')
    const statuses: LetterStatus[] = Array(WORD_LENGTH).fill('absent')
    
    // First pass: mark correct
    guessLetters.forEach((letter, i) => {
      if (letter === targetLetters[i]) {
        statuses[i] = 'correct'
        targetLetters[i] = null as any // mark as used
      }
    })
    
    // Second pass: mark present
    guessLetters.forEach((letter, i) => {
      if (statuses[i] !== 'correct' && targetLetters.includes(letter)) {
        statuses[i] = 'present'
        targetLetters[targetLetters.indexOf(letter)] = null as any
      }
    })
    
    const newGuesses = [...guesses, { letters: guessLetters, statuses }]
    setGuesses(newGuesses)
    setCurrentGuess('')
    
    if (currentGuess === targetWord) {
      setGameState('won')
      setMessage('You got it!')
      saveScore(gameMeta, 1)
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#4ade80']
      })
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState('lost')
      setMessage(`Game Over. Word was ${targetWord}`)
      saveScore(gameMeta, 0)
    }
  }, [currentGuess, guesses, targetWord])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      
      if (e.key === 'Enter') {
        submitGuess()
      } else if (e.key === 'Backspace') {
        setCurrentGuess(prev => prev.slice(0, -1))
      } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess(prev => (prev + e.key).toUpperCase())
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentGuess, gameState, submitGuess])

  const getLetterClass = (status: LetterStatus) => {
    switch (status) {
      case 'correct': return 'bg-emerald-500 border-emerald-500 text-white'
      case 'present': return 'bg-yellow-500 border-yellow-500 text-white'
      case 'absent': return 'bg-gray-700 border-gray-700 text-white'
      default: return 'border-gray-600 text-white'
    }
  }

  // Generate grid rows
  const rows = []
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      rows.push(guesses[i])
    } else if (i === guesses.length) {
      rows.push({
        letters: currentGuess.split('').concat(Array(WORD_LENGTH - currentGuess.length).fill('')),
        statuses: Array(WORD_LENGTH).fill('empty')
      })
    } else {
      rows.push({
        letters: Array(WORD_LENGTH).fill(''),
        statuses: Array(WORD_LENGTH).fill('empty')
      })
    }
  }

  const handleKeyClick = (key: string) => {
    if (gameState !== 'playing') return
    if (key === 'ENTER') {
      submitGuess()
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => (prev + key).toUpperCase())
    }
  }

  const getKeyStatus = (key: string): LetterStatus | undefined => {
    let bestStatus: LetterStatus | undefined = undefined
    for (const row of guesses) {
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (row.letters[i] === key) {
          const status = row.statuses[i]
          if (status === 'correct') return 'correct' // Best possible
          if (status === 'present') bestStatus = 'present'
          if (status === 'absent' && !bestStatus) bestStatus = 'absent'
        }
      }
    }
    return bestStatus
  }

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ]

  return (
    <GameLayout title={gameMeta.name}>
      <div className="flex flex-col items-center max-w-lg mx-auto">
        
        <div className="h-8 mb-4 flex items-center justify-center">
          {message && gameState === 'playing' && (
            <div className="bg-white text-gray-900 font-bold px-4 py-2 rounded-lg animate-in fade-in zoom-in duration-200">
              {message}
            </div>
          )}
        </div>

        <div className="grid gap-2 mb-8">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.letters.map((letter, colIndex) => {
                const isActive = rowIndex === guesses.length && letter !== ''
                return (
                  <div
                    key={colIndex}
                    className={`
                      w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-2xl font-bold uppercase
                      border-2 rounded-xl transition-all duration-300
                      ${getLetterClass(row.statuses[colIndex])}
                      ${isActive ? 'border-gray-400 scale-105' : 'border-gray-700/50'}
                    `}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Virtual Keyboard */}
        <div className="w-full flex flex-col gap-2 mt-4 px-2">
          {keyboardRows.map((row, i) => (
            <div key={i} className="flex justify-center gap-1.5 sm:gap-2">
              {row.map(key => {
                const status = getKeyStatus(key)
                let keyClass = 'bg-gray-800 text-white hover:bg-gray-700'
                if (status === 'correct') keyClass = 'bg-emerald-500 text-white'
                else if (status === 'present') keyClass = 'bg-yellow-500 text-white'
                else if (status === 'absent') keyClass = 'bg-gray-900 text-gray-600'
                
                const isSpecial = key === 'ENTER' || key === 'BACKSPACE'
                
                return (
                  <button
                    key={key}
                    onClick={() => handleKeyClick(key)}
                    className={`
                      ${isSpecial ? 'px-2 sm:px-4 text-xs sm:text-sm' : 'flex-1 max-w-[40px] text-sm sm:text-base'} 
                      h-12 sm:h-14 rounded-lg font-bold transition-colors select-none touch-manipulation
                      ${keyClass}
                    `}
                  >
                    {key === 'BACKSPACE' ? '⌫' : key}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {gameState !== 'playing' && (
          <GameResult
            game={gameMeta}
            isWin={gameState === 'won'}
            message={gameState === 'lost' ? `Word was ${targetWord}` : message}
            onRestart={initGame}
          />
        )}
      </div>
    </GameLayout>
  )
}
