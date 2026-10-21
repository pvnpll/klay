export const TILE_SIZE = 20

export const TILE = {
  EMPTY: 0,
  BRICK: 1,
  STONE: 2,
  SPIKE_UP: 3,
  SPIKE_DOWN: 4,
  SPIKE_LEFT: 5,
  SPIKE_RIGHT: 6,
  TRAMPOLINE: 7,
  WATER: 8,
  PUMP_EXPAND: 9,
  PUMP_DEFLATE: 10,
  CHECKPOINT: 11,
  EXIT: 12,
  MINE: 13,
} as const

export type TileType = typeof TILE[keyof typeof TILE]

export interface Ring {
  id: number
  x: number // pixel center
  y: number
  radius: number
  collected: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export type BallSize = 'normal' | 'big' | 'small'

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  rotation: number
  sizeType: BallSize
  grounded: boolean
  inWater: boolean
  isPopping: boolean
  popTimer: number
}

export interface LevelData {
  id: number
  name: string
  width: number
  height: number
  tiles: number[][]
  rings: { x: number; y: number }[]
  startX: number
  startY: number
  exitX: number
  exitY: number
}

export type GameMode = 'title' | 'playing' | 'paused' | 'level_clear' | 'gameover' | 'won'
