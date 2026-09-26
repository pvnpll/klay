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
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:rotate-[0.5deg] hover:shadow-2xl hover:border-white/20 hover:bg-white/[0.07]"
    >
      {/* Glow effect in background */}
      {gradientClass && (
        <div className={`absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${gradientClass}`} />
      )}
      <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
      
      <div className="relative z-10">
        <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${colorClass} shadow-lg shadow-black/30 rotate-3 group-hover:rotate-12 group-hover:scale-110 transition-transform`}>
          <Icon className={colorClass.split(' ')[0]} size={28} />
        </div>
        <h3 className="mb-2 text-2xl font-black text-white tracking-tight group-hover:text-glow">{title}</h3>
        <p className="text-sm text-gray-300 group-hover:text-white transition-colors font-medium leading-relaxed">{description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-white/60 group-hover:text-white group-hover:gap-2 transition-all">
          ▶ Play now
        </span>
      </div>
    </Link>
  )
}
