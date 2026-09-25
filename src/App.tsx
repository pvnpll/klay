import { Outlet, Link } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-900 to-black text-gray-100 flex flex-col selection:bg-emerald-500/30">
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all hover:scale-105 active:scale-95">
            <Gamepad2 size={28} className="text-emerald-400" />
            Klay
          </Link>
          <nav>
            <Link to="/" className="text-gray-400 hover:text-white transition-colors font-medium">Games</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-800 bg-gray-950 p-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Klay Playground. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
