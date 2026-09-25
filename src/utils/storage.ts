import type { GameMetadata } from '../data/games'

export interface GameScore {
  score: number
  date: string
}

export interface UserStats {
  bests: Record<string, number> // map of gameId to best score (or best time)
  playCounts: Record<string, number>
  recentlyPlayed: string[] // array of gameIds
  lastPlayedDate?: string
}

const STORAGE_KEY = 'klay_user_stats'

export const getStats = (): UserStats => {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error("Failed to parse Klay stats")
    }
  }
  return {
    bests: {},
    playCounts: {},
    recentlyPlayed: []
  }
}

export const saveScore = (game: GameMetadata, score: number) => {
  const stats = getStats()
  
  // Update play counts
  stats.playCounts[game.id] = (stats.playCounts[game.id] || 0) + 1
  
  // Update recently played (push to front, remove duplicates, keep last 10)
  stats.recentlyPlayed = [game.id, ...stats.recentlyPlayed.filter(id => id !== game.id)].slice(0, 10)
  stats.lastPlayedDate = new Date().toISOString()
  
  // Update bests depending on scoreType
  const currentBest = stats.bests[game.id]
  let isNewBest = false
  
  if (currentBest === undefined) {
    isNewBest = true
  } else {
    if (game.scoreType === 'lower-is-better' || game.scoreType === 'time') {
      if (score < currentBest) isNewBest = true
    } else if (game.scoreType === 'score' || game.scoreType === 'accuracy') {
      if (score > currentBest) isNewBest = true
    }
  }
  
  if (isNewBest && game.scoreType !== 'win-loss') {
    stats.bests[game.id] = score
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  
  return {
    isNewBest,
    bestScore: stats.bests[game.id] || score
  }
}
