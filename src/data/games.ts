import { Zap, Hash, Brain, Grid3X3, Keyboard, PlaySquare, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ScoreType = 'time' | 'score' | 'accuracy' | 'lower-is-better' | 'win-loss'

export interface GameMetadata {
  id: string
  name: string
  description: string
  rules: string[]
  category: 'Quick' | 'Speed' | 'Puzzle' | 'Classic' | 'Skill' | 'Strategy' | 'Brain' | 'Word' | 'Chaos'
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
    id: "odd-one-out",
    name: "Odd One Out",
    description: "Find the one emoji that doesn't belong before time runs out.",
    rules: [
      "A grid of identical items will appear.",
      "One item is slightly different.",
      "Find and click it as fast as possible.",
      "The grid grows larger each round!"
    ],
    category: "Brain",
    difficulty: "Medium",
    estimatedDuration: "1 minute",
    scoreType: "score",
    path: "/odd-one-out",
    Icon: Brain,
    colorClass: "text-fuchsia-400 bg-fuchsia-400/10",
    gradientClass: "from-fuchsia-400/20 to-purple-600/20"
  },
  {
    id: "sequence",
    name: "Sequence",
    description: "Determine the next number in the mathematical pattern.",
    rules: [
      "A sequence of numbers is displayed.",
      "Figure out the pattern (addition, multiplication, etc.).",
      "Select the correct next number from the choices.",
      "Solve as many as you can!"
    ],
    category: "Brain",
    difficulty: "Medium",
    estimatedDuration: "2 minutes",
    scoreType: "score",
    path: "/sequence",
    Icon: Hash,
    colorClass: "text-blue-400 bg-blue-400/10",
    gradientClass: "from-blue-400/20 to-cyan-600/20"
  },
  {
    id: "stroop-test",
    name: "Stroop Test",
    description: "Click the COLOR of the text, not the word itself!",
    rules: [
      "A word will appear on screen.",
      "The word will spell a color (e.g., 'RED').",
      "But the text itself will be painted a DIFFERENT color.",
      "You must click the button that matches the INK color."
    ],
    category: "Brain",
    difficulty: "Hard",
    estimatedDuration: "1 minute",
    scoreType: "score",
    path: "/stroop-test",
    Icon: Zap,
    colorClass: "text-rose-400 bg-rose-400/10",
    gradientClass: "from-rose-400/20 to-orange-600/20"
  },
  {
    id: "dont-touch-red",
    name: "Don't Touch Red",
    description: "Click the safe targets before they disappear. Never touch red!",
    rules: [
      "Shapes will appear on the screen.",
      "Click them to score points before they vanish.",
      "If you click a RED shape, you instantly lose.",
      "If a safe shape disappears before you click it, you lose."
    ],
    category: "Chaos",
    difficulty: "Hard",
    estimatedDuration: "1 minute",
    scoreType: "score",
    path: "/dont-touch-red",
    Icon: Zap,
    colorClass: "text-red-500 bg-red-500/10",
    gradientClass: "from-red-500/20 to-orange-600/20"
  },
  {
    id: "risk-it",
    name: "Risk It",
    description: "Push your luck. Bank your points or risk it for a higher multiplier!",
    rules: [
      "The multiplier will continuously increase.",
      "Click BANK to secure your current score.",
      "If the system CRASHES before you bank, you lose the round.",
      "Reach the target score across multiple rounds to win!"
    ],
    category: "Strategy",
    difficulty: "Medium",
    estimatedDuration: "2 minutes",
    scoreType: "score",
    path: "/risk-it",
    Icon: Brain,
    colorClass: "text-emerald-400 bg-emerald-400/10",
    gradientClass: "from-emerald-400/20 to-green-600/20"
  },
  {
    id: "grid-memory",
    name: "Grid Memory",
    description: "Remember the highlighted tiles and repeat the pattern.",
    rules: [
      "A sequence of tiles will flash on the grid.",
      "Memorize their locations.",
      "Click the tiles that flashed in any order.",
      "The grid grows larger as you progress!"
    ],
    category: "Brain",
    difficulty: "Hard",
    estimatedDuration: "2 minutes",
    scoreType: "score",
    path: "/grid-memory",
    Icon: Grid3X3,
    colorClass: "text-purple-400 bg-purple-400/10",
    gradientClass: "from-purple-400/20 to-indigo-500/20"
  },
  {
    id: "perfect-timing",
    name: "Perfect Timing",
    description: "Stop the moving indicator exactly inside the target zone.",
    rules: [
      "A marker will move back and forth.",
      "Click or tap when the marker is inside the green zone.",
      "Each success shrinks the zone and increases speed.",
      "Miss the zone once, and it's game over!"
    ],
    category: "Skill",
    difficulty: "Medium",
    estimatedDuration: "1 minute",
    scoreType: "score",
    path: "/perfect-timing",
    Icon: Zap,
    colorClass: "text-rose-400 bg-rose-400/10",
    gradientClass: "from-rose-400/20 to-pink-500/20"
  },
  {
    id: "one-second",
    name: "One Second",
    description: "Try to stop the timer at exactly 1.000 seconds.",
    rules: [
      "Hold the button to start the timer.",
      "The timer will hide after a moment.",
      "Release exactly when you think 1 second has passed.",
      "Get as close to 1.000s as possible!"
    ],
    category: "Quick",
    difficulty: "Hard",
    estimatedDuration: "30 seconds",
    scoreType: "accuracy",
    path: "/one-second",
    Icon: Brain,
    colorClass: "text-cyan-400 bg-cyan-400/10",
    gradientClass: "from-cyan-400/20 to-blue-500/20"
  },
  {
    id: "mental-math",
    name: "Mental Math",
    description: "Solve as many math problems as you can before time runs out.",
    rules: [
      "You start with 30 seconds.",
      "Solve the equation using the numpad.",
      "Correct answers give you points and extra time.",
      "Wrong answers deduct time."
    ],
    category: "Brain",
    difficulty: "Medium",
    estimatedDuration: "2 minutes",
    scoreType: "score",
    path: "/mental-math",
    Icon: Hash,
    colorClass: "text-amber-400 bg-amber-400/10",
    gradientClass: "from-amber-400/20 to-orange-500/20"
  },
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
