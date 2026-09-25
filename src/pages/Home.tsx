import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GameCard } from '../components/GameCard'
import { GAMES } from '../data/games'
import type { GameMetadata } from '../data/games'
import { getStats } from '../utils/storage'
import type { UserStats } from '../utils/storage'
import { Play } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState<UserStats | null>(null)
  
  useEffect(() => {
    setStats(getStats())
  }, [])

  // Deterministic daily challenge based on date
  const getDailyChallenge = () => {
    const today = new Date().toISOString().split('T')[0]
    let hash = 0
    for (let i = 0; i < today.length; i++) {
      hash = ((hash << 5) - hash) + today.charCodeAt(i)
      hash |= 0 // Convert to 32bit int
    }
    const index = Math.abs(hash) % GAMES.length
    return GAMES[index]
  }

  const dailyGame = getDailyChallenge()
  const recentGames = stats?.recentlyPlayed.map(id => GAMES.find(g => g.id === id)).filter(Boolean) as GameMetadata[] || []

  // Group games by category
  const categories = Array.from(new Set(GAMES.map(g => g.category)))

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto py-12 md:py-20">
        <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-6 text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
          Klay
        </h1>
        <p className="text-2xl font-bold text-gray-200 mb-3">
          Small games. Instant play.
        </p>
        <p className="text-lg text-gray-400 max-w-md mx-auto font-medium">
          No accounts, no downloads. Just click and play.
        </p>
      </div>

      {/* Today's Challenge */}
      <section className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-600/20 border border-emerald-500/30 rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md">
          <div className="absolute -inset-10 bg-emerald-500/10 blur-3xl rounded-full" />
          <div className="relative z-10 flex-1 text-center md:text-left">
            <p className="text-emerald-400 font-black uppercase tracking-widest text-sm mb-2">Today's Challenge</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{dailyGame.name}</h2>
            <p className="text-emerald-100/70 font-medium mb-4">{dailyGame.description}</p>
            
            {stats?.bests[dailyGame.id] !== undefined && (
              <div className="inline-block bg-black/40 rounded-xl px-4 py-2 border border-white/10 mb-4 md:mb-0">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Personal Best</p>
                <p className="text-xl font-black text-white">
                  {dailyGame.scoreType === 'time' || dailyGame.scoreType === 'lower-is-better' 
                    ? `${stats.bests[dailyGame.id]}s` 
                    : stats.bests[dailyGame.id]}
                </p>
              </div>
            )}
          </div>
          
          <Link 
            to={dailyGame.path}
            className="relative z-10 w-full md:w-auto bg-white text-gray-950 px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-emerald-900/50"
          >
            <Play fill="currentColor" size={20} />
            Play Now
          </Link>
        </div>
      </section>

      {/* Recently Played */}
      {recentGames.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white tracking-tight">Recently Played</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
            {recentGames.map((game) => (
              <div key={`recent-${game.id}`} className="min-w-[280px] sm:min-w-[320px] snap-start">
                <GameCard 
                  title={game.name}
                  description={game.description}
                  path={game.path}
                  Icon={game.Icon}
                  colorClass={game.colorClass}
                  gradientClass={game.gradientClass}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Categories */}
      <section className="space-y-12">
        {categories.map(category => {
          const categoryGames = GAMES.filter(g => g.category === category)
          return (
            <div key={category}>
              <h2 className="text-2xl font-black text-white tracking-tight mb-6 flex items-center gap-3">
                {category} <span className="text-gray-600 text-lg font-bold">{categoryGames.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryGames.map((game) => (
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
        })}
      </section>
    </div>
  )
}
