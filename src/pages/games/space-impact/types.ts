export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'levelclear' | 'victory'

export type LcdTheme = 'green' | 'color' | 'mono'

export type WeaponType = 'blaster' | 'rocket' | 'laser' | 'bomb'

export type SpecialWeaponType = 'rocket' | 'laser' | 'bomb'

export interface PlayerState {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  shields: number // Max 4 bars
  maxShields: number
  lives: number
  invulnerableTime: number
  firing: boolean
  blasterLevel: number // 1: single, 2: dual, 3: spread
  selectedSpecial: SpecialWeaponType
  ammo: {
    rocket: number
    laser: number
    bomb: number
  }
}

export type EnemyType =
  | 'scout' // Wave pattern drone (1 HP)
  | 'diver' // Fast straight charger (2 HP)
  | 'cruiser' // Gunship that stops & fires plasma (4 HP)
  | 'mine' // Drifting spiky obstacle (5 HP)
  | 'cargo' // Power-up pod (2 HP)
  | 'worm' // Sinusoidal undulating serpent (6 HP)
  | 'boss1' // Level 1 Megacrab (80 HP)
  | 'boss2' // Level 2 Mecha-Skull (120 HP)
  | 'boss3' // Level 3 Alien Queen (160 HP)

export interface Enemy {
  id: number
  type: EnemyType
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  hp: number
  maxHp: number
  scoreValue: number
  timeAlive: number
  initialY: number
  shootCooldown: number
  patternPhase?: number
  isBoss?: boolean
}

export interface Bullet {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  damage: number
  isPlayer: boolean
  type: 'blaster' | 'rocket' | 'laser' | 'bomb' | 'plasma'
  life: number
  homing?: boolean
}

export type PowerupType = 'shield' | 'rocket' | 'laser' | 'bomb' | 'upgrade' | 'points'

export interface Powerup {
  id: number
  type: PowerupType
  x: number
  y: number
  vx: number
  width: number
  height: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color?: string
}

export interface Star {
  x: number
  y: number
  speed: number
  size: number
  brightness: number
}

export interface WaveSpawn {
  time: number // Time in seconds within level
  type: EnemyType
  y: number // Y position or -1 for random
  count?: number
  interval?: number
}

export interface LevelConfig {
  id: number
  name: string
  duration: number // Duration in seconds before boss spawns
  bossType: EnemyType
  spawns: WaveSpawn[]
}
