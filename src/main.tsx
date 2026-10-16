import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Home from './pages/Home.tsx'
const FallingTiles = lazy(() => import('./pages/games/FallingTiles.tsx'))
const NumberRush = lazy(() => import('./pages/games/NumberRush.tsx'))
const Memory = lazy(() => import('./pages/games/Memory.tsx'))
const TicTacToe = lazy(() => import('./pages/games/TicTacToe.tsx'))
const Typing = lazy(() => import('./pages/games/Typing.tsx'))
const Snake = lazy(() => import('./pages/games/Snake.tsx'))
const WordGuess = lazy(() => import('./pages/games/WordGuess.tsx'))
const ChessGame = lazy(() => import('./pages/games/ChessGame.tsx'))
const Game2048 = lazy(() => import('./pages/games/Game2048.tsx'))
const TargetClick = lazy(() => import('./pages/games/TargetClick.tsx'))
const Sudoku = lazy(() => import('./pages/games/Sudoku.tsx'))
const PerfectTiming = lazy(() => import('./pages/games/PerfectTiming.tsx'))
const OneSecond = lazy(() => import('./pages/games/OneSecond.tsx'))
const MentalMath = lazy(() => import('./pages/games/MentalMath.tsx'))
const DontTouchRed = lazy(() => import('./pages/games/DontTouchRed.tsx'))
const GridMemory = lazy(() => import('./pages/games/GridMemory.tsx'))
const RiskIt = lazy(() => import('./pages/games/RiskIt.tsx'))
const OddOneOut = lazy(() => import('./pages/games/OddOneOut.tsx'))
const Sequence = lazy(() => import('./pages/games/Sequence.tsx'))
const StroopTest = lazy(() => import('./pages/games/StroopTest.tsx'))
const Breakout = lazy(() => import('./pages/games/Breakout.tsx'))
const Pong = lazy(() => import('./pages/games/Pong.tsx'))
const Stack = lazy(() => import('./pages/games/Stack.tsx'))
const ConnectFour = lazy(() => import('./pages/games/ConnectFour.tsx'))
const DotsAndBoxes = lazy(() => import('./pages/games/DotsAndBoxes.tsx'))
const ReactionDuel = lazy(() => import('./pages/games/ReactionDuel.tsx'))
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="p-12 text-center text-white" role="status">Loading game…</div>}>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="falling-tiles" element={<FallingTiles />} />
          <Route path="number-rush" element={<NumberRush />} />
          <Route path="memory" element={<Memory />} />
          <Route path="tic-tac-toe" element={<TicTacToe />} />
          <Route path="typing" element={<Typing />} />
          <Route path="snake" element={<Snake />} />
          <Route path="word-guess" element={<WordGuess />} />
          <Route path="chess" element={<ChessGame />} />
          <Route path="2048" element={<Game2048 />} />
          <Route path="target-click" element={<TargetClick />} />
          <Route path="sudoku" element={<Sudoku />} />
          <Route path="perfect-timing" element={<PerfectTiming />} />
          <Route path="one-second" element={<OneSecond />} />
          <Route path="mental-math" element={<MentalMath />} />
        <Route path="dont-touch-red" element={<DontTouchRed />} />
          <Route path="grid-memory" element={<GridMemory />} />
          <Route path="risk-it" element={<RiskIt />} />
        <Route path="odd-one-out" element={<OddOneOut />} />
          <Route path="sequence" element={<Sequence />} />
          <Route path="stroop-test" element={<StroopTest />} />
        <Route path="breakout" element={<Breakout />} />
          <Route path="pong" element={<Pong />} />
          <Route path="stack" element={<Stack />} />
        <Route path="connect-four" element={<ConnectFour />} />
          <Route path="dots-and-boxes" element={<DotsAndBoxes />} />
          <Route path="reaction-duel" element={<ReactionDuel />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
