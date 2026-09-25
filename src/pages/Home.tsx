import { GameCard } from '../components/GameCard'
import { Zap, TrendingUp, Hash, Brain, Grid3X3, Keyboard } from 'lucide-react'

const GAMES = [
  {
    title: 'Reaction',
    description: 'Test your reflexes. Click as fast as you can when the screen turns green.',
    path: '/reaction',
    Icon: Zap,
    colorClass: 'text-yellow-400 bg-yellow-400/10'
  },
  {
    title: 'Higher/Lower',
    description: 'Guess if the next card drawn will be higher or lower than the current one.',
    path: '/higher-lower',
    Icon: TrendingUp,
    colorClass: 'text-blue-400 bg-blue-400/10'
  },
  {
    title: 'Number Rush',
    description: 'Solve as many simple math problems as you can before time runs out.',
    path: '/number-rush',
    Icon: Hash,
    colorClass: 'text-red-400 bg-red-400/10'
  },
  {
    title: 'Memory',
    description: 'Find all the matching pairs of cards in the fewest moves possible.',
    path: '/memory',
    Icon: Brain,
    colorClass: 'text-purple-400 bg-purple-400/10'
  },
  {
    title: 'Tic-Tac-Toe',
    description: 'The classic game of X\'s and O\'s. Play against a friend locally.',
    path: '/tic-tac-toe',
    Icon: Grid3X3,
    colorClass: 'text-emerald-400 bg-emerald-400/10'
  },
  {
    title: 'Typing',
    description: 'Test your typing speed and accuracy with random quotes or words.',
    path: '/typing',
    Icon: Keyboard,
    colorClass: 'text-indigo-400 bg-indigo-400/10'
  }
]

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
          Welcome to <span className="text-emerald-400">Klay</span>
        </h1>
        <p className="text-lg text-gray-400">
          A collection of simple, fun, and fast browser games. Choose a game below to start playing!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <GameCard key={game.path} {...game} />
        ))}
      </div>
    </div>
  )
}
