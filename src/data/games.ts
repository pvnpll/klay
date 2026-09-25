import { Zap, TrendingUp, Hash, Brain, Grid3X3, Keyboard, PlaySquare, Type } from 'lucide-react'

export const GAMES = [
  {
    id: "reaction",
    name: "Reaction Test",
    description: "Test your reflexes. Click as fast as you can when the screen turns green.",
    rules: [
      "Click anywhere on the game area to begin.",
      "Wait until the red screen turns green.",
      "Click as fast as you can once it turns green!",
      "If you click before it turns green, it's a false start."
    ],
    category: "Quick",
    path: "/reaction",
    Icon: Zap,
    colorClass: "text-yellow-400 bg-yellow-400/10"
  },
  {
    id: "higher-lower",
    name: "Higher or Lower",
    description: "Guess if the next number drawn will be higher or lower.",
    rules: [
      "You will be shown a number between 1 and 100.",
      "Guess whether the next generated number will be HIGHER or LOWER.",
      "If you guess correctly, you earn 1 point and continue.",
      "If you guess wrong, it's game over."
    ],
    category: "Casual",
    path: "/higher-lower",
    Icon: TrendingUp,
    colorClass: "text-blue-400 bg-blue-400/10"
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
    path: "/number-rush",
    Icon: Hash,
    colorClass: "text-red-400 bg-red-400/10"
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
    path: "/memory",
    Icon: Brain,
    colorClass: "text-purple-400 bg-purple-400/10"
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
    path: "/tic-tac-toe",
    Icon: Grid3X3,
    colorClass: "text-emerald-400 bg-emerald-400/10"
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
    path: "/typing",
    Icon: Keyboard,
    colorClass: "text-indigo-400 bg-indigo-400/10"
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
    path: "/snake",
    Icon: PlaySquare,
    colorClass: "text-green-400 bg-green-400/10"
  },
  {
    id: "word-guess",
    name: "Word Guess",
    description: "Guess the hidden 5-letter word in 6 tries.",
    rules: [
      "Type a 5-letter word and press Enter to submit.",
      "Green tile: The letter is in the word and in the correct spot.",
      "Yellow tile: The letter is in the word but in the wrong spot.",
      "Gray tile: The letter is not in the word.",
      "You have 6 attempts to guess the word."
    ],
    category: "Puzzle",
    path: "/word-guess",
    Icon: Type,
    colorClass: "text-orange-400 bg-orange-400/10"
  },
  {
    id: "chess",
    name: "Chess",
    description: "Play chess against an AI with full drag-and-drop animated pieces.",
    rules: [
      "Drag and drop your pieces to move.",
      "Standard chess rules apply (en passant, castling, promotion).",
      "You play as White, the Computer plays as Black.",
      "Checkmate the opposing king to win!"
    ],
    category: "Strategy",
    path: "/chess",
    Icon: Grid3X3, // Using Grid3x3 as a placeholder since lucide doesn't have a chess piece icon
    colorClass: "text-zinc-400 bg-zinc-400/10"
  }
]
