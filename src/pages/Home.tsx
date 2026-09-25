import { GameCard } from '../components/GameCard'
import { GAMES } from '../data/games'

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto py-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
          <span className="text-emerald-400">Klay</span>
        </h1>
        <p className="text-xl font-medium text-gray-200 mb-2">
          Tiny games. Instant play.
        </p>
        <p className="text-lg text-gray-400">
          Pick a game and start.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <GameCard 
            key={game.id} 
            title={game.name}
            description={game.description}
            path={game.path}
            Icon={game.Icon}
            colorClass={game.colorClass}
            gradientClass={game.gradientClass}
          />
        ))}
      </div>
    </div>
  )
}
