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

## Automated Testing & Browser Regressions (KL-202)

Klay includes an automated browser test suite across smoke, viewports, game mechanics, and Nokia retro emulation.

### Prerequisites

1. **Python 3 with Playwright**:
   ```bash
   python3 -m venv venv
   ./venv/bin/pip install playwright
   ./venv/bin/playwright install chromium
   ```
2. **Node.js**: standard v18+ installation.

### Running Tests

The test runner handles automatic Vite preview startup with readiness polling (no fixed sleeps), executes selected suites, saves screenshots to isolated, git-ignored directories (`test-results/`), and cleanly tears down local processes. External servers are never killed.

```bash
# Run all test suites against an auto-spawned preview server
npm test

# Run only smoke & viewport checks
npm test -- --suite=smoke

# Run specific game suites
npm test -- --suite=bounce
npm test -- --suite=classics
npm test -- --suite=prince
npm test -- --suite=space

# Run against a running dev or preview server (external servers are preserved)
npm test -- --base-url=http://127.0.0.1:5173

# Filter specific tests by name or path
npm test -- --filter=pop
```

Screenshots and test output artifacts are saved to `test-results/run-<timestamp>/` (with a `test-results/latest` pointer) and are automatically ignored by git.


## Play experience

Every game opens in a screen-filling play view. Boards automatically fit phones,
landscape screens, and desktop. The toolbar offers help, pause, optional sound,
and browser fullscreen. Help and background tabs pause game clocks. Results open
in a dialog above the board; replay starts a fresh game. Reduced-motion preferences
are respected. Run `tests/game-viewport.py` with Playwright against a running preview
(`GAME_BASE_URL` overrides the default local URL).

## Hanuman: Son of the Wind

Open `/hanuman` or choose **Hanuman: Son of the Wind** from the game catalog.
This original, browser-native Three.js prototype includes a Himalayan temple
courtyard, an original procedural Hanuman character, animated movement, a
three-strike gada combo, guarding, and a divine leap with area damage on landing.
Collect mangoes for healing and storm energy, and smash treasure pots with the gada.
Defeat five shadow guardians and awaken three golden seals, then face the Storm
Guardian. Jump over its expanding pink shockwaves and defeat it to finish the trial.
Hanuman has a playful expressive face, a swaying tail, and a large decorated gada.
Successful strikes build a timed streak that increases points; mangoes and strikes
charge Gada Storm, a powerful spinning area attack.

- **WASD / arrows:** move; **Shift:** sprint; **Space:** jump.
- **J:** strike; **C (hold):** guard; **K:** divine leap (8-second cooldown).
- **L:** unleash Gada Storm when its energy meter is full.
- **F:** awaken a nearby seal after defeating its guardians. The last seal restores
  vitality and fully charges Gada Storm for the final battle.
- **Q / E or drag:** orbit camera; **Escape:** pause / resume.
- Touch devices display movement and action buttons. Hidden tabs pause the trial.

Requires WebGL 2 with hardware acceleration. All models and animations are
procedurally authored here; this is a stylized gameplay foundation, not a finished
cinematic character or motion-capture production. The 3D engine loads only on the
Hanuman route. No external art downloads or backend credentials are required.

Browser regression: with Playwright and its Chromium browser installed, run
`node tests/hanuman-test.cjs` against the dev server. `GAME_BASE_URL` overrides the
URL; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing Chromium installation.
The test covers movement, jumping, pause, all five enemies, all three seals,
mango pickups, breakable pots, Gada Storm, the final boss, victory, restart, the
mobile viewport, catalog integration, and JavaScript errors.
