import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Info } from 'lucide-react'
import { useState } from 'react'
import { GAMES } from '../data/games'

interface GameLayoutProps {
  title: string;
  description?: string;
  rules?: string[];
  children: ReactNode;
}

export function GameLayout({ title, description, rules, children }: GameLayoutProps) {
  const [showRules, setShowRules] = useState(false)
  
  const gameInfo = GAMES.find(g => g.name === title)
  const displayRules = rules || gameInfo?.rules
  const displayDesc = description || gameInfo?.description

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pop-in">
      <div className="flex items-center justify-between mb-2">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full font-bold"
        >
          <ArrowLeft size={16} />
          All games
        </Link>
        
        {displayRules && displayRules.length > 0 && (
          <button 
            onClick={() => setShowRules(!showRules)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${showRules ? 'bg-amber-400 text-gray-950 border-amber-300 shadow-lg shadow-amber-500/20' : 'text-gray-200 bg-white/5 hover:bg-white/10 border-white/10'}`}
          >
            <Info size={16} />
            {showRules ? 'Hide rules' : '✨ How to Play'}
          </button>
        )}
      </div>

      <div className="text-center mb-2">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-300/80 mb-2">🎮 Klay arcade</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight text-glow">{title}</h1>
        {displayDesc && <p className="text-gray-300 font-medium max-w-xl mx-auto">{displayDesc}</p>}
      </div>

      {showRules && displayRules && (
        <div className="bg-gradient-to-br from-fuchsia-500/15 to-cyan-500/10 border border-white/15 rounded-3xl p-5 mb-2 shadow-xl animate-pop-in">
          <h3 className="text-amber-300 font-black mb-3 flex items-center gap-2">
            <Info size={18} /> How to play
          </h3>
          <ul className="space-y-2 text-gray-100">
            {displayRules.map((rule, idx) => (
              <li key={idx} className="flex gap-3 text-sm md:text-base font-medium">
                <span className="w-7 h-7 shrink-0 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-amber-300 font-black text-sm">{idx + 1}</span>
                <span className="pt-1">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative">
        {/* Colorful blur effect behind the game */}
        {gameInfo?.gradientClass && (
          <div className={`absolute -inset-2 rounded-[2.5rem] blur-2xl opacity-40 bg-gradient-to-br ${gameInfo.gradientClass}`} />
        )}
        
        <div className="relative bg-[#0d0d24]/90 backdrop-blur-xl border border-white/15 rounded-[2rem] p-5 md:p-8 shadow-2xl overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="relative">{children}</div>
        </div>
      </div>
    </div>
  )
}
