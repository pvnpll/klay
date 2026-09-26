# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-26

### Added
- Complete arcade visual redesign across all 26 games with neon gradients, glowing focus borders, vibrant stat pills, and playful 3D button interactions.
- Today's Challenge hero card on Homepage with glowing badges, completion counters, and animated highlights.
- Playful victory and status indicators (`animate-pop-in`, particle confetti, customized feedback messages per game).
- 2-Player UI modernization for `ConnectFour`, `DotsAndBoxes`, `ReactionDuel`, and `TicTacToe` with dual-color player indicators.

### Fixed
- Stale React closure bugs in high-frequency animation loops (`PerfectTiming`, `RiskIt`, `DontTouchRed`, `ReactionDuel`, `OneSecond`).
- Ghost clicks and race conditions after game over by synchronizing animation callbacks with state and score refs.
- Timer teardown and resource leaks on game resets and page navigation.

## [1.0.0] - 2026-09-25

### Added
- Complete React + Vite + TypeScript local development setup.
- Tailwind CSS v4 integration.
- React Router configuration for SPA routing (`vercel.json` included for deployment).
- Centralized game data architecture (`src/data/games.ts`).
- Reusable UI components (`GameCard.tsx`, `GameLayout.tsx`).
- Local storage utilities (`src/lib/storage.ts`) for saving high scores.
- Supabase client initialization (`src/lib/supabase.ts`) for future expandability.
- Added 6 playable games as per V1 PRD:
  - **Reaction Test**: Reflex-based game tracking milliseconds.
  - **Higher or Lower**: 1-100 card prediction game.
  - **Number Rush**: Speed clicking 1-20 sequence.
  - **Memory Match**: Classic 4-pair memory game with 3D flip animations.
  - **Tic-Tac-Toe**: PvP and PvC (vs Easy Computer).
  - **Typing Race**: Live typing speed and accuracy tracker using predefined quotes.
- Full responsive design and minimal modern UI.
- Comprehensive PRD documentation in `docs/PRD.md`.

