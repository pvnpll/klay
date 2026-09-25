import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface GameCardProps {
  title: string;
  description: string;
  path: string;
  Icon: LucideIcon;
  colorClass: string;
}

export function GameCard({ title, description, path, Icon, colorClass }: GameCardProps) {
  return (
    <Link 
      to={path}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-6 hover:bg-gray-800/80 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-gray-700"
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={colorClass.replace('bg-', 'text-').replace('text-opacity-10', '')} size={24} />
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-100 group-hover:text-white">{title}</h3>
      <p className="text-sm text-gray-400 group-hover:text-gray-300">{description}</p>
    </Link>
  )
}
