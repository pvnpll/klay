import { Outlet, Link } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-[#070714] text-gray-100 flex flex-col selection:bg-fuchsia-500/40 overflow-x-hidden">
      {/* playful background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-4s' }} />
      </div>
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tight hover:scale-105 active:scale-95 transition-transform">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/30 rotate-3">
              <Gamepad2 size={22} className="text-white" />
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-fuchsia-400 to-cyan-300">
              Klay
            </span>
            <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-widest bg-white/10 border border-white/10 rounded-full px-2 py-1 text-white/70">
              arcade
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/" className="text-sm text-gray-300 hover:text-white transition-colors font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full">🎮 All Games</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 relative z-10">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-black/40 p-6 text-center text-gray-400 text-sm relative z-10">
        <p className="font-bold">🕹️ Klay Playground — pick a game, beat your best, have fun!</p>
        <p className="text-gray-500 mt-1">&copy; {new Date().getFullYear()} Klay. Made for instant play.</p>
      </footer>
    </div>
  )
}

export default App
