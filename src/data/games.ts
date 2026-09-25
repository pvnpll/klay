import { Zap, TrendingUp, Hash, Brain, Grid3X3, Keyboard } from 'lucide-react'

export const GAMES = [
  {
    id: "reaction",
    name: "Reaction Test",
    description: "Test your reflexes. Click as fast as you can when the screen turns green.",
    category: "Quick",
    path: "/reaction",
    Icon: Zap,
    colorClass: "text-yellow-400 bg-yellow-400/10"
  },
  {
    id: "higher-lower",
    name: "Higher or Lower",
    description: "Guess if the next card drawn will be higher or lower.",
    category: "Casual",
    path: "/higher-lower",
    Icon: TrendingUp,
    colorClass: "text-blue-400 bg-blue-400/10"
  },
  {
    id: "number-rush",
    name: "Number Rush",
    description: "Click numbers 1 to 20 in order as fast as possible.",
    category: "Speed",
    path: "/number-rush",
    Icon: Hash,
    colorClass: "text-red-400 bg-red-400/10"
  },
  {
    id: "memory",
    name: "Memory Match",
    description: "Find all the matching pairs of cards in the fewest moves.",
    category: "Puzzle",
    path: "/memory",
    Icon: Brain,
    colorClass: "text-purple-400 bg-purple-400/10"
  },
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    description: "The classic game of X's and O's. Play vs Computer or Player.",
    category: "Classic",
    path: "/tic-tac-toe",
    Icon: Grid3X3,
    colorClass: "text-emerald-400 bg-emerald-400/10"
  },
  {
    id: "typing",
    name: "Typing Race",
    description: "Test your typing speed and accuracy with quotes.",
    category: "Skill",
    path: "/typing",
    Icon: Keyboard,
    colorClass: "text-indigo-400 bg-indigo-400/10"
  }
]
