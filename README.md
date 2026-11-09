# Klay

Klay is a browser-based gaming playground for simple games.

## Tech Stack
- React
- Vite
- TypeScript
- React Router
- Tailwind CSS
- Supabase (for future features like auth, leaderboards)

## Local Setup
1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in the Supabase credentials
4. Run `npm run dev` to start the development server

## Environment Variables
- `VITE_SUPABASE_URL`: The URL of your Supabase project
- `VITE_SUPABASE_ANON_KEY`: The anonymous API key for your Supabase project

## Available Commands
- `npm run dev`: Starts the development server
- `npm run build`: Creates a production build
- `npm run preview`: Previews the production build locally

## Deployment
This project is configured to be deployed on Vercel. Connect the GitHub repository to a new Vercel project and it will automatically deploy on pushes to the `main` branch. Ensure you configure the Vercel project as a Single Page Application (SPA) if you need manual overrides, although Vite + Vercel usually handles this seamlessly. Add your environment variables in the Vercel dashboard.

## Current V1 Game List
- Reaction
- Higher/Lower
- Number Rush
- Memory
- Tic-Tac-Toe
- Typing

## Bounce

Open `/bounce` or choose **Bounce** from the game catalog.
This classic arcade title is an authentic browser-native homage inspired by early 2000s Nokia mobile gaming (featuring ring collection, locked exit gates, spikes, water buoyancy, checkpoints, and classic keypad cheats like `787898` and `#` for god mode).

**Product-scope note:**
This implementation focuses on faithful arcade gameplay mechanics, physics, and keypad navigation. It does not claim pixel-perfect or reverse-engineered visual fidelity to any specific proprietary "Legendary" edition or commercial remaster without an approved reference asset pack.

Progression, lives, checkpoints, fail states, audio toggles, responsive viewports, and cheat codes are continuously verified by automated regression tests in `tests/bounce-test.py`.

## Play experience

Every game opens in a screen-filling play view. Boards automatically fit phones,
landscape screens, and desktop. The toolbar offers help, pause, optional sound,
and browser fullscreen. Help and background tabs pause game clocks. Results open
in a dialog above the board; replay starts a fresh game. Reduced-motion preferences
are respected. Run `tests/game-viewport.py` with Playwright against a running preview
(`GAME_BASE_URL` overrides the default local URL).
