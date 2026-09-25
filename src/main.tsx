import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Home from './pages/Home.tsx'
import FallingTiles from './pages/games/FallingTiles.tsx'
import NumberRush from './pages/games/NumberRush.tsx'
import Memory from './pages/games/Memory.tsx'
import TicTacToe from './pages/games/TicTacToe.tsx'
import Typing from './pages/games/Typing.tsx'
import Snake from './pages/games/Snake.tsx'
import WordGuess from './pages/games/WordGuess.tsx'
import ChessGame from './pages/games/ChessGame.tsx'
import Game2048 from './pages/games/Game2048.tsx'
import TargetClick from './pages/games/TargetClick.tsx'
import Sudoku from './pages/games/Sudoku.tsx'
import PerfectTiming from './pages/games/PerfectTiming.tsx'
import OneSecond from './pages/games/OneSecond.tsx'
import MentalMath from './pages/games/MentalMath.tsx'
import DontTouchRed from './pages/games/DontTouchRed.tsx'
import GridMemory from './pages/games/GridMemory.tsx'
import RiskIt from './pages/games/RiskIt.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
