export type GameState = 'title' | 'playing' | 'paused' | 'rewinding' | 'gameover' | 'levelclear' | 'victory'

export type PrinceAction =
  | 'idle'
  | 'run'
  | 'jump_up'
  | 'jump_forward'
  | 'fall'
  | 'ledge_hang'
  | 'attack1'
  | 'attack2'
  | 'attack3'
  | 'roll'
  | 'hit'
  | 'dead'

export interface PlayerHistoryFrame {
  x: number
  y: number
  vx: number
  vy: number
  facing: 'left' | 'right'
  action: PrinceAction
  animFrame: number
  health: number
  sandOrbs: number
}

export interface PlayerState {
  x: number
  y: number
  vx: number
  vy: number
  facing: 'left' | 'right'
  action: PrinceAction
  animTime: number
  animFrame: number
  width: number
  height: number
  health: number
  maxHealth: number
  sandOrbs: number
  maxSandOrbs: number
  isGrounded: boolean
  isLedgeHanging: boolean
  ledgeX: number
  ledgeY: number
  invulnerableTime: number
  attackCooldown: number
  comboStep: number
  comboTimer: number
  rollTime: number
  waterFrozen: boolean
  waterFreezeTimer: number
}

export interface Enemy {
  id: number
  type: 'warrior' | 'brute' | 'captain'
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  facing: 'left' | 'right'
  action: 'patrol' | 'alert' | 'attack' | 'hit' | 'dead'
  animTime: number
  animFrame: number
  hp: number
  maxHp: number
  patrolLeft: number
  patrolRight: number
  attackCooldown: number
  scoreValue: number
}

export interface BreakablePot {
  id: number
  x: number
  y: number
  broken: boolean
  drop: 'health' | 'sand' | 'points'
}

export interface Trap {
  id: number
  type: 'spikes' | 'saw' | 'pendulum' | 'falling_block'
  x: number
  y: number
  width: number
  height: number
  state: number // Phase or position
  timer: number
  active: boolean
  startX?: number
  endX?: number
  speed?: number
}

export interface WaterSpout {
  id: number
  x: number
  y: number
  width: number
  height: number
  frozen: boolean
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

export interface LevelData {
  id: number
  name: string
  subtitle: string
  width: number
  height: number
  map: number[][] // 0 = empty, 1 = stone floor, 2 = stone wall, 3 = column, 4 = decorative arch, 5 = spike floor, 6 = water
  playerStart: { x: number; y: number }
  exitGate: { x: number; y: number; width: number; height: number }
  enemies: Omit<Enemy, 'id' | 'action' | 'animTime' | 'animFrame'>[]
  pots: Omit<BreakablePot, 'id' | 'broken'>[]
  traps: Omit<Trap, 'id' | 'state' | 'timer' | 'active'>[]
  waterSpouts: Omit<WaterSpout, 'id' | 'frozen'>[]
}
