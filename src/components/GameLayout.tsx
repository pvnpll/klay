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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors bg-gray-900/50 hover:bg-gray-900 px-4 py-2 rounded-lg"
        >
          <ArrowLeft size={18} />
          Back to Klay
        </Link>
        
        {displayRules && displayRules.length > 0 && (
          <button 
            onClick={() => setShowRules(!showRules)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showRules ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-emerald-400 bg-gray-900/50 hover:bg-gray-900'}`}
          >
            <Info size={18} />
            How to Play
          </button>
        )}
      </div>

      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{title}</h1>
        {displayDesc && <p className="text-gray-400">{displayDesc}</p>}
      </div>

      {showRules && displayRules && (
        <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-5 mb-6 shadow-inner animate-in fade-in slide-in-from-top-2">
          <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
            <Info size={18} /> Rules
          </h3>
          <ul className="space-y-2 text-gray-300">
            {displayRules.map((rule, idx) => (
              <li key={idx} className="flex gap-3 text-sm md:text-base">
                <span className="text-emerald-500 font-bold">{idx + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
        {children}
      </div>
    </div>
  )
}
