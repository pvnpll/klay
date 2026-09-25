import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface GameCardProps {
  title: string;
  description: string;
  path: string;
  Icon: LucideIcon;
  colorClass: string;
  gradientClass?: string;
}

export function GameCard({ title, description, path, Icon, colorClass, gradientClass }: GameCardProps) {
  return (
    <Link 
      to={path}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-gray-900/40 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-white/10"
    >
      {/* Glow effect in background */}
      {gradientClass && (
        <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${gradientClass}`} />
      )}
      
      <div className="relative z-10">
        <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${colorClass} bg-opacity-10 shadow-lg shadow-black/20`}>
          <Icon className={colorClass.split(' ')[0]} size={28} />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-white tracking-tight">{title}</h3>
        <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors font-medium">{description}</p>
      </div>
    </Link>
  )
}
