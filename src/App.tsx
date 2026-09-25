import { Outlet, Link } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-950 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
            <Gamepad2 size={28} />
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
