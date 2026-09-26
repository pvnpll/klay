import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GameCard } from '../components/GameCard'
import { GAMES } from '../data/games'
import type { GameMetadata } from '../data/games'
import { getStats } from '../utils/storage'
import type { UserStats } from '../utils/storage'
import { Play, Sparkles, Trophy, Gamepad2 } from 'lucide-react'

const CATEGORY_EMOJI: Record<string, string> = {
  Quick: '⚡',
  Speed: '🚀',
  Puzzle: '🧩',
  Classic: '👑',
  Skill: '🎯',
  Strategy: '♟️',
  Brain: '🧠',
  Word: '🔤',
  Chaos: '🎪',
  Arcade: '🕹️',
}

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
  const totalPlays = stats ? Object.values(stats.playCounts).reduce((a, b) => a + b, 0) : 0

  // Group games by category
  const categories = Array.from(new Set(GAMES.map(g => g.category)))

  return (
    <div className="space-y-12 pb-12 animate-pop-in">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto py-8 md:py-14 relative">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest text-fuchsia-200 mb-5">
          <Sparkles size={14} /> {GAMES.length} instant games • no signup 🎉
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-fuchsia-400 to-cyan-300 text-glow">
          Klay
        </h1>
        <p className="text-2xl font-black text-white mb-2">
          Small games. Instant play. Big fun! 🕹️
        </p>
        <p className="text-base text-gray-300 max-w-md mx-auto font-medium">
          No accounts, no downloads. Just click and play — beat your best! 👑
        </p>
        {totalPlays > 0 && (
          <div className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-amber-400/20 to-fuchsia-500/20 border border-amber-300/20 rounded-full px-5 py-2 text-sm font-black text-amber-200">
            <Trophy size={16} /> You've played {totalPlays} times — keep going!
          </div>
        )}
      </div>

      {/* Today's Challenge */}
      <section className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-fuchsia-500/25 via-purple-500/15 to-cyan-500/20 border border-fuchsia-400/30 rounded-[2rem] p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md shadow-[0_0_60px_rgba(217,70,239,0.25)]">
          <div className="absolute -top-10 -right-10 text-[120px] opacity-20 rotate-12 pointer-events-none">🎲</div>
          <div className="absolute -inset-10 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 flex-1 text-center md:text-left">
            <p className="text-amber-300 font-black uppercase tracking-widest text-sm mb-2">✨ Today's Challenge ✨</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{dailyGame.name} 🎮</h2>
            <p className="text-fuchsia-100/80 font-medium mb-4">{dailyGame.description}</p>
            
            {stats?.bests[dailyGame.id] !== undefined && (
              <div className="inline-block bg-black/40 rounded-2xl px-4 py-2 border border-white/10 mb-4 md:mb-0">
                <p className="text-xs text-amber-300 uppercase font-black tracking-wider">👑 Personal Best</p>
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
            className="relative z-10 w-full md:w-auto bg-gradient-to-r from-amber-300 to-fuchsia-400 text-gray-950 px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-fuchsia-900/50"
          >
            <Play fill="currentColor" size={20} />
            Play Now!
          </Link>
        </div>
      </section>

      {/* Recently Played */}
      {recentGames.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><Gamepad2 size={22} className="text-fuchsia-300" /> Recently Played 🕹️</h2>
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
                <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">{CATEGORY_EMOJI[category] || '🎮'}</span>
                {category} <span className="text-white/30 text-lg font-bold bg-white/5 px-2 py-0.5 rounded-full">{categoryGames.length}</span>
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
