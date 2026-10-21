export type GameState = 'title' | 'playing' | 'paused' | 'levelclear' | 'gameover' | 'victory'

export type TileType =
  | 'empty'
  | 'wall'
  | 'dirt'
  | 'boulder'
  | 'ruby'
  | 'diamond'
  | 'snake'
  | 'exit'
  | 'chest'

export interface LevelMap {
  width: number
  height: number
  diamondsRequired: number
  tiles: TileType[][]
  playerStart: { x: number; y: number }
  name: string
}

export interface PlayerExplorer {
  gridX: number
  gridY: number
  x: number
  y: number
  facing: 'up' | 'down' | 'left' | 'right'
  moving: boolean
  moveProgress: number
  diamondsCollected: number
  diamondsNeeded: number
  lives: number
  maxLives: number
  invulnerableTime: number
  pushing: boolean
}

export interface SnakeEnemy {
  id: number
  gridX: number
  gridY: number
  x: number
  y: number
  facing: 'left' | 'right'
  alive: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}
