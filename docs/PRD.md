# Klay — Product Requirements Document (PRD)

## 1. Product Overview
Product name: Klay
Klay is a lightweight browser-based gaming website where users can instantly play simple, polished games without downloading anything or creating an account.
Core principle: "Open Klay → Pick a game → Play immediately."
Version 1 should focus on proving the core experience, not building a large gaming platform.

## 2. V1 Goal
Build and deploy a production-ready V1 of Klay containing:
- A clean homepage
- 6 playable browser games
- Individual game pages
- Local high-score persistence
- Responsive desktop/mobile UI
- Simple navigation
- Consistent game UI
- Supabase project configured for future backend functionality
- Vercel deployment

Do NOT build authentication, multiplayer, global leaderboards, payments, ads, or other advanced features in V1.

## 3. V1 Games
Implement exactly these six games:
1. Reaction Test
2. Higher or Lower
3. Number Rush
4. Memory Match
5. Tic-Tac-Toe
6. Typing Race

## 4. Homepage
The homepage is the primary entry point.
- Header: Klay brand, Home, Games navigation.
- Hero: "Klay - Tiny games. Instant play. Pick a game and start."
- Game Grid: Display all six games as cards with Name, Description, Category, Play button.

## 5. Game Pages
Every game must use a consistent layout.
Structure:
- Back to Klay
- Game title
- Game area
- Score/timer/status
- Restart control

Create a reusable GameLayout component.

## 6. Routing
Use client-side routing.
Routes: `/`, `/reaction`, `/higher-lower`, `/number-rush`, `/memory`, `/tic-tac-toe`, `/typing`.

## 7. Score Persistence
Use browser localStorage.
Keys: `klay_reaction_best`, `klay_higher_lower_best`, `klay_number_rush_best`, `klay_memory_best`, `klay_typing_best`.

## 8. Game Data Architecture
Centralized game configuration. Homepage should render GameCard components from this configuration.

## 9. Component Architecture
Use a clean reusable component structure.

## 10. Visual Design
Clean, minimal, fast, playful, modern, spacious, strong typography, rounded cards, subtle animations.
Create a consistent design system (colors, typography, spacing).

## 11. Responsive Design
Mobile is a first-class experience. Game controls must be large enough for touch interaction.

## 12. Animations
Subtle animations (card flip, button press, correct/wrong feedback, etc).

## 13. Accessibility
Buttons accessible, input labels, focus states, good contrast, touch targets.

## 14. Error Handling
No browser alert() dialogs. Inline visual feedback.

## 15. Technology Stack
React, Vite, TypeScript, Tailwind CSS, React Router. Supabase client for future. Vercel deployment.

## 16-23. See Original PRD for more details on Supabase, Environment Variables, Performance, Future Scope, DoD, and Success Metrics.
