import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Home from './pages/Home.tsx'
import Reaction from './pages/games/Reaction.tsx'
import HigherLower from './pages/games/HigherLower.tsx'
import NumberRush from './pages/games/NumberRush.tsx'
import Memory from './pages/games/Memory.tsx'
import TicTacToe from './pages/games/TicTacToe.tsx'
import Typing from './pages/games/Typing.tsx'
import Snake from './pages/games/Snake.tsx'
import WordGuess from './pages/games/WordGuess.tsx'
import ChessGame from './pages/games/ChessGame.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="reaction" element={<Reaction />} />
          <Route path="higher-lower" element={<HigherLower />} />
          <Route path="number-rush" element={<NumberRush />} />
          <Route path="memory" element={<Memory />} />
          <Route path="tic-tac-toe" element={<TicTacToe />} />
          <Route path="typing" element={<Typing />} />
          <Route path="snake" element={<Snake />} />
          <Route path="word-guess" element={<WordGuess />} />
          <Route path="chess" element={<ChessGame />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
