import { useLocation } from 'react-router-dom'
export default function MovedGame() {
  const { pathname } = useLocation()
  return <div className="text-center py-16 max-w-lg mx-auto"><h1 className="text-4xl font-black mb-4">This game is now on Kupple</h1><p className="text-gray-300 mb-8">Our games for two have a new home. Play Chess, Tic-Tac-Toe, Connect Four, Dots and Boxes, and Reaction Duel on Kupple.</p><a className="inline-block px-6 py-3 rounded-full bg-cyan-300 text-gray-950 font-black" href={`https://kupple.pvnpll.in${pathname}`}>Play on Kupple ↗</a></div>
}
