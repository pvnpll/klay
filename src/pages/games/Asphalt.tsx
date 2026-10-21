import { useEffect, useRef, useState, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { NokiaPhone } from '../../components/NokiaPhone'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import { asphaltSound } from './asphalt/sound'
import {
  SPRITE_PLAYER_CAR,
  SPRITE_SEDAN,
  SPRITE_TAXI,
  SPRITE_POLICE,
  SPRITE_TRUCK,
  SPRITE_NITRO_BOTTLE,
  SPRITE_CASH,
  drawPixelSprite,
} from './asphalt/sprites'
import type { GameState, Vehicle, RoadPickup, Particle, VehicleType } from './asphalt/types'

export const SCREEN_WIDTH = 258
export const SCREEN_HEIGHT = 248
export const HUD_HEIGHT = 22
export const ROAD_LEFT = 38
export const ROAD_RIGHT = SCREEN_WIDTH - 38
export const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT
export const LANE_WIDTH = ROAD_WIDTH / 3

export default function Asphalt() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<GameState>('title')
  const [score, setScore] = useState<number>(0)
  const [, setSpeedKmH] = useState<number>(0)
  const [, setNitro] = useState<number>(60)
  const [isNitroActive, setIsNitroActive] = useState<boolean>(false)
  const [isGodMode, setIsGodMode] = useState<boolean>(false)

  const [bestScore, setBestScore] = useState<number>(() => {
    return getStats().bests['asphalt'] || 0
  })
  const [isNewBest, setIsNewBest] = useState<boolean>(false)

  // Mutable Game References for High-Performance 60 FPS Loop
  const gameStateRef = useRef<GameState>('title')
  const scoreRef = useRef<number>(0)
  const speedRef = useRef<number>(0) // 0 to 240 km/h
  const nitroRef = useRef<number>(60)
  const isNitroActiveRef = useRef<boolean>(false)
  const isGodModeRef = useRef<boolean>(false)

  // Player Car State
  const playerRef = useRef({
    x: SCREEN_WIDTH / 2 - 8,
    y: SCREEN_HEIGHT - 56,
    width: 16,
    height: 24,
    vx: 0,
    angle: 0,
    health: 3,
    maxHealth: 3,
    invulnerableTime: 0,
  })

  // World & Entities
  const roadOffsetRef = useRef<number>(0)
  const vehiclesRef = useRef<Vehicle[]>([])
  const pickupsRef = useRef<RoadPickup[]>([])
  const particlesRef = useRef<Particle[]>([])
  const nextEntityIdRef = useRef<number>(1)
  const cheatSequenceRef = useRef<string>('')
  const nearMissTextRef = useRef<{ text: string; time: number } | null>(null)

  const inputRef = useRef({
    left: false,
    right: false,
    accelerate: false,
    brake: false,
    nitro: false,
  })

  // Sync state refs
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])
  useEffect(() => {
    scoreRef.current = score
  }, [score])
  useEffect(() => {
    isGodModeRef.current = isGodMode
  }, [isGodMode])

  // Spawn visual particles
  const addParticles = useCallback(
    (x: number, y: number, count: number, color: string, speed = 50, size = 2) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const spd = (Math.random() * 0.7 + 0.3) * speed
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 0,
          maxLife: 0.25 + Math.random() * 0.25,
          size: Math.random() > 0.5 ? size : Math.max(1, size - 1),
          color,
        })
      }
    },
    [],
  )

  // Trigger Nitro Boost
  const triggerNitro = useCallback(() => {
    if (nitroRef.current > 15 || isGodModeRef.current) {
      isNitroActiveRef.current = true
      setIsNitroActive(true)
      asphaltSound.playNitro()
      addParticles(playerRef.current.x + 8, playerRef.current.y + 24, 15, '#2ed573', 80, 3)
    }
  }, [addParticles])

  // Start / Reset Game
  const startNewGame = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    speedRef.current = 90
    setSpeedKmH(90)
    nitroRef.current = 60
    setNitro(60)
    isNitroActiveRef.current = false
    setIsNitroActive(false)
    setIsNewBest(false)
    nearMissTextRef.current = null

    playerRef.current = {
      x: SCREEN_WIDTH / 2 - 8,
      y: SCREEN_HEIGHT - 56,
      width: 16,
      height: 24,
      vx: 0,
      angle: 0,
      health: 3,
      maxHealth: 3,
      invulnerableTime: 0,
    }

    // Spawn initial traffic cars
    const initialVehicles: Vehicle[] = []
    const types: VehicleType[] = ['sedan', 'cab', 'truck', 'sedan']
    for (let i = 0; i < 4; i++) {
      const lane = i % 3
      const laneX = ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2 - 8
      initialVehicles.push({
        id: nextEntityIdRef.current++,
        type: types[i],
        x: laneX,
        y: -40 - i * 80,
        speed: 60 + Math.random() * 30,
        targetLane: lane,
        width: types[i] === 'truck' ? 18 : 16,
        height: types[i] === 'truck' ? 32 : 24,
        color: '#fff',
      })
    }

    vehiclesRef.current = initialVehicles
    pickupsRef.current = []
    particlesRef.current = []
    setGameState('playing')
    asphaltSound.playKeyClick()
  }, [])

  // Handle Nokia Keypad Cheats (787898 or 1989 for God Mode)
  const handleKeyCheat = useCallback(
    (key: string) => {
      cheatSequenceRef.current = (cheatSequenceRef.current + key).slice(-6)

      if (cheatSequenceRef.current === '787898' || cheatSequenceRef.current.endsWith('1989')) {
        setIsGodMode(prev => {
          const next = !prev
          if (next) {
            playerRef.current.health = playerRef.current.maxHealth
            nitroRef.current = 100
            asphaltSound.playVictory()
          }
          return next
        })
        cheatSequenceRef.current = ''
      }

      if (key === '5') triggerNitro()
      if (key === '4') {
        inputRef.current.left = true
        setTimeout(() => {
          inputRef.current.left = false
        }, 150)
      }
      if (key === '6') {
        inputRef.current.right = true
        setTimeout(() => {
          inputRef.current.right = false
        }, 150)
      }
      if (key === '2') {
        if (gameStateRef.current === 'title') startNewGame()
        else {
          inputRef.current.accelerate = true
          setTimeout(() => {
            inputRef.current.accelerate = false
          }, 150)
        }
      }
      if (key === '8') {
        inputRef.current.brake = true
        setTimeout(() => {
          inputRef.current.brake = false
        }, 150)
      }
    },
    [triggerNitro, startNewGame],
  )

  // Hardware/Directional Press
  const handleDirectionPress = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => {
      if (dir === 'left') inputRef.current.left = pressed
      if (dir === 'right') inputRef.current.right = pressed
      if (dir === 'up') {
        inputRef.current.accelerate = pressed
        if (pressed && gameStateRef.current === 'title') startNewGame()
      }
      if (dir === 'down') inputRef.current.brake = pressed
    },
    [startNewGame],
  )

  const handleActionPress = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        if (gameStateRef.current === 'title') startNewGame()
        else triggerNitro()
      }
    },
    [startNewGame, triggerNitro],
  )

  // Direct LCD Touchscreen Handlers
  const handleLcdPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scaleX = SCREEN_WIDTH / rect.width
    const canvasX = (e.clientX - rect.left) * scaleX

    if (gameStateRef.current === 'title' || gameStateRef.current === 'gameover') {
      startNewGame()
      return
    }

    if (canvasX < SCREEN_WIDTH * 0.4) {
      inputRef.current.left = true
      inputRef.current.right = false
    } else if (canvasX > SCREEN_WIDTH * 0.6) {
      inputRef.current.right = true
      inputRef.current.left = false
    } else {
      // Tap center = Nitro
      triggerNitro()
    }
  }

  const handleLcdPointerUp = () => {
    inputRef.current.left = false
    inputRef.current.right = false
    inputRef.current.accelerate = false
    inputRef.current.brake = false
  }

  // Keyboard Shortcuts (Arrow keys, Space, A/D/W/S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault()
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = true
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputRef.current.accelerate = true
        if (gameStateRef.current === 'title') startNewGame()
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') inputRef.current.brake = true
      if (e.key === ' ' || e.key === 'x' || e.key === 'X') {
        if (gameStateRef.current === 'title') startNewGame()
        else triggerNitro()
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState(prev => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = false
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputRef.current.accelerate = false
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') inputRef.current.brake = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startNewGame, triggerNitro])

  // Main 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let lastTime = performance.now()

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05)
      lastTime = currentTime

      const state = gameStateRef.current
      const p = playerRef.current

      // -------------------------------------------------------------
      // 1. VEHICLE DYNAMICS & SIMULATION
      // -------------------------------------------------------------
      if (state === 'playing') {
        // Nitro Boost consumption
        if (isNitroActiveRef.current) {
          if (!isGodModeRef.current) {
            nitroRef.current = Math.max(0, nitroRef.current - dt * 25)
            setNitro(Math.round(nitroRef.current))
            if (nitroRef.current <= 0) {
              isNitroActiveRef.current = false
              setIsNitroActive(false)
            }
          }
        }

        // Acceleration / Deceleration
        const targetMaxSpeed = isNitroActiveRef.current ? 250 : 190
        if (inputRef.current.accelerate || isNitroActiveRef.current) {
          speedRef.current = Math.min(targetMaxSpeed, speedRef.current + dt * 60)
        } else if (inputRef.current.brake) {
          speedRef.current = Math.max(40, speedRef.current - dt * 100)
          asphaltSound.playDrift()
        } else {
          // Coasting speed
          if (speedRef.current > 140) speedRef.current -= dt * 20
          else if (speedRef.current < 130) speedRef.current += dt * 15
        }

        setSpeedKmH(Math.round(speedRef.current))
        asphaltSound.updateEngine(speedRef.current)

        // Road scroll offset
        roadOffsetRef.current = (roadOffsetRef.current + speedRef.current * dt * 3.5) % 36

        // Steering & Drift
        const steerSpeed = isNitroActiveRef.current ? 120 : 140
        if (inputRef.current.left) {
          p.x -= steerSpeed * dt
          p.angle = -0.18
        } else if (inputRef.current.right) {
          p.x += steerSpeed * dt
          p.angle = 0.18
        } else {
          p.angle *= 0.8
        }

        // Keep inside road bounds (curb collision)
        if (p.x < ROAD_LEFT + 2) {
          p.x = ROAD_LEFT + 2
          speedRef.current = Math.max(50, speedRef.current - 40 * dt)
          asphaltSound.playDrift()
        } else if (p.x + p.width > ROAD_RIGHT - 2) {
          p.x = ROAD_RIGHT - 2 - p.width
          speedRef.current = Math.max(50, speedRef.current - 40 * dt)
          asphaltSound.playDrift()
        }

        // Timers
        if (p.invulnerableTime > 0) p.invulnerableTime -= dt

        // Move Traffic Vehicles
        const vehicles = vehiclesRef.current
        for (let i = vehicles.length - 1; i >= 0; i--) {
          const v = vehicles[i]
          // Relative speed (player vs traffic)
          const relSpeed = (speedRef.current - v.speed) * dt * 3.2
          v.y += relSpeed

          // Near Miss Detection (weaving close without crashing)
          const dx = Math.abs(p.x + p.width / 2 - (v.x + v.width / 2))
          const dy = Math.abs(p.y + p.height / 2 - (v.y + v.height / 2))
          if (dx < 20 && dy < 18 && !p.invulnerableTime) {
            scoreRef.current += 5
            nitroRef.current = Math.min(100, nitroRef.current + dt * 10)
            setNitro(Math.round(nitroRef.current))
          }

          // Car-to-Car Collision
          if (
            p.invulnerableTime <= 0 &&
            p.x < v.x + v.width &&
            p.x + p.width > v.x &&
            p.y < v.y + v.height &&
            p.y + p.height > v.y
          ) {
            if (isGodModeRef.current || isNitroActiveRef.current) {
              // Ram traffic away!
              v.y -= 80
              v.x += Math.random() > 0.5 ? 40 : -40
              asphaltSound.playCrash()
              addParticles(v.x + v.width / 2, v.y + v.height / 2, 14, '#ffa502', 80, 2)
              scoreRef.current += 300
              setScore(scoreRef.current)
            } else {
              // Player crashes
              p.health -= 1
              p.invulnerableTime = 1.5
              speedRef.current = 50
              asphaltSound.playCrash()
              addParticles(p.x + p.width / 2, p.y + p.height / 2, 20, '#ff4757', 90, 2)

              if (p.health <= 0) {
                gameStateRef.current = 'gameover'
                setGameState('gameover')
                asphaltSound.playGameOver()
                const currentMeta = GAMES.find(g => g.id === 'asphalt')!
                const isBest = saveScore(currentMeta, scoreRef.current)
                if (isBest) {
                  setBestScore(scoreRef.current)
                  setIsNewBest(true)
                }
              }
            }
          }

          // Remove vehicles far off screen
          if (v.y > SCREEN_HEIGHT + 60 || v.y < -120) {
            vehicles.splice(i, 1)
          }
        }

        // Spawn new traffic ahead
        if (vehicles.length < 5) {
          const lane = Math.floor(Math.random() * 3)
          const laneX = ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2 - 8
          const types: VehicleType[] = ['sedan', 'cab', 'truck', 'police']
          const selectedType = types[Math.floor(Math.random() * types.length)]

          vehicles.push({
            id: nextEntityIdRef.current++,
            type: selectedType,
            x: laneX,
            y: -50,
            speed: 55 + Math.random() * 40,
            targetLane: lane,
            width: selectedType === 'truck' ? 18 : 16,
            height: selectedType === 'truck' ? 32 : 24,
            color: '#fff',
          })
        }

        // Spawn Pickups (Nitro & Cash)
        if (pickupsRef.current.length < 2 && Math.random() < 0.02) {
          const lane = Math.floor(Math.random() * 3)
          const laneX = ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2 - 5
          pickupsRef.current.push({
            id: nextEntityIdRef.current++,
            type: Math.random() < 0.5 ? 'nitro' : 'cash',
            x: laneX,
            y: -30,
            lane,
            collected: false,
          })
        }

        // Update Pickups
        for (let i = pickupsRef.current.length - 1; i >= 0; i--) {
          const pk = pickupsRef.current[i]
          pk.y += speedRef.current * dt * 3.2

          // Check collection
          if (
            !pk.collected &&
            p.x < pk.x + 12 &&
            p.x + p.width > pk.x &&
            p.y < pk.y + 12 &&
            p.y + p.height > pk.y
          ) {
            pk.collected = true
            asphaltSound.playPickup()
            if (pk.type === 'nitro') {
              nitroRef.current = Math.min(100, nitroRef.current + 40)
              setNitro(Math.round(nitroRef.current))
              addParticles(pk.x + 5, pk.y + 5, 10, '#2ed573', 50, 2)
            } else {
              scoreRef.current += 250
              setScore(scoreRef.current)
              addParticles(pk.x + 5, pk.y + 5, 10, '#ffa502', 60, 2)
            }
          }

          if (pk.y > SCREEN_HEIGHT + 30 || pk.collected) {
            pickupsRef.current.splice(i, 1)
          }
        }

        // Score progression with distance
        scoreRef.current += Math.round((speedRef.current / 40) * dt * 25)
        setScore(scoreRef.current)
      }

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i]
        pt.x += pt.vx * dt
        pt.y += pt.vy * dt
        pt.life += dt
        if (pt.life >= pt.maxLife) {
          particlesRef.current.splice(i, 1)
        }
      }

      // -------------------------------------------------------------
      // 2. CANVAS RENDERING
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      // City Background / Skyline Parallax
      ctx.fillStyle = '#0a1128'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      // Distant neon skyscrapers
      ctx.fillStyle = '#1c2541'
      for (let i = 0; i < 7; i++) {
        const bx = i * 40 - 10
        ctx.fillRect(bx, 24, 28, 48)
        // Neon windows
        ctx.fillStyle = '#ff6b81'
        ctx.fillRect(bx + 4, 32, 2, 2)
        ctx.fillRect(bx + 10, 38, 2, 2)
        ctx.fillStyle = '#1c2541'
      }

      // Road Shoulders / Curbs
      ctx.fillStyle = '#2f3542'
      ctx.fillRect(0, HUD_HEIGHT, ROAD_LEFT, SCREEN_HEIGHT - HUD_HEIGHT)
      ctx.fillRect(ROAD_RIGHT, HUD_HEIGHT, SCREEN_WIDTH - ROAD_RIGHT, SCREEN_HEIGHT - HUD_HEIGHT)

      // Red/White Striped Curbs
      const curbH = 18
      const curbOffset = roadOffsetRef.current % curbH
      for (let cy = HUD_HEIGHT - curbH + curbOffset; cy < SCREEN_HEIGHT; cy += curbH) {
        ctx.fillStyle = Math.floor(cy / curbH) % 2 === 0 ? '#ff4757' : '#ffffff'
        ctx.fillRect(ROAD_LEFT - 4, cy, 4, curbH)
        ctx.fillRect(ROAD_RIGHT, cy, 4, curbH)
      }

      // Main Asphalt Highway
      ctx.fillStyle = '#1e272e'
      ctx.fillRect(ROAD_LEFT, HUD_HEIGHT, ROAD_WIDTH, SCREEN_HEIGHT - HUD_HEIGHT)

      // White Dashed Lane Dividers
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.setLineDash([12, 16])
      ctx.lineDashOffset = -roadOffsetRef.current * 1.5

      // Lane 1 divider
      ctx.beginPath()
      ctx.moveTo(ROAD_LEFT + LANE_WIDTH, HUD_HEIGHT)
      ctx.lineTo(ROAD_LEFT + LANE_WIDTH, SCREEN_HEIGHT)
      ctx.stroke()

      // Lane 2 divider
      ctx.beginPath()
      ctx.moveTo(ROAD_LEFT + LANE_WIDTH * 2, HUD_HEIGHT)
      ctx.lineTo(ROAD_LEFT + LANE_WIDTH * 2, SCREEN_HEIGHT)
      ctx.stroke()
      ctx.setLineDash([])

      // Render Pickups (Nitro Bottles & Cash)
      pickupsRef.current.forEach(pk => {
        if (pk.type === 'nitro') {
          drawPixelSprite(ctx, SPRITE_NITRO_BOTTLE, pk.x, pk.y, 1)
        } else {
          drawPixelSprite(ctx, SPRITE_CASH, pk.x, pk.y, 1)
        }
      })

      // Render Traffic Vehicles
      vehiclesRef.current.forEach(v => {
        let sprite = SPRITE_SEDAN
        if (v.type === 'cab') sprite = SPRITE_TAXI
        else if (v.type === 'police') sprite = SPRITE_POLICE
        else if (v.type === 'truck') sprite = SPRITE_TRUCK

        drawPixelSprite(ctx, sprite, v.x, v.y, 1)

        // Police flashing lightbar effect
        if (v.type === 'police') {
          const flash = Math.floor(currentTime * 0.01) % 2 === 0
          ctx.fillStyle = flash ? '#ff4757' : '#1e90ff'
          ctx.fillRect(v.x + 6, v.y + 6, 4, 3)
        }
      })

      // Render Player Car with Angle & Shadow
      const isFlickering = p.invulnerableTime > 0 && Math.floor(currentTime * 0.02) % 2 === 0
      if (!isFlickering && (p.health > 0 || state === 'title')) {
        ctx.save()
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2)
        ctx.rotate(p.angle)

        // Car Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(-p.width / 2 + 2, -p.height / 2 + 2, p.width, p.height)

        drawPixelSprite(ctx, SPRITE_PLAYER_CAR, -p.width / 2, -p.height / 2, 1)

        // Exhaust / Nitro Flames
        if (isNitroActiveRef.current) {
          ctx.fillStyle = '#00d2d3'
          ctx.fillRect(-p.width / 2 + 3, p.height / 2, 3, 6 + Math.random() * 4)
          ctx.fillRect(p.width / 2 - 6, p.height / 2, 3, 6 + Math.random() * 4)
        } else if (speedRef.current > 120) {
          ctx.fillStyle = '#ff6b81'
          ctx.fillRect(-p.width / 2 + 3, p.height / 2, 2, 3 + Math.random() * 2)
          ctx.fillRect(p.width / 2 - 5, p.height / 2, 2, 3 + Math.random() * 2)
        }

        ctx.restore()
      }

      // Render Particles
      particlesRef.current.forEach(pt => {
        ctx.fillStyle = pt.color
        ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size)
      })

      // -------------------------------------------------------------
      // 3. TOP IN-GAME HUD
      // -------------------------------------------------------------
      ctx.fillStyle = 'rgba(10, 15, 25, 0.95)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, HUD_HEIGHT)
      ctx.fillStyle = '#e74c3c'
      ctx.fillRect(0, HUD_HEIGHT - 1, SCREEN_WIDTH, 1)

      // Speedometer Gauge
      ctx.fillStyle = '#2ed573'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${Math.round(speedRef.current)} KM/H`, 8, 15)

      // Nitro Meter
      const nitroW = 46
      const nitroFill = (nitroRef.current / 100) * nitroW
      ctx.fillStyle = '#2f3542'
      ctx.fillRect(100, 6, nitroW, 10)
      ctx.fillStyle = isNitroActiveRef.current ? '#00d2d3' : '#2ed573'
      ctx.fillRect(100, 6, nitroFill, 10)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px monospace'
      ctx.fillText('N₂O', 104, 14)

      // Score
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${scoreRef.current}`, SCREEN_WIDTH - 8, 15)

      // -------------------------------------------------------------
      // 4. OVERLAYS (Title, GameOver, Paused)
      // -------------------------------------------------------------
      if (state === 'title') {
        ctx.fillStyle = 'rgba(10, 15, 25, 0.94)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        ctx.fillStyle = '#ff4757'
        ctx.font = 'bold 17px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('ASPHALT: URBAN GT', SCREEN_WIDTH / 2, 58)

        ctx.fillStyle = '#2ed573'
        ctx.font = 'bold 10px monospace'
        ctx.fillText('GAMELOFT · NOKIA 3510i EDITION', SCREEN_WIDTH / 2, 76)

        // Supercar in Center
        drawPixelSprite(ctx, SPRITE_PLAYER_CAR, SCREEN_WIDTH / 2 - 12, 100, 1.5)

        const pulse = Math.floor(currentTime * 0.003) % 2 === 0
        if (pulse) {
          ctx.fillStyle = '#ffa502'
          ctx.font = 'bold 11px monospace'
          ctx.fillText('PRESS 5 / TAP TO RACE', SCREEN_WIDTH / 2, 166)
        }

        ctx.fillStyle = '#a4b0be'
        ctx.font = '8px monospace'
        ctx.fillText('4/6: STEER  2: ACCEL  8: BRAKE', SCREEN_WIDTH / 2, 196)
        ctx.fillText('5: ENGAGE NITRO BOOST', SCREEN_WIDTH / 2, 208)
        ctx.fillText('CHEAT: 787898 FOR GOD MODE', SCREEN_WIDTH / 2, 222)
      } else if (state === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        ctx.fillStyle = '#ff4757'
        ctx.font = 'bold 15px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('PAUSED', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 8)

        ctx.fillStyle = '#a4b0be'
        ctx.font = '9px monospace'
        ctx.fillText('PRESS P / END TO RESUME', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 12)
      }

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    animationFrameId = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [addParticles])

  const gameMeta = GAMES.find(g => g.id === 'asphalt')!

  return (
    <GameLayout title={gameMeta.name} description={gameMeta.description} rules={gameMeta.rules}>
      <div className="flex flex-col items-center justify-center w-full py-1">
        {/* Top Header stats info */}
        <div className="flex justify-between items-center w-full max-w-[350px] mb-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold">
          <span className="text-red-400 flex items-center gap-1">
            🏎️ NOKIA 3510i · ASPHALT GT
          </span>
          <span className="text-amber-300">
            🏆 BEST: <span className="text-white ml-1">{bestScore || 0}</span>
          </span>
        </div>

        {/* EXACT NOKIA 3510i MOBILE PHONE CHASSIS */}
        <NokiaPhone
          screenBg="#0a1128"
          onLeftSoft={() => {
            if (gameState === 'title') startNewGame()
            else triggerNitro()
          }}
          onRightSoft={() => {
            setGameState(prev => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev))
          }}
          onDirectionPress={handleDirectionPress}
          onActionPress={handleActionPress}
          onKeypadPress={handleKeyCheat}
          onEndPress={() => {
            setGameState(prev => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev))
          }}
          cheatActive={isGodMode}
        >
          {/* LCD Touchscreen Canvas (Exact 258x248 Cutout) */}
          <canvas
            ref={canvasRef}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            onPointerDown={handleLcdPointerDown}
            onPointerUp={handleLcdPointerUp}
            onPointerCancel={handleLcdPointerUp}
            className="w-full h-full block cursor-crosshair touch-none"
            title="Nokia 3510i Screen (Touch or Keypad to play)"
          />
        </NokiaPhone>

        {/* Quick Interactive Shortcuts under Phone */}
        <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[350px] text-[11px] font-mono text-zinc-400 text-center">
          <button
            type="button"
            onPointerDown={() => {
              inputRef.current.left = true
            }}
            onPointerUp={() => {
              inputRef.current.left = false
            }}
            onPointerLeave={() => {
              inputRef.current.left = false
            }}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-3 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Steer left"
          >
            ◀ <strong className="text-zinc-200">4 / Left</strong>
          </button>
          <button
            type="button"
            onClick={triggerNitro}
            className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              isNitroActive
                ? 'bg-cyan-500/30 border-cyan-400/60 text-cyan-200'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
            }`}
            title="Fire Nitro Boost"
          >
            🔥 <strong className="text-zinc-200">5 / Nitro</strong>
          </button>
          <button
            type="button"
            onPointerDown={() => {
              inputRef.current.right = true
            }}
            onPointerUp={() => {
              inputRef.current.right = false
            }}
            onPointerLeave={() => {
              inputRef.current.right = false
            }}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-3 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Steer right"
          >
            <strong className="text-zinc-200">6 / Right</strong> ▶
          </button>
        </div>

        {/* Game Result Modal (on game over) */}
        {gameState === 'gameover' && (
          <div className="mt-4 w-full max-w-sm animate-pop-in">
            <GameResult
              game={gameMeta}
              score={score}
              isWin={false}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={startNewGame}
            />
          </div>
        )}
      </div>
    </GameLayout>
  )
}
