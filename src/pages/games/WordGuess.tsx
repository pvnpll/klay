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

  return (
    <GameLayout title="Word Guess">
      <div className="flex flex-col items-center">
        
        <div className="h-8 mb-4 flex items-center justify-center">
          {message && (
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
                      w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-3xl font-bold uppercase
                      border-2 rounded-sm transition-all duration-300
                      ${getLetterClass(row.statuses[colIndex])}
                      ${isActive ? 'border-gray-400 scale-[1.02]' : ''}
                    `}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {gameState !== 'playing' && (
          <GameResult
            game={gameMeta}
            isWin={gameState === 'won'}
            message={message}
            onRestart={initGame}
          />
        )}
      </div>
    </GameLayout>
  )
}
