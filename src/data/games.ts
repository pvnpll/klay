import { Zap, Hash, Brain, Grid3X3, Keyboard, PlaySquare, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ScoreType = 'time' | 'score' | 'accuracy' | 'lower-is-better' | 'win-loss'

export interface GameMetadata {
  id: string
  name: string
  description: string
  rules: string[]
  category: 'Quick' | 'Speed' | 'Puzzle' | 'Classic' | 'Skill' | 'Strategy' | 'Brain' | 'Word'
  difficulty: 'Easy' | 'Medium' | 'Hard'
  estimatedDuration: string
  scoreType: ScoreType
  path: string
  Icon: LucideIcon
  colorClass: string
  gradientClass: string
}

export const GAMES: GameMetadata[] = [
  {
    id: "sudoku",
    name: "Sudoku",
    description: "Hard difficulty Sudoku generator. A new puzzle every time.",
    rules: [
      "Fill the 9x9 grid with numbers 1-9.",
      "Each row, column, and 3x3 block must contain all digits 1-9 without repetition.",
      "Complete the puzzle as fast as possible."
    ],
    category: "Puzzle",
    difficulty: "Hard",
    estimatedDuration: "10 minutes",
    scoreType: "time",
    path: "/sudoku",
    Icon: Grid3X3,
    colorClass: "text-indigo-400 bg-indigo-400/10",
    gradientClass: "from-indigo-400/20 to-purple-500/20"
  },
  {
    id: "target-click",
    name: "Target Click",
    description: "Aim Trainer. Click 20 targets as fast as possible.",
    rules: [
      "Click the 'Start Training' button to begin.",
      "A target will appear somewhere on the screen.",
      "Click it as fast as you can.",
      "Repeat until you've hit all 20 targets."
    ],
    category: "Skill",
    difficulty: "Medium",
    estimatedDuration: "30 seconds",
    scoreType: "time",
    path: "/target-click",
    Icon: Zap,
    colorClass: "text-blue-400 bg-blue-400/10",
    gradientClass: "from-blue-400/20 to-cyan-500/20"
  },
  {
    id: "falling-tiles",
    name: "Falling Tiles",
    description: "Click the black tiles before they hit the bottom of the screen.",
    rules: [
      "Tiles will fall from the top of the screen.",
      "Click the lowest black tile in the sequence.",
      "If you miss a tile or click a red tile, game over!",
      "Survive as long as possible to get a high score."
    ],
    category: "Quick",
    difficulty: "Medium",
    estimatedDuration: "1 minute",
    scoreType: "score",
    path: "/falling-tiles",
    Icon: Zap,
    colorClass: "text-blue-400 bg-blue-400/10",
    gradientClass: "from-blue-400/20 to-indigo-500/20"
  },
  {
    id: "number-rush",
    name: "Number Rush",
    description: "Click numbers 1 to 20 in order as fast as possible.",
    rules: [
      "A grid of numbers from 1 to 20 will appear in random positions.",
      "Click the number 1 to start the timer.",
      "Click the remaining numbers in exact sequential order (2, 3, 4...).",
      "Finish by clicking 20 as fast as possible!"
    ],
    category: "Speed",
    difficulty: "Medium",
    estimatedDuration: "1 minute",
    scoreType: "time",
    path: "/number-rush",
    Icon: Hash,
    colorClass: "text-red-400 bg-red-400/10",
    gradientClass: "from-red-400/20 to-rose-600/20"
  },
  {
    id: "memory",
    name: "Memory Match",
    description: "Find all the matching pairs of cards in the fewest moves.",
    rules: [
      "Click a card to reveal its hidden icon.",
      "Click a second card to see if it matches.",
      "If they match, they stay face up.",
      "If they don't, they flip back over.",
      "Match all 4 pairs in the fastest time and fewest moves."
    ],
    category: "Puzzle",
    difficulty: "Medium",
    estimatedDuration: "2 minutes",
    scoreType: "time", // Alternatively could track lowest moves
    path: "/memory",
    Icon: Brain,
    colorClass: "text-purple-400 bg-purple-400/10",
    gradientClass: "from-purple-400/20 to-fuchsia-600/20"
  },
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    description: "The classic game of X's and O's. Play vs Computer or Player.",
    rules: [
      "Choose a game mode: VS Computer or VS Player.",
      "Players take turns placing X or O on the 3x3 grid.",
      "The first player to get 3 in a row (horizontally, vertically, or diagonally) wins.",
      "If the board fills up with no winner, it's a draw."
    ],
    category: "Classic",
    difficulty: "Easy",
    estimatedDuration: "1 minute",
    scoreType: "win-loss",
    path: "/tic-tac-toe",
    Icon: Grid3X3,
    colorClass: "text-emerald-400 bg-emerald-400/10",
    gradientClass: "from-emerald-400/20 to-teal-600/20"
  },
  {
    id: "typing",
    name: "Typing Race",
    description: "Test your typing speed and accuracy with quotes.",
    rules: [
      "Start typing the displayed quote to begin the timer.",
      "Type exactly what you see. Red text indicates typos.",
      "Your Words Per Minute (WPM) and accuracy are tracked live.",
      "Finish the quote to log your score."
    ],
    category: "Skill",
    difficulty: "Hard",
    estimatedDuration: "2 minutes",
    scoreType: "score", // WPM
    path: "/typing",
    Icon: Keyboard,
    colorClass: "text-indigo-400 bg-indigo-400/10",
    gradientClass: "from-indigo-400/20 to-blue-600/20"
  },
  {
    id: "snake",
    name: "Snake",
    description: "The classic snake game. Eat food to grow and don't hit the walls!",
    rules: [
      "Use Arrow Keys (or WASD) to change the snake's direction.",
      "Guide the snake to eat the red food.",
      "Each time you eat, you grow longer and gain 10 points.",
      "If you hit the wall or bite your own tail, it's game over!"
    ],
    category: "Classic",
    difficulty: "Medium",
    estimatedDuration: "3 minutes",
    scoreType: "score",
    path: "/snake",
    Icon: PlaySquare,
    colorClass: "text-green-400 bg-green-400/10",
    gradientClass: "from-green-400/20 to-emerald-600/20"
  },
  {
    id: "word-guess",
    name: "Word Scramble",
    description: "Unscramble the letters to find the hidden word.",
    rules: [
      "You will be given a scrambled word.",
      "Click the letters in the correct order to spell the word.",
      "Use backspace if you make a mistake.",
      "Find the word to win!"
    ],
    category: "Word",
    difficulty: "Medium",
    estimatedDuration: "5 minutes",
    scoreType: "win-loss",
    path: "/word-guess",
    Icon: Type,
    colorClass: "text-orange-400 bg-orange-400/10",
    gradientClass: "from-orange-400/20 to-amber-600/20"
  },
  {
    id: "2048",
    name: "2048",
    description: "Join the numbers and get to the 2048 tile!",
    rules: [
      "Use arrow keys or swipe to move tiles.",
      "Tiles with the same number merge into one when they touch.",
      "Add them up to reach 2048!"
    ],
    category: "Puzzle",
    difficulty: "Hard",
    estimatedDuration: "10 minutes",
    scoreType: "score",
    path: "/2048",
    Icon: Grid3X3,
    colorClass: "text-yellow-400 bg-yellow-400/10",
    gradientClass: "from-yellow-300/20 to-orange-500/20"
  },
  {
    id: "chess",
    name: "Chess",
    description: "Play chess against an AI or a friend with full animated pieces.",
    rules: [
      "Drag and drop your pieces to move.",
      "Standard chess rules apply (en passant, castling, promotion).",
      "Checkmate the opposing king to win!"
    ],
    category: "Strategy",
    difficulty: "Hard",
    estimatedDuration: "15 minutes",
    scoreType: "win-loss",
    path: "/chess",
    Icon: Grid3X3,
    colorClass: "text-zinc-400 bg-zinc-400/10",
    gradientClass: "from-zinc-400/20 to-gray-600/20"
  }
]
