import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface GameLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function GameLayout({ title, description, children }: GameLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors bg-gray-900/50 hover:bg-gray-900 px-4 py-2 rounded-lg"
        >
          <ArrowLeft size={18} />
          Back to Klay
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{title}</h1>
        {description && <p className="text-gray-400">{description}</p>}
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
        {children}
      </div>
    </div>
  )
}
