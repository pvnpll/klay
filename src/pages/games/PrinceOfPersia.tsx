import { useEffect, useRef, useState, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { NokiaPhone } from '../../components/NokiaPhone'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import { persianSound } from './prince-of-persia/sound'
import {
  SPRITE_PRINCE_IDLE_0,
  SPRITE_PRINCE_IDLE_1,
  SPRITE_PRINCE_RUN_0,
  SPRITE_PRINCE_RUN_1,
  SPRITE_PRINCE_RUN_2,
  SPRITE_PRINCE_JUMP,
  SPRITE_PRINCE_HANG,
  SPRITE_PRINCE_SLASH_1,
  SPRITE_PRINCE_SLASH_2,
  SPRITE_PRINCE_ROLL,
  SPRITE_WARRIOR_WALK_0,
  SPRITE_WARRIOR_WALK_1,
  SPRITE_WARRIOR_ATTACK,
  SPRITE_BRUTE,
  SPRITE_POT,
  SPRITE_SPIKES_EXTENDED,
  SPRITE_SAW_BLADE,
  SPRITE_SAND_ORB,
  SPRITE_HEALTH_POTION,
  SPRITE_WATER_LIQUID,
  SPRITE_WATER_FROZEN,
  drawPixelSprite,
} from './prince-of-persia/sprites'
import { LEVELS, TILE_SIZE } from './prince-of-persia/levels'
import type {
  GameState,
  PlayerState,
  PlayerHistoryFrame,
  Enemy,
  BreakablePot,
  Trap,
  WaterSpout,
  Particle,
} from './prince-of-persia/types'

const gameMeta = GAMES.find(g => g.id === 'prince-of-persia')!

export const SCREEN_WIDTH = 258
export const SCREEN_HEIGHT = 248
export const HUD_HEIGHT = 22

export default function PrinceOfPersia() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<GameState>('title')
  const [score, setScore] = useState<number>(0)
  const [levelIndex, setLevelIndex] = useState<number>(0)
  const [isGodMode, setIsGodMode] = useState<boolean>(false)
  const [waterFrozenActive, setWaterFrozenActive] = useState<boolean>(false)

  // Best score from storage
  const [bestScore, setBestScore] = useState<number>(() => {
    return getStats().bests['prince-of-persia'] || 0
  })
  const [isNewBest, setIsNewBest] = useState<boolean>(false)

  // Mutable Game References for High-Performance 60 FPS Loop
  const gameStateRef = useRef<GameState>('title')
  const scoreRef = useRef<number>(0)
  const levelIndexRef = useRef<number>(0)
  const isGodModeRef = useRef<boolean>(false)

  // Player State
  const playerRef = useRef<PlayerState>({
    x: 40,
    y: 180,
    vx: 0,
    vy: 0,
    facing: 'right',
    action: 'idle',
    animTime: 0,
    animFrame: 0,
    width: 14,
    height: 20,
    health: 4,
    maxHealth: 4,
    sandOrbs: 3,
    maxSandOrbs: 4,
    isGrounded: true,
    isLedgeHanging: false,
    ledgeX: 0,
    ledgeY: 0,
    invulnerableTime: 0,
    attackCooldown: 0,
    comboStep: 0,
    comboTimer: 0,
    rollTime: 0,
    waterFrozen: false,
    waterFreezeTimer: 0,
  })

  // History Buffer for Sands of Time Rewind (max ~180 frames = 3 seconds)
  const historyRef = useRef<PlayerHistoryFrame[]>([])

  // Level Entities
  const enemiesRef = useRef<Enemy[]>([])
  const potsRef = useRef<BreakablePot[]>([])
  const trapsRef = useRef<Trap[]>([])
  const waterSpoutsRef = useRef<WaterSpout[]>([])
  const particlesRef = useRef<Particle[]>([])

  // Camera scroll offset
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Input states
  const inputRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    attack: false,
    rewind: false,
    freeze: false,
  })

  // Touch Tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  // Keypad Cheat Tracker
  const cheatSequenceRef = useRef<string>('')

  // Sync state refs
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])
  useEffect(() => {
    scoreRef.current = score
  }, [score])
  useEffect(() => {
    levelIndexRef.current = levelIndex
  }, [levelIndex])
  useEffect(() => {
    isGodModeRef.current = isGodMode
  }, [isGodMode])

  // Initialize or Reset a Level
  const initLevel = useCallback((lvlIdx: number, keepPlayerStats = false) => {
    const levelData = LEVELS[lvlIdx % LEVELS.length]
    levelIndexRef.current = lvlIdx
    setLevelIndex(lvlIdx)

    const prevHp = keepPlayerStats ? playerRef.current.health : 4
    const prevSand = keepPlayerStats ? playerRef.current.sandOrbs : 3

    playerRef.current = {
      x: levelData.playerStart.x,
      y: levelData.playerStart.y,
      vx: 0,
      vy: 0,
      facing: 'right',
      action: 'idle',
      animTime: 0,
      animFrame: 0,
      width: 14,
      height: 20,
      health: prevHp,
      maxHealth: 4,
      sandOrbs: prevSand,
      maxSandOrbs: 4,
      isGrounded: true,
      isLedgeHanging: false,
      ledgeX: 0,
      ledgeY: 0,
      invulnerableTime: 0,
      attackCooldown: 0,
      comboStep: 0,
      comboTimer: 0,
      rollTime: 0,
      waterFrozen: false,
      waterFreezeTimer: 0,
    }

    // Populate Enemies
    enemiesRef.current = levelData.enemies.map((e, idx) => ({
      ...e,
      id: idx + 1,
      action: 'patrol',
      animTime: 0,
      animFrame: 0,
    }))

    // Populate Pots
    potsRef.current = levelData.pots.map((p, idx) => ({
      ...p,
      id: idx + 1,
      broken: false,
    }))

    // Populate Traps
    trapsRef.current = levelData.traps.map((t, idx) => ({
      ...t,
      id: idx + 1,
      state: 0,
      timer: 0,
      active: true,
    }))

    // Populate Water Spouts
    waterSpoutsRef.current = levelData.waterSpouts.map((w, idx) => ({
      ...w,
      id: idx + 1,
      frozen: false,
    }))

    historyRef.current = []
    particlesRef.current = []
    cameraRef.current = { x: 0, y: 0 }
    setWaterFrozenActive(false)
  }, [])

  // Start a fresh game
  const startNewGame = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    setIsNewBest(false)
    initLevel(0, false)
    setGameState('playing')
    persianSound.playKeyClick()
  }, [initLevel])

  // Spawn visual particles
  const addParticles = useCallback(
    (
      x: number,
      y: number,
      count: number,
      color: string,
      speed = 50,
      size = 2,
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const spd = (Math.random() * 0.7 + 0.3) * speed
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 0,
          maxLife: 0.35 + Math.random() * 0.35,
          size: Math.random() > 0.5 ? size : Math.max(1, size - 1),
          color,
        })
      }
    },
    [],
  )

  // Freeze Water Action
  const triggerWaterFreeze = useCallback(() => {
    const p = playerRef.current
    if (gameStateRef.current !== 'playing') return

    const newFreeze = !p.waterFrozen
    p.waterFrozen = newFreeze
    p.waterFreezeTimer = newFreeze ? 7.0 : 0
    setWaterFrozenActive(newFreeze)
    persianSound.playWaterFreeze()

    // Add frost sparkle particles at all water spouts
    waterSpoutsRef.current.forEach(w => {
      addParticles(w.x + w.width / 2, w.y + w.height / 2, 12, '#74b9ff', 60, 2)
    })
  }, [addParticles])

  // Sword Attack Action
  const triggerSwordAttack = useCallback(() => {
    const p = playerRef.current
    if (gameStateRef.current !== 'playing') return
    if (p.isLedgeHanging || p.rollTime > 0) return
    if (p.attackCooldown > 0) return

    p.comboStep = p.comboTimer > 0 ? (p.comboStep % 2) + 1 : 1
    p.comboTimer = 0.45
    p.action = p.comboStep === 1 ? 'attack1' : 'attack2'
    p.animTime = 0
    p.animFrame = 0
    p.attackCooldown = 0.28
    p.vx = p.facing === 'right' ? 30 : -30 // Small forward lunge

    persianSound.playSwordSwing()

    // Sword Hitbox check
    const swordReach = 24
    const swordX = p.facing === 'right' ? p.x + p.width : p.x - swordReach
    const swordY = p.y - 4
    const swordW = swordReach
    const swordH = p.height + 8

    let hitAny = false

    // Check hit on enemies
    enemiesRef.current.forEach(enemy => {
      if (enemy.action === 'dead') return
      if (
        swordX < enemy.x + enemy.width &&
        swordX + swordW > enemy.x &&
        swordY < enemy.y + enemy.height &&
        swordY + swordH > enemy.y
      ) {
        hitAny = true
        enemy.hp -= p.comboStep === 2 ? 2 : 1
        enemy.vx = p.facing === 'right' ? 80 : -80
        enemy.animTime = 0
        enemy.action = enemy.hp <= 0 ? 'dead' : 'hit'

        if (enemy.hp <= 0) {
          persianSound.playSandBurst()
          addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 25, '#f39c12', 90, 2)
          scoreRef.current += enemy.scoreValue
          setScore(scoreRef.current)

          // Chance to drop sand orb
          if (Math.random() < 0.6 && p.sandOrbs < p.maxSandOrbs) {
            p.sandOrbs = Math.min(p.maxSandOrbs, p.sandOrbs + 1)
            persianSound.playPickup()
          }
        } else {
          persianSound.playSwordClash()
          addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#ecf0f1', 70, 2)
        }
      }
    })

    // Check hit on breakable pots
    potsRef.current.forEach(pot => {
      if (pot.broken) return
      const potW = 12
      const potH = 14
      if (
        swordX < pot.x + potW &&
        swordX + swordW > pot.x &&
        swordY < pot.y + potH &&
        swordY + swordH > pot.y
      ) {
        pot.broken = true
        hitAny = true
        persianSound.playPotBreak()
        addParticles(pot.x + 6, pot.y + 7, 16, '#b8860b', 80, 2)

        if (pot.drop === 'health') {
          if (p.health < p.maxHealth) {
            p.health = Math.min(p.maxHealth, p.health + 1)
            persianSound.playPickup()
            addParticles(pot.x + 6, pot.y + 7, 10, '#e74c3c', 50, 2)
          }
        } else if (pot.drop === 'sand') {
          if (p.sandOrbs < p.maxSandOrbs) {
            p.sandOrbs = Math.min(p.maxSandOrbs, p.sandOrbs + 1)
            persianSound.playPickup()
            addParticles(pot.x + 6, pot.y + 7, 12, '#f1c40f', 60, 2)
          }
        } else {
          scoreRef.current += 100
          setScore(scoreRef.current)
        }
      }
    })

    if (hitAny) {
      persianSound.playSwordClash()
    }
  }, [addParticles])

  // Execute Combat Roll
  const triggerRoll = useCallback(() => {
    const p = playerRef.current
    if (gameStateRef.current !== 'playing') return
    if (p.isLedgeHanging || p.rollTime > 0) return

    p.rollTime = 0.38
    p.action = 'roll'
    p.vx = p.facing === 'right' ? 140 : -140
    persianSound.playRoll()
    addParticles(p.x + p.width / 2, p.y + p.height, 6, '#b8860b', 30, 2)
  }, [addParticles])

  // Handle Nokia Keypad Cheats (787898 or 1989 for God Mode)
  const handleKeyCheat = useCallback(
    (key: string) => {
      cheatSequenceRef.current = (cheatSequenceRef.current + key).slice(-6)

      if (cheatSequenceRef.current === '787898' || cheatSequenceRef.current.endsWith('1989')) {
        setIsGodMode(prev => {
          const next = !prev
          if (next) {
            playerRef.current.health = playerRef.current.maxHealth
            playerRef.current.sandOrbs = playerRef.current.maxSandOrbs
            persianSound.playVictory()
          }
          return next
        })
        cheatSequenceRef.current = ''
      }

      // Quick Numeric Keypad mappings
      if (key === '5') triggerSwordAttack()
      if (key === '0') {
        inputRef.current.rewind = true
        setTimeout(() => {
          inputRef.current.rewind = false
        }, 300)
      }
      if (key === '7') triggerWaterFreeze()
      if (key === '2') {
        // Jump / Climb
        if (gameStateRef.current === 'title') startNewGame()
        else {
          inputRef.current.up = true
          setTimeout(() => {
            inputRef.current.up = false
          }, 120)
        }
      }
      if (key === '8') triggerRoll()
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
    },
    [triggerSwordAttack, triggerWaterFreeze, triggerRoll, startNewGame],
  )

  // Hardware/Directional Press
  const handleDirectionPress = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => {
      if (dir === 'left') inputRef.current.left = pressed
      if (dir === 'right') inputRef.current.right = pressed
      if (dir === 'up') {
        inputRef.current.up = pressed
        if (pressed && gameStateRef.current === 'title') startNewGame()
      }
      if (dir === 'down') {
        inputRef.current.down = pressed
        if (pressed && gameStateRef.current === 'playing') triggerRoll()
      }
    },
    [startNewGame, triggerRoll],
  )

  const handleActionPress = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        if (gameStateRef.current === 'title') startNewGame()
        else triggerSwordAttack()
      }
    },
    [startNewGame, triggerSwordAttack],
  )

  // Direct LCD Touchscreen Handlers
  const handleLcdPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scaleX = SCREEN_WIDTH / rect.width
    const scaleY = SCREEN_HEIGHT / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY

    touchStartRef.current = { x: canvasX, y: canvasY, time: Date.now() }

    if (gameStateRef.current === 'title') {
      startNewGame()
      return
    }

    if (gameStateRef.current === 'gameover' || gameStateRef.current === 'victory') {
      startNewGame()
      return
    }

    if (gameStateRef.current === 'levelclear') {
      // Advance to next level
      const nextLvl = levelIndexRef.current + 1
      if (nextLvl < LEVELS.length) {
        initLevel(nextLvl, true)
        setGameState('playing')
      } else {
        setGameState('victory')
        persianSound.playVictory()
      }
      return
    }

    // Top HUD buttons: Hourglass (Rewind) & Frost Gem (Freeze)
    if (canvasY < HUD_HEIGHT + 10) {
      if (canvasX > SCREEN_WIDTH - 36) {
        // Rewind hold
        inputRef.current.rewind = true
        return
      }
      if (canvasX > SCREEN_WIDTH - 72 && canvasX <= SCREEN_WIDTH - 36) {
        // Water Freeze toggle
        triggerWaterFreeze()
        return
      }
    }

    // Bottom Softkey area
    if (canvasY > SCREEN_HEIGHT - 22) {
      if (canvasX < SCREEN_WIDTH / 2) {
        triggerSwordAttack()
      } else {
        inputRef.current.rewind = true
      }
      return
    }

    // Main Gameplay Area Screen Steering
    const screenCenter = SCREEN_WIDTH / 2
    if (canvasX < screenCenter - 25) {
      inputRef.current.left = true
      inputRef.current.right = false
    } else if (canvasX > screenCenter + 25) {
      inputRef.current.right = true
      inputRef.current.left = false
    } else {
      // Tap center = Attack
      triggerSwordAttack()
    }
  }

  const handleLcdPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current || gameStateRef.current !== 'playing') return
    const rect = e.currentTarget.getBoundingClientRect()
    const scaleX = SCREEN_WIDTH / rect.width
    const scaleY = SCREEN_HEIGHT / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY

    const dy = canvasY - touchStartRef.current.y
    const dx = canvasX - touchStartRef.current.x

    // Swipe Up = Jump
    if (dy < -22 && Math.abs(dy) > Math.abs(dx)) {
      inputRef.current.up = true
    }
    // Swipe Down = Roll
    if (dy > 22 && Math.abs(dy) > Math.abs(dx)) {
      triggerRoll()
      touchStartRef.current = null
    }
  }

  const handleLcdPointerUp = () => {
    inputRef.current.left = false
    inputRef.current.right = false
    inputRef.current.up = false
    inputRef.current.down = false
    inputRef.current.rewind = false
    touchStartRef.current = null
  }

  // Keyboard Shortcuts (Arrow keys, Space, WASD, R for Rewind, F for Freeze)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputRef.current.left = true
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRef.current.right = true
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputRef.current.up = true
        if (gameStateRef.current === 'title') startNewGame()
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        inputRef.current.down = true
        if (gameStateRef.current === 'playing') triggerRoll()
      }
      if (e.key === ' ' || e.key === 'x' || e.key === 'X' || e.key === 'Enter') {
        if (gameStateRef.current === 'title') startNewGame()
        else triggerSwordAttack()
      }
      if (e.key === 'r' || e.key === 'R' || e.key === '0') {
        inputRef.current.rewind = true
      }
      if (e.key === 'f' || e.key === 'F' || e.key === '7') {
        triggerWaterFreeze()
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState(prev => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = false
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputRef.current.up = false
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') inputRef.current.down = false
      if (e.key === 'r' || e.key === 'R' || e.key === '0') inputRef.current.rewind = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startNewGame, triggerSwordAttack, triggerWaterFreeze, triggerRoll])

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
      const currentLevel = LEVELS[levelIndexRef.current % LEVELS.length]
      const p = playerRef.current

      // -------------------------------------------------------------
      // 1. REWIND TIME LOGIC (Sands of Time)
      // -------------------------------------------------------------
      const isRewinding =
        (inputRef.current.rewind || state === 'rewinding') &&
        p.sandOrbs > 0 &&
        historyRef.current.length > 0 &&
        state !== 'title' &&
        state !== 'victory'

      if (isRewinding) {
        if (state !== 'rewinding') {
          gameStateRef.current = 'rewinding'
          setGameState('rewinding')
          persianSound.playTimeRewind()
        }

        // Pop historical frames (2 frames per tick for reverse feel)
        for (let i = 0; i < 2; i++) {
          const prevFrame = historyRef.current.pop()
          if (prevFrame) {
            p.x = prevFrame.x
            p.y = prevFrame.y
            p.vx = prevFrame.vx
            p.vy = prevFrame.vy
            p.facing = prevFrame.facing
            p.action = prevFrame.action
            p.animFrame = prevFrame.animFrame
            p.health = isGodModeRef.current ? p.maxHealth : Math.max(1, prevFrame.health)
          }
        }

        // Spawn time sand particles
        addParticles(p.x + p.width / 2, p.y + p.height / 2, 3, '#f1c40f', 40, 2)

        // Decrement sand orbs smoothly (1 orb per ~1.5 seconds)
        if (!isGodModeRef.current) {
          p.sandOrbs = Math.max(0, p.sandOrbs - dt * 0.7)
        }

        if (p.sandOrbs <= 0 || historyRef.current.length === 0 || !inputRef.current.rewind) {
          gameStateRef.current = 'playing'
          setGameState('playing')
        }
      } else if (state === 'rewinding') {
        gameStateRef.current = 'playing'
        setGameState('playing')
      }

      // -------------------------------------------------------------
      // 2. PLAYING PHYSICS & SIMULATION
      // -------------------------------------------------------------
      if (gameStateRef.current === 'playing') {
        // Record frame into history buffer (capped at 180 frames)
        historyRef.current.push({
          x: p.x,
          y: p.y,
          vx: p.vx,
          vy: p.vy,
          facing: p.facing,
          action: p.action,
          animFrame: p.animFrame,
          health: p.health,
          sandOrbs: p.sandOrbs,
        })
        if (historyRef.current.length > 180) {
          historyRef.current.shift()
        }

        // Water freeze timer countdown
        if (p.waterFrozen) {
          p.waterFreezeTimer -= dt
          if (p.waterFreezeTimer <= 0) {
            p.waterFrozen = false
            setWaterFrozenActive(false)
            persianSound.playWaterFreeze()
          }
        }

        // Timers & Cooldowns
        if (p.invulnerableTime > 0) p.invulnerableTime -= dt
        if (p.attackCooldown > 0) p.attackCooldown -= dt
        if (p.comboTimer > 0) {
          p.comboTimer -= dt
          if (p.comboTimer <= 0) p.comboStep = 0
        }
        if (p.rollTime > 0) {
          p.rollTime -= dt
          if (p.rollTime <= 0 && p.action === 'roll') {
            p.action = 'idle'
          }
        }

        // Ledge Hang Handling
        if (p.isLedgeHanging) {
          p.vx = 0
          p.vy = 0
          p.action = 'ledge_hang'

          // Up = Climb onto ledge
          if (inputRef.current.up) {
            p.isLedgeHanging = false
            p.y = p.ledgeY - p.height - 2
            p.x = p.facing === 'right' ? p.ledgeX + 4 : p.ledgeX - p.width - 4
            p.vy = -60
            p.action = 'idle'
            persianSound.playJump()
            inputRef.current.up = false
          }
          // Down = Drop from ledge
          else if (inputRef.current.down) {
            p.isLedgeHanging = false
            p.y += 6
            p.vy = 40
            p.action = 'fall'
          }
        } else {
          // Horizontal Movement
          const moveSpeed = p.rollTime > 0 ? 140 : 100
          if (p.action !== 'attack1' && p.action !== 'attack2') {
            if (inputRef.current.left) {
              p.vx = -moveSpeed
              p.facing = 'left'
              if (p.isGrounded && p.rollTime <= 0) p.action = 'run'
            } else if (inputRef.current.right) {
              p.vx = moveSpeed
              p.facing = 'right'
              if (p.isGrounded && p.rollTime <= 0) p.action = 'run'
            } else {
              p.vx *= 0.65
              if (Math.abs(p.vx) < 5) p.vx = 0
              if (p.isGrounded && p.rollTime <= 0) p.action = 'idle'
            }
          }

          // Jump / Vault
          if (inputRef.current.up && p.isGrounded && p.rollTime <= 0) {
            p.vy = -230
            p.isGrounded = false
            p.action = 'jump_up'
            persianSound.playJump()
            inputRef.current.up = false
          }

          // Apply Gravity
          p.vy += 620 * dt
          if (p.vy > 280) p.vy = 280

          if (!p.isGrounded && p.rollTime <= 0 && p.action !== 'attack1' && p.action !== 'attack2') {
            p.action = p.vy < 0 ? 'jump_up' : 'fall'
          }

          // Move X and Tile Collision
          p.x += p.vx * dt
          const map = currentLevel.map
          const mapRows = map.length
          const mapCols = map[0].length

          // Check tile solidity helper (including frozen water spouts!)
          const isSolidTile = (col: number, row: number) => {
            if (row < 0 || row >= mapRows || col < 0 || col >= mapCols) return false
            const tile = map[row][col]
            if (tile === 1 || tile === 2) return true
            if (tile === 6 && p.waterFrozen) return true
            return false
          }

          // X Collision
          const leftCol = Math.floor(p.x / TILE_SIZE)
          const rightCol = Math.floor((p.x + p.width - 1) / TILE_SIZE)
          const topRow = Math.floor(p.y / TILE_SIZE)
          const bottomRow = Math.floor((p.y + p.height - 1) / TILE_SIZE)

          for (let r = topRow; r <= bottomRow; r++) {
            if (p.vx > 0 && isSolidTile(rightCol, r)) {
              p.x = rightCol * TILE_SIZE - p.width
              p.vx = 0
              break
            } else if (p.vx < 0 && isSolidTile(leftCol, r)) {
              p.x = (leftCol + 1) * TILE_SIZE
              p.vx = 0
              break
            }
          }

          // Move Y and Collision
          p.y += p.vy * dt
          const newTopRow = Math.floor(p.y / TILE_SIZE)
          const newBottomRow = Math.floor((p.y + p.height - 1) / TILE_SIZE)
          const newLeftCol = Math.floor(p.x / TILE_SIZE)
          const newRightCol = Math.floor((p.x + p.width - 1) / TILE_SIZE)

          p.isGrounded = false
          for (let c = newLeftCol; c <= newRightCol; c++) {
            if (p.vy > 0 && isSolidTile(c, newBottomRow)) {
              p.y = newBottomRow * TILE_SIZE - p.height
              p.vy = 0
              p.isGrounded = true
              break
            } else if (p.vy < 0 && isSolidTile(c, newTopRow)) {
              p.y = (newTopRow + 1) * TILE_SIZE
              p.vy = 0
              break
            }
          }

          // Ledge Grab Detection (Prince grabs ledge while falling)
          if (!p.isGrounded && p.vy > 10 && p.rollTime <= 0) {
            const checkCol = p.facing === 'right' ? Math.floor((p.x + p.width + 3) / TILE_SIZE) : Math.floor((p.x - 3) / TILE_SIZE)
            const headRow = Math.floor((p.y + 4) / TILE_SIZE)
            const airAboveRow = headRow - 1

            if (
              isSolidTile(checkCol, headRow) &&
              !isSolidTile(checkCol, airAboveRow)
            ) {
              const ledgeTopY = headRow * TILE_SIZE
              // Prince hands align with top edge of tile
              if (Math.abs(p.y - ledgeTopY) < 14) {
                p.isLedgeHanging = true
                p.ledgeX = checkCol * TILE_SIZE
                p.ledgeY = ledgeTopY
                p.y = ledgeTopY + 2
                p.x = p.facing === 'right' ? p.ledgeX - p.width : p.ledgeX + TILE_SIZE
                p.vx = 0
                p.vy = 0
                p.action = 'ledge_hang'
                persianSound.playLedgeGrab()
              }
            }
          }

          // Pit / Fall Death Detection
          if (p.y > mapRows * TILE_SIZE + 20) {
            if (!isGodModeRef.current) {
              p.health = 0
              persianSound.playGameOver()
              gameStateRef.current = 'gameover'
              setGameState('gameover')
            } else {
              p.y = currentLevel.playerStart.y
              p.x = currentLevel.playerStart.x
              p.vy = 0
            }
          }
        }

        // Animation Frame Progression
        p.animTime += dt
        if (p.action === 'run') {
          if (p.animTime > 0.1) {
            p.animTime = 0
            p.animFrame = (p.animFrame + 1) % 4
          }
        } else if (p.action === 'idle') {
          if (p.animTime > 0.4) {
            p.animTime = 0
            p.animFrame = (p.animFrame + 1) % 2
          }
        } else if (p.action === 'attack1' || p.action === 'attack2') {
          if (p.animTime > 0.22) {
            p.action = 'idle'
          }
        }

        // -------------------------------------------------------------
        // 3. ENEMY AI & COMBAT SIMULATION
        // -------------------------------------------------------------
        enemiesRef.current.forEach(enemy => {
          if (enemy.action === 'dead') return

          enemy.animTime += dt
          if (enemy.animTime > 0.18) {
            enemy.animTime = 0
            enemy.animFrame = (enemy.animFrame + 1) % 2
          }

          const distToPlayer = Math.hypot(
            p.x + p.width / 2 - (enemy.x + enemy.width / 2),
            p.y + p.height / 2 - (enemy.y + enemy.height / 2),
          )

          // Patrol vs Alert
          if (distToPlayer < 90) {
            enemy.facing = p.x > enemy.x ? 'right' : 'left'
            enemy.action = distToPlayer < 26 ? 'attack' : 'alert'

            if (enemy.action === 'alert') {
              const dir = p.x > enemy.x ? 1 : -1
              enemy.x += dir * Math.abs(enemy.vx) * dt
            } else if (enemy.action === 'attack') {
              enemy.attackCooldown -= dt
              if (enemy.attackCooldown <= 0) {
                enemy.attackCooldown = 1.4
                persianSound.playSwordSwing()

                // Deal damage to Prince if not invulnerable and not rolling
                if (p.invulnerableTime <= 0 && p.rollTime <= 0 && !isGodModeRef.current) {
                  p.health -= 1
                  p.invulnerableTime = 1.2
                  p.vx = enemy.facing === 'right' ? 90 : -90
                  persianSound.playPlayerHurt()
                  addParticles(p.x + p.width / 2, p.y + p.height / 2, 10, '#c0392b', 70, 2)

                  if (p.health <= 0) {
                    gameStateRef.current = 'gameover'
                    setGameState('gameover')
                    persianSound.playGameOver()
                  }
                }
              }
            }
          } else {
            // Patrol back and forth
            enemy.action = 'patrol'
            enemy.x += (enemy.facing === 'right' ? 1 : -1) * Math.abs(enemy.vx) * dt
            if (enemy.x > enemy.patrolRight) {
              enemy.x = enemy.patrolRight
              enemy.facing = 'left'
            } else if (enemy.x < enemy.patrolLeft) {
              enemy.x = enemy.patrolLeft
              enemy.facing = 'right'
            }
          }
        })

        // -------------------------------------------------------------
        // 4. TRAPS (Spikes & Rotating Saws)
        // -------------------------------------------------------------
        trapsRef.current.forEach(trap => {
          if (trap.type === 'saw' && trap.startX !== undefined && trap.endX !== undefined) {
            trap.state += dt * (trap.speed || 50)
            const range = trap.endX - trap.startX
            const cycle = Math.sin(trap.state * 0.05) * 0.5 + 0.5
            trap.x = trap.startX + cycle * range

            // Hit detection with player
            if (p.rollTime <= 0 && p.invulnerableTime <= 0 && !isGodModeRef.current) {
              if (
                p.x < trap.x + trap.width &&
                p.x + p.width > trap.x &&
                p.y < trap.y + trap.height &&
                p.y + p.height > trap.y
              ) {
                p.health -= 1
                p.invulnerableTime = 1.3
                p.vy = -120
                persianSound.playPlayerHurt()
                addParticles(p.x + p.width / 2, p.y + p.height / 2, 12, '#c0392b', 80, 2)

                if (p.health <= 0) {
                  gameStateRef.current = 'gameover'
                  setGameState('gameover')
                  persianSound.playGameOver()
                }
              }
            }
          } else if (trap.type === 'spikes') {
            // Stepping on spikes
            if (p.invulnerableTime <= 0 && !isGodModeRef.current) {
              if (
                p.x < trap.x + trap.width &&
                p.x + p.width > trap.x &&
                p.y + p.height >= trap.y &&
                p.y < trap.y + trap.height
              ) {
                p.health -= 1
                p.invulnerableTime = 1.4
                p.vy = -180
                persianSound.playPlayerHurt()
                addParticles(p.x + p.width / 2, p.y + p.height, 12, '#c0392b', 70, 2)

                if (p.health <= 0) {
                  gameStateRef.current = 'gameover'
                  setGameState('gameover')
                  persianSound.playGameOver()
                }
              }
            }
          }
        })

        // -------------------------------------------------------------
        // 5. EXIT GATE & LEVEL COMPLETION
        // -------------------------------------------------------------
        const gate = currentLevel.exitGate
        if (
          p.x < gate.x + gate.width &&
          p.x + p.width > gate.x &&
          p.y < gate.y + gate.height &&
          p.y + p.height > gate.y
        ) {
          // Level Cleared!
          scoreRef.current += 1000 + p.health * 200 + Math.floor(p.sandOrbs) * 200
          setScore(scoreRef.current)
          persianSound.playVictory()

          if (levelIndexRef.current >= LEVELS.length - 1) {
            gameStateRef.current = 'victory'
            setGameState('victory')
            const isBest = saveScore(gameMeta, scoreRef.current)
            if (isBest) {
              setBestScore(scoreRef.current)
              setIsNewBest(true)
            }
          } else {
            gameStateRef.current = 'levelclear'
            setGameState('levelclear')
          }
        }
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

      // Smooth Camera Following Prince
      const targetCamX = p.x + p.width / 2 - SCREEN_WIDTH / 2
      const targetCamY = p.y + p.height / 2 - SCREEN_HEIGHT / 2
      const maxCamX = currentLevel.map[0].length * TILE_SIZE - SCREEN_WIDTH
      const maxCamY = currentLevel.map.length * TILE_SIZE - SCREEN_HEIGHT

      cameraRef.current.x += (Math.max(0, Math.min(maxCamX, targetCamX)) - cameraRef.current.x) * 0.12
      cameraRef.current.y += (Math.max(0, Math.min(maxCamY, targetCamY)) - cameraRef.current.y) * 0.12

      const camX = Math.round(cameraRef.current.x)
      const camY = Math.round(cameraRef.current.y)

      // -------------------------------------------------------------
      // 6. CANVAS RENDERING (Java ME Nokia 3510i Retro Style)
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      // Sky gradient background
      const skyGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT)
      skyGradient.addColorStop(0, '#0c1b33') // Deep midnight blue
      skyGradient.addColorStop(0.5, '#1e375b')
      skyGradient.addColorStop(1, '#2c3e50')
      ctx.fillStyle = skyGradient
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      // Distant Babylonian arches & Palace towers silhouette (Parallax)
      ctx.fillStyle = '#14253e'
      for (let i = 0; i < 8; i++) {
        const towerX = (i * 70 - Math.round(camX * 0.25)) % (SCREEN_WIDTH + 140) - 40
        ctx.fillRect(towerX, 80, 48, SCREEN_HEIGHT - 80)
        // Tower domes
        ctx.beginPath()
        ctx.arc(towerX + 24, 80, 24, Math.PI, 0)
        ctx.fill()
      }

      // Render Tile Map
      const map = currentLevel.map
      const startCol = Math.max(0, Math.floor(camX / TILE_SIZE))
      const endCol = Math.min(map[0].length - 1, Math.ceil((camX + SCREEN_WIDTH) / TILE_SIZE))
      const startRow = Math.max(0, Math.floor(camY / TILE_SIZE))
      const endRow = Math.min(map.length - 1, Math.ceil((camY + SCREEN_HEIGHT) / TILE_SIZE))

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const tile = map[r][c]
          const drawX = c * TILE_SIZE - camX
          const drawY = r * TILE_SIZE - camY

          if (tile === 1) {
            // Stone Block Floor
            ctx.fillStyle = '#b8860b' // Persian gold-brown sandstone
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE)
            // Stone bevel highlight & shadow
            ctx.fillStyle = '#d4af37'
            ctx.fillRect(drawX, drawY, TILE_SIZE, 2)
            ctx.fillStyle = '#7a5806'
            ctx.fillRect(drawX, drawY + TILE_SIZE - 2, TILE_SIZE, 2)
            ctx.fillRect(drawX + TILE_SIZE - 2, drawY, 2, TILE_SIZE)
          } else if (tile === 2) {
            // Stone Pillar Wall
            ctx.fillStyle = '#8b6914'
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = '#a8801f'
            ctx.fillRect(drawX + 3, drawY, TILE_SIZE - 6, TILE_SIZE)
          } else if (tile === 3) {
            // Background Column
            ctx.fillStyle = '#3a4b61'
            ctx.fillRect(drawX + 4, drawY, TILE_SIZE - 8, TILE_SIZE)
          } else if (tile === 4) {
            // Mosaic Arch
            ctx.fillStyle = '#d4af37'
            ctx.beginPath()
            ctx.arc(drawX + 8, drawY + 8, 6, Math.PI, 0)
            ctx.stroke()
          } else if (tile === 5) {
            // Floor Spikes
            drawPixelSprite(ctx, SPRITE_SPIKES_EXTENDED, drawX, drawY + 6, 1)
          } else if (tile === 6) {
            // Water Spout / Waterfall
            const isFrozen = p.waterFrozen
            const sprite = isFrozen ? SPRITE_WATER_FROZEN : SPRITE_WATER_LIQUID
            drawPixelSprite(ctx, sprite, drawX + 4, drawY, 1)
            if (!isFrozen) {
              // Shimmer animation
              ctx.fillStyle = 'rgba(116, 185, 255, 0.4)'
              ctx.fillRect(drawX + 4, drawY + ((currentTime * 0.05) % 16), 8, 3)
            }
          }
        }
      }

      // Render Traps (Moving Saw Blades)
      trapsRef.current.forEach(trap => {
        if (trap.type === 'saw') {
          drawPixelSprite(ctx, SPRITE_SAW_BLADE, trap.x - camX, trap.y - camY, 1)
        }
      })

      // Render Breakable Clay Pots
      potsRef.current.forEach(pot => {
        if (!pot.broken) {
          drawPixelSprite(ctx, SPRITE_POT, pot.x - camX, pot.y - camY, 1)
        }
      })

      // Render Exit Gate
      const gateX = currentLevel.exitGate.x - camX
      const gateY = currentLevel.exitGate.y - camY
      ctx.fillStyle = '#f39c12'
      ctx.fillRect(gateX, gateY, currentLevel.exitGate.width, currentLevel.exitGate.height)
      ctx.fillStyle = '#f1c40f'
      ctx.fillRect(gateX + 2, gateY + 2, currentLevel.exitGate.width - 4, currentLevel.exitGate.height - 4)
      ctx.fillStyle = '#221812'
      ctx.fillRect(gateX + 4, gateY + 4, currentLevel.exitGate.width - 8, currentLevel.exitGate.height - 4)

      // Render Enemies
      enemiesRef.current.forEach(enemy => {
        if (enemy.action === 'dead') return

        const ex = enemy.x - camX
        const ey = enemy.y - camY
        const flip = enemy.facing === 'left'

        if (enemy.type === 'brute') {
          drawPixelSprite(ctx, SPRITE_BRUTE, ex, ey, 1, flip)
        } else if (enemy.action === 'attack') {
          drawPixelSprite(ctx, SPRITE_WARRIOR_ATTACK, ex, ey, 1, flip)
        } else {
          const sprite = enemy.animFrame === 0 ? SPRITE_WARRIOR_WALK_0 : SPRITE_WARRIOR_WALK_1
          drawPixelSprite(ctx, sprite, ex, ey, 1, flip)
        }

        // Enemy Health Bar
        if (enemy.hp < enemy.maxHp) {
          const barW = 16
          ctx.fillStyle = 'rgba(0,0,0,0.6)'
          ctx.fillRect(ex, ey - 6, barW, 3)
          ctx.fillStyle = '#e74c3c'
          ctx.fillRect(ex, ey - 6, Math.max(0, (enemy.hp / enemy.maxHp) * barW), 3)
        }
      })

      // Render Prince
      if (p.health > 0 || gameStateRef.current === 'rewinding') {
        const px = p.x - camX
        const py = p.y - camY
        const flip = p.facing === 'left'
        const isFlickering = p.invulnerableTime > 0 && Math.floor(currentTime * 0.02) % 2 === 0

        if (!isFlickering) {
          if (p.action === 'roll') {
            drawPixelSprite(ctx, SPRITE_PRINCE_ROLL, px, py + 8, 1, flip)
          } else if (p.action === 'attack1') {
            drawPixelSprite(ctx, SPRITE_PRINCE_SLASH_1, px, py, 1, flip)
          } else if (p.action === 'attack2') {
            drawPixelSprite(ctx, SPRITE_PRINCE_SLASH_2, px, py - 4, 1, flip)
          } else if (p.action === 'ledge_hang') {
            drawPixelSprite(ctx, SPRITE_PRINCE_HANG, px, py, 1, flip)
          } else if (p.action === 'jump_up' || p.action === 'fall') {
            drawPixelSprite(ctx, SPRITE_PRINCE_JUMP, px, py, 1, flip)
          } else if (p.action === 'run') {
            const runSprites = [SPRITE_PRINCE_RUN_0, SPRITE_PRINCE_RUN_1, SPRITE_PRINCE_RUN_2, SPRITE_PRINCE_RUN_1]
            drawPixelSprite(ctx, runSprites[p.animFrame % 4], px, py, 1, flip)
          } else {
            const idleSprite = p.animFrame === 0 ? SPRITE_PRINCE_IDLE_0 : SPRITE_PRINCE_IDLE_1
            drawPixelSprite(ctx, idleSprite, px, py, 1, flip)
          }
        }

        // God Mode Golden Aura
        if (isGodModeRef.current) {
          ctx.strokeStyle = 'rgba(241, 196, 15, 0.7)'
          ctx.lineWidth = 2
          ctx.strokeRect(px - 2, py - 2, p.width + 4, p.height + 4)
        }
      }

      // Render Particles
      particlesRef.current.forEach(pt => {
        ctx.fillStyle = pt.color
        ctx.fillRect(Math.round(pt.x - camX), Math.round(pt.y - camY), pt.size, pt.size)
      })

      // -------------------------------------------------------------
      // 7. TIME REWIND IRIDESCENT OVERLAY
      // -------------------------------------------------------------
      if (gameStateRef.current === 'rewinding') {
        ctx.fillStyle = 'rgba(243, 156, 18, 0.22)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        // Sands of Time Hourglass Vortex
        ctx.strokeStyle = '#f1c40f'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(
          p.x + p.width / 2 - camX,
          p.y + p.height / 2 - camY,
          20 + (currentTime * 0.04) % 18,
          0,
          Math.PI * 2,
        )
        ctx.stroke()

        // Time Rewind Banner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
        ctx.fillRect(0, SCREEN_HEIGHT / 2 - 14, SCREEN_WIDTH, 24)
        ctx.fillStyle = '#f1c40f'
        ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('⏳ REWINDING TIME...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 2)
      }

      // -------------------------------------------------------------
      // 8. NOKIA 3510i IN-GAME HUD HEADER
      // -------------------------------------------------------------
      ctx.fillStyle = 'rgba(10, 15, 25, 0.88)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, HUD_HEIGHT)
      ctx.fillStyle = '#f39c12'
      ctx.fillRect(0, HUD_HEIGHT - 1, SCREEN_WIDTH, 1)

      // Health Gems (Hearts)
      for (let i = 0; i < p.maxHealth; i++) {
        const gemX = 8 + i * 14
        const gemY = 4
        if (i < p.health) {
          drawPixelSprite(ctx, SPRITE_HEALTH_POTION, gemX, gemY, 1)
        } else {
          // Empty diamond socket
          ctx.strokeStyle = '#555'
          ctx.strokeRect(gemX + 2, gemY + 2, 7, 7)
        }
      }

      // Sand of Time Orbs
      for (let i = 0; i < p.maxSandOrbs; i++) {
        const orbX = 74 + i * 13
        const orbY = 4
        if (i < Math.floor(p.sandOrbs)) {
          drawPixelSprite(ctx, SPRITE_SAND_ORB, orbX, orbY, 1)
        } else {
          ctx.strokeStyle = '#444'
          ctx.strokeRect(orbX + 2, orbY + 2, 6, 6)
        }
      }

      // Freeze Water Icon / Meter
      const frostX = SCREEN_WIDTH - 66
      ctx.fillStyle = p.waterFrozen ? '#74b9ff' : '#4a69bd'
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(p.waterFrozen ? `❄️${Math.ceil(p.waterFreezeTimer)}s` : '💧7', frostX, 15)

      // Score
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${scoreRef.current}`, SCREEN_WIDTH - 8, 15)

      // Softkey text at bottom of LCD screen
      ctx.fillStyle = 'rgba(10, 15, 25, 0.85)'
      ctx.fillRect(0, SCREEN_HEIGHT - 14, SCREEN_WIDTH, 14)
      ctx.fillStyle = '#f39c12'
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText('⚔️ ATTACK (5)', 6, SCREEN_HEIGHT - 3)
      ctx.textAlign = 'right'
      ctx.fillText('⏳ REWIND (0)', SCREEN_WIDTH - 6, SCREEN_HEIGHT - 3)

      // -------------------------------------------------------------
      // 9. OVERLAYS (Title, Level Clear, Paused, GameOver)
      // -------------------------------------------------------------
      if (gameStateRef.current === 'title') {
        ctx.fillStyle = 'rgba(12, 27, 51, 0.94)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        // Ancient Persian Logo Banner
        ctx.fillStyle = '#f1c40f'
        ctx.font = 'bold 15px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('PRINCE OF PERSIA', SCREEN_WIDTH / 2, 54)

        ctx.fillStyle = '#e67e22'
        ctx.font = 'bold 11px monospace'
        ctx.fillText('THE FORGOTTEN SANDS', SCREEN_WIDTH / 2, 72)

        ctx.fillStyle = '#ecf0f1'
        ctx.font = '9px monospace'
        ctx.fillText('GAMELOFT · NOKIA 3510i EDITION', SCREEN_WIDTH / 2, 90)

        // Prince Graphic in Center
        drawPixelSprite(ctx, SPRITE_PRINCE_IDLE_0, SCREEN_WIDTH / 2 - 12, 110, 1.6)

        // Pulsing Start Prompt
        const pulse = Math.floor(currentTime * 0.003) % 2 === 0
        if (pulse) {
          ctx.fillStyle = '#f39c12'
          ctx.font = 'bold 11px monospace'
          ctx.fillText('PRESS 5 / TAP TO START', SCREEN_WIDTH / 2, 172)
        }

        ctx.fillStyle = '#95a5a6'
        ctx.font = '8px monospace'
        ctx.fillText('4/6: RUN  2: JUMP  8: ROLL  0: REWIND', SCREEN_WIDTH / 2, 204)
        ctx.fillText('CHEAT: 787898 FOR GOD MODE', SCREEN_WIDTH / 2, 218)
      } else if (gameStateRef.current === 'levelclear') {
        ctx.fillStyle = 'rgba(10, 15, 25, 0.88)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        ctx.fillStyle = '#f1c40f'
        ctx.font = 'bold 14px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('STAGE CLEARED!', SCREEN_WIDTH / 2, 80)

        ctx.fillStyle = '#ecf0f1'
        ctx.font = '10px monospace'
        ctx.fillText(`SCORE: ${scoreRef.current}`, SCREEN_WIDTH / 2, 110)
        ctx.fillText('HEALTH BONUS: +' + p.health * 200, SCREEN_WIDTH / 2, 128)
        ctx.fillText('SAND BONUS: +' + Math.floor(p.sandOrbs) * 200, SCREEN_WIDTH / 2, 146)

        const pulse = Math.floor(currentTime * 0.003) % 2 === 0
        if (pulse) {
          ctx.fillStyle = '#2ecc71'
          ctx.font = 'bold 10px monospace'
          ctx.fillText('TAP OR PRESS 5 TO ADVANCE', SCREEN_WIDTH / 2, 190)
        }
      } else if (gameStateRef.current === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        ctx.fillStyle = '#f39c12'
        ctx.font = 'bold 15px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('PAUSED', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 10)

        ctx.fillStyle = '#ecf0f1'
        ctx.font = '9px monospace'
        ctx.fillText('PRESS END / P TO RESUME', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 12)
      }

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    animationFrameId = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [addParticles])

  return (
    <GameLayout title={gameMeta.name} description={gameMeta.description} rules={gameMeta.rules}>
      <div className="flex flex-col items-center justify-center w-full py-1">
        {/* Top Header stats info */}
        <div className="flex justify-between items-center w-full max-w-[350px] mb-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold">
          <span className="text-amber-400 flex items-center gap-1">
            👑 NOKIA 3510i · PRINCE OF PERSIA
          </span>
          <span className="text-amber-300">
            🏆 BEST: <span className="text-white ml-1">{bestScore || 0}</span>
          </span>
        </div>

        {/* EXACT NOKIA 3510i MOBILE PHONE CHASSIS (Shared Handset Component) */}
        <NokiaPhone
          screenBg="#0c1b33"
          onLeftSoft={() => {
            if (gameState === 'title') startNewGame()
            else triggerSwordAttack()
          }}
          onRightSoft={() => {
            if (gameState === 'playing') {
              inputRef.current.rewind = true
              setTimeout(() => {
                inputRef.current.rewind = false
              }, 400)
            }
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
            onPointerMove={handleLcdPointerMove}
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
            onClick={triggerSwordAttack}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Perform acrobatic sword slash combo"
          >
            ⚔️ <strong className="text-zinc-200">5 / OK</strong>: Attack
          </button>
          <button
            type="button"
            onPointerDown={() => {
              inputRef.current.rewind = true
            }}
            onPointerUp={() => {
              inputRef.current.rewind = false
            }}
            onPointerLeave={() => {
              inputRef.current.rewind = false
            }}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Hold to Rewind Time with Sands of Time"
          >
            ⏳ <strong className="text-zinc-200">0 / Hold</strong>: Rewind
          </button>
          <button
            type="button"
            onClick={triggerWaterFreeze}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              waterFrozenActive
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400'
            }`}
            title="Freeze Water Spouts into solid climbable crystal ice"
          >
            ❄️ <strong className="text-zinc-200">7</strong>: Freeze ({waterFrozenActive ? 'ON' : 'OFF'})
          </button>
          <button
            type="button"
            onClick={triggerRoll}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Combat Roll under traps & enemies"
          >
            🌀 <strong className="text-zinc-200">8</strong>: Roll
          </button>
        </div>

        {/* Game Result Modal (on game over or victory) */}
        {(gameState === 'gameover' || gameState === 'victory') && (
          <div className="mt-4 w-full max-w-sm animate-pop-in">
            <GameResult
              game={gameMeta}
              score={score}
              isWin={gameState === 'victory'}
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
