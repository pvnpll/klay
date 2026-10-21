export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory'

export type VehicleType = 'player' | 'sedan' | 'cab' | 'truck' | 'rival' | 'police'

export interface Vehicle {
  id: number
  type: VehicleType
  x: number
  y: number
  speed: number
  targetLane: number
  width: number
  height: number
  color: string
  isBusted?: boolean
  sirenState?: number
}

export interface RoadPickup {
  id: number
  type: 'nitro' | 'cash'
  x: number
  y: number
  lane: number
  collected: boolean
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
