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
