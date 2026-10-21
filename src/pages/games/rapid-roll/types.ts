export type GameState = 'title' | 'playing' | 'paused' | 'gameover'

export type PlatformType = 'normal' | 'spikes' | 'conveyor_left' | 'conveyor_right' | 'bouncy' | 'collapsing'

export interface Platform {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: PlatformType
  stepped: boolean
  collapsed?: boolean
  collapseTimer?: number
  hasHeart?: boolean
  hasStar?: boolean
}

export interface PlayerBall {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  lives: number
  maxLives: number
  invulnerableTime: number
  isOnPlatform: boolean
  activePlatformId: number | null
  rotation: number
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
