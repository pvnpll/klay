import { useEffect, useRef, useState, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import { isGamePaused, gameNow, gameRaf as requestAnimationFrame, cancelGameRaf as cancelAnimationFrame } from '../../utils/gameClock'
import { NokiaPhone } from './bounce/NokiaPhone'
import { nokiaSound } from './bounce/sound'
import { LEVELS } from './bounce/levels'
import { TILE, TILE_SIZE, type Ring, type Particle, type Ball, type GameMode, type LevelData } from './bounce/types'

const gameMeta = GAMES.find(g => g.id === 'bounce')!

// Screen dimensions fitting Nokia 3510i photo cutout (258 x 248)
const SCREEN_WIDTH = 258
const SCREEN_HEIGHT = 248
const HUD_HEIGHT = 48

// Physics constants
const GRAVITY = 580
const JUMP_FORCE = -340
const BIG_JUMP_FORCE = -420
const SUPER_BOUNCE_FORCE = -540
const MOVE_ACCEL = 750
const MAX_SPEED = 160
const BIG_MAX_SPEED = 180
const GROUND_FRICTION = 500
const AIR_DRAG = 60
const RESTITUTION = 0.65

export default function Bounce() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Game state hooks
  const [gameMode, setGameMode] = useState<GameMode>('title')
  const [score, setScore] = useState(2360)
  const [isGodMode, setIsGodMode] = useState(false)
  const [cheatBanner, setCheatBanner] = useState<string | null>(null)
  
  // Storage & Best Score
  const [bestScore, setBestScore] = useState<number | undefined>(() => getStats().bests[gameMeta.id])
  const [isNewBest, setIsNewBest] = useState(false)

  // Mutable Game Loop State in Refs (avoid re-render lag)
  const gameModeRef = useRef<GameMode>('title')
  useEffect(() => {
    gameModeRef.current = gameMode
  }, [gameMode])

  const currentLevelRef = useRef<LevelData>(LEVELS[0])
  const levelIdxRef = useRef(0)
  const scoreRef = useRef(2360)
  const livesRef = useRef(5)
  const isGodModeRef = useRef(false)
  const ringsRef = useRef<Ring[]>(
    LEVELS[0].rings.map((r, i) => ({
      id: i,
      x: r.x,
      y: r.y,
      radius: 9,
      collected: false,
    }))
  )
  const particlesRef = useRef<Particle[]>([])
  const checkpointRef = useRef<{ x: number; y: number } | null>(null)

  // Ball physics
  const ballRef = useRef<Ball>({
    x: LEVELS[0].startX,
    y: LEVELS[0].startY,
    vx: 0,
    vy: 0,
    radius: 10,
    rotation: 0,
    sizeType: 'normal',
    grounded: false,
    inWater: false,
    isPopping: false,
    popTimer: 0,
  })

  // Camera coordinates
  const cameraRef = useRef({
    x: Math.max(0, LEVELS[0].startX - SCREEN_WIDTH / 2),
    y: 0,
  })

  // Input states
  const inputRef = useRef({
    left: false,
    right: false,
    jump: false,
    down: false,
  })

  // Touch screen interaction state
  const touchStateRef = useRef<{
    active: boolean
    startX: number
    startY: number
    currentX: number
    currentY: number
    isTapJump: boolean
  }>({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isTapJump: false,
  })

  // Cheat code buffer
  const cheatBufferRef = useRef<string[]>([])
  const lastTimeRef = useRef<number>(0)
  const animFrameRef = useRef<number>(0)

  // Safe time for animations
  const timeNow = useCallback(() => (typeof performance !== 'undefined' ? performance.now() : Date.now()), [])

  // -------------------------------------------------------------
  // Level Initialization
  // -------------------------------------------------------------
  const loadLevel = useCallback((lvlIdx: number, keepScore = true) => {
    const level = LEVELS[lvlIdx % LEVELS.length]
    levelIdxRef.current = lvlIdx % LEVELS.length
    currentLevelRef.current = level

    checkpointRef.current = null

    // Clone rings
    ringsRef.current = level.rings.map((r, i) => ({
      id: i,
      x: r.x,
      y: r.y,
      radius: 9,
      collected: false,
    }))

    if (!keepScore) {
      scoreRef.current = 0
      setScore(0)
      livesRef.current = 5
    }

    // Reset ball
    ballRef.current = {
      x: level.startX,
      y: level.startY,
      vx: 0,
      vy: 0,
      radius: 10,
      rotation: 0,
      sizeType: 'normal',
      grounded: false,
      inWater: false,
      isPopping: false,
      popTimer: 0,
    }

    cameraRef.current = {
      x: Math.max(0, ballRef.current.x - SCREEN_WIDTH / 2),
      y: 0,
    }

    particlesRef.current = []
  }, [])

  // Start game from beginning
  const startNewGame = useCallback(() => {
    loadLevel(0, false)
    setGameMode('playing')
    nokiaSound.playKeyClick()
  }, [loadLevel])

  // Respawn after popping
  const respawnBall = useCallback(() => {
    const spawnPt = checkpointRef.current || {
      x: currentLevelRef.current.startX,
      y: currentLevelRef.current.startY,
    }

    ballRef.current = {
      x: spawnPt.x,
      y: spawnPt.y,
      vx: 0,
      vy: 0,
      radius: 10,
      rotation: 0,
      sizeType: 'normal',
      grounded: false,
      inWater: false,
      isPopping: false,
      popTimer: 0,
    }
  }, [])

  // Trigger Ball Pop (burst into fragments)
  const popBall = useCallback(() => {
    if (ballRef.current.isPopping) return
    if (isGodModeRef.current) {
      // God mode bounce off hazard
      ballRef.current.vy = -300
      nokiaSound.playBounce(1.5)
      return
    }

    ballRef.current.isPopping = true
    ballRef.current.popTimer = 0.8
    nokiaSound.playPop()

    // Spawn red rubber burst fragments
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.4
      const spd = 60 + Math.random() * 140
      particlesRef.current.push({
        x: ballRef.current.x,
        y: ballRef.current.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 60,
        life: 0.8,
        maxLife: 0.8,
        color: i % 2 === 0 ? '#ef341e' : '#c52815',
        size: 3 + Math.random() * 2,
      })
    }

    livesRef.current -= 1

    if (livesRef.current <= 0) {
      setTimeout(() => {
        nokiaSound.playGameOver()
        setGameMode('gameover')
        const { isNewBest, bestScore: newBest } = saveScore(gameMeta, scoreRef.current)
        setIsNewBest(isNewBest)
        setBestScore(newBest)
      }, 700)
    }
  }, [])

  // Cheat code checker
  const handleKeyCheat = useCallback((key: string) => {
    cheatBufferRef.current.push(key)
    if (cheatBufferRef.current.length > 6) {
      cheatBufferRef.current.shift()
    }

    // Classic Nokia Bounce cheat: 787898
    const code = cheatBufferRef.current.join('')
    if (code.includes('787898') || key === '#') {
      const newGod = !isGodModeRef.current
      isGodModeRef.current = newGod
      setIsGodMode(newGod)
      cheatBufferRef.current = []
      nokiaSound.playCheat()
      setCheatBanner(newGod ? '★ GOD MODE: ON ★' : '★ GOD MODE: OFF ★')
      setTimeout(() => setCheatBanner(null), 2500)
    }
  }, [])

  // Advance level
  const advanceToNextLevel = useCallback(() => {
    const nextIdx = levelIdxRef.current + 1
    if (nextIdx >= LEVELS.length) {
      // Won the game!
      setGameMode('won')
      nokiaSound.playLevelWin()
      const { isNewBest, bestScore: newBest } = saveScore(gameMeta, scoreRef.current)
      setIsNewBest(isNewBest)
      setBestScore(newBest)
    } else {
      loadLevel(nextIdx, true)
      setGameMode('playing')
      nokiaSound.playKeyClick()
    }
  }, [loadLevel])

  // -------------------------------------------------------------
  // Keyboard Events Handler
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }

      handleKeyCheat(e.key)

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case '4':
          inputRef.current.left = true
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
        case '6':
          inputRef.current.right = true
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
        case '2':
        case '5':
          inputRef.current.jump = true
          if (gameModeRef.current === 'title') {
            startNewGame()
          } else if (gameModeRef.current === 'level_clear') {
            advanceToNextLevel()
          } else if (gameModeRef.current === 'gameover') {
            startNewGame()
          }
          break
        case 'ArrowDown':
        case 's':
        case 'S':
        case '8':
          inputRef.current.down = true
          break
        case 'p':
        case 'P':
        case 'Escape':
          if (gameModeRef.current === 'playing') setGameMode('paused')
          else if (gameModeRef.current === 'paused') setGameMode('playing')
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case '4':
          inputRef.current.left = false
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
        case '6':
          inputRef.current.right = false
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
        case '2':
        case '5':
          inputRef.current.jump = false
          break
        case 'ArrowDown':
        case 's':
        case 'S':
        case '8':
          inputRef.current.down = false
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyCheat, startNewGame, advanceToNextLevel])

  // -------------------------------------------------------------
  // Touch Screen Handlers (Direct Touch on the Nokia LCD Screen)
  // -------------------------------------------------------------
  const handleLcdPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const touchX = e.clientX - rect.left
    const touchY = e.clientY - rect.top

    touchStateRef.current = {
      active: true,
      startX: touchX,
      startY: touchY,
      currentX: touchX,
      currentY: touchY,
      isTapJump: false,
    }

    if (gameModeRef.current === 'title') {
      startNewGame()
      return
    }
    if (gameModeRef.current === 'level_clear') {
      advanceToNextLevel()
      return
    }
    if (gameModeRef.current === 'gameover' || gameModeRef.current === 'won') {
      startNewGame()
      return
    }
    if (gameModeRef.current === 'paused') {
      setGameMode('playing')
      return
    }

    // In-game touch steering
    const normX = touchX / rect.width
    const normY = touchY / rect.height

    if (normY < 0.45) {
      inputRef.current.jump = true
      touchStateRef.current.isTapJump = true
    } else {
      if (normX < 0.45) {
        inputRef.current.left = true
        inputRef.current.right = false
      } else if (normX > 0.55) {
        inputRef.current.right = true
        inputRef.current.left = false
      } else {
        inputRef.current.jump = true
      }
    }
  }

  const handleLcdPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchStateRef.current.active || gameModeRef.current !== 'playing') return
    const rect = e.currentTarget.getBoundingClientRect()
    const touchX = e.clientX - rect.left
    const touchY = e.clientY - rect.top
    touchStateRef.current.currentX = touchX
    touchStateRef.current.currentY = touchY

    const dx = touchX - touchStateRef.current.startX
    if (Math.abs(dx) > 10) {
      if (dx < 0) {
        inputRef.current.left = true
        inputRef.current.right = false
      } else {
        inputRef.current.right = true
        inputRef.current.left = false
      }
    }
  }

  const handleLcdPointerUp = () => {
    touchStateRef.current.active = false
    inputRef.current.left = false
    inputRef.current.right = false
    inputRef.current.jump = false
  }

  // -------------------------------------------------------------
  // Nokia Keypad Callbacks
  // -------------------------------------------------------------
  const handleDirectionPress = (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => {
    if (dir === 'left') inputRef.current.left = pressed
    if (dir === 'right') inputRef.current.right = pressed
    if (dir === 'up') {
      inputRef.current.jump = pressed
      if (pressed && gameModeRef.current === 'title') startNewGame()
      if (pressed && gameModeRef.current === 'level_clear') advanceToNextLevel()
      if (pressed && gameModeRef.current === 'gameover') startNewGame()
    }
    if (dir === 'down') inputRef.current.down = pressed
  }

  const handleActionPress = (pressed: boolean) => {
    inputRef.current.jump = pressed
    if (pressed) {
      if (gameModeRef.current === 'title') startNewGame()
      else if (gameModeRef.current === 'level_clear') advanceToNextLevel()
      else if (gameModeRef.current === 'gameover') startNewGame()
      else if (gameModeRef.current === 'paused') setGameMode('playing')
    }
  }

  const handleLeftSoft = () => {
    if (gameModeRef.current === 'title') {
      startNewGame()
    } else if (gameModeRef.current === 'playing') {
      setGameMode('paused')
    } else if (gameModeRef.current === 'paused') {
      setGameMode('playing')
    } else if (gameModeRef.current === 'level_clear') {
      advanceToNextLevel()
    } else if (gameModeRef.current === 'gameover' || gameModeRef.current === 'won') {
      startNewGame()
    }
  }

  const handleRightSoft = () => {
    if (gameModeRef.current === 'playing' || gameModeRef.current === 'paused') {
      loadLevel(levelIdxRef.current, true)
      setGameMode('playing')
    } else {
      setGameMode('title')
    }
  }

  // -------------------------------------------------------------
  // Canvas Rendering (EXACTLY MATCHING THE NOKIA 3510i PHOTO)
  // -------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.imageSmoothingEnabled = false

    const playAreaHeight = SCREEN_HEIGHT - HUD_HEIGHT
    const level = currentLevelRef.current

    // In the photo:
    // Upper section: Light sky blue (#c2dff7)
    // Lower section: Deep royal/cobalt blue (#004ecc)
    ctx.fillStyle = '#c2dff7'
    ctx.fillRect(0, 0, SCREEN_WIDTH, 85)

    ctx.fillStyle = '#004ecc'
    ctx.fillRect(0, 85, SCREEN_WIDTH, SCREEN_HEIGHT - 85)

    const camX = cameraRef.current.x
    const camY = cameraRef.current.y

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, SCREEN_WIDTH, playAreaHeight)
    ctx.clip()

    ctx.translate(-Math.round(camX), -Math.round(camY))

    // Render Tiles
    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE))
    const endCol = Math.min(level.width - 1, Math.ceil((camX + SCREEN_WIDTH) / TILE_SIZE))
    const startRow = 0
    const endRow = Math.min(level.height - 1, Math.ceil((camY + playAreaHeight) / TILE_SIZE))

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = level.tiles[r][c]
        const tx = c * TILE_SIZE
        const ty = r * TILE_SIZE

        // BRICK (Terracotta Red-Orange as in photo)
        if (tile === TILE.BRICK || tile === TILE.STONE) {
          ctx.fillStyle = '#cf421b'
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE)

          // 3D Bevel highlight & shadow
          ctx.fillStyle = '#f4744e'
          ctx.fillRect(tx, ty, TILE_SIZE, 1.5)
          ctx.fillRect(tx, ty, 1.5, TILE_SIZE)

          ctx.fillStyle = '#782008'
          ctx.fillRect(tx, ty + TILE_SIZE - 1.5, TILE_SIZE, 1.5)
          ctx.fillRect(tx + TILE_SIZE - 1.5, ty, 1.5, TILE_SIZE)

          // Brick pattern inner lines
          ctx.fillStyle = '#651b06'
          ctx.fillRect(tx, ty + 10, TILE_SIZE, 1)
          ctx.fillRect(tx + 10, ty, 1, 10)
        }

        // 8-DIRECTIONAL SPIKED STAR MINE (Exactly matching top-left in photo)
        else if (tile === TILE.MINE) {
          ctx.save()
          ctx.translate(tx + 10, ty + 10)

          const centerX = 0
          const centerY = 0
          const coreRadius = 4.5

          const angles = [
            0,
            Math.PI * 0.25,
            Math.PI * 0.5,
            Math.PI * 0.75,
            Math.PI,
            Math.PI * 1.25,
            Math.PI * 1.5,
            Math.PI * 1.75
          ]

          ctx.fillStyle = '#222838'
          angles.forEach((ang, idx) => {
            const length = idx % 2 === 0 ? 9.5 : 7.5
            const width = 2.5
            const tipX = Math.cos(ang) * length
            const tipY = Math.sin(ang) * length

            const perp = ang + Math.PI * 0.5
            const b1X = Math.cos(perp) * width
            const b1Y = Math.sin(perp) * width
            const b2X = -b1X
            const b2Y = -b1Y

            ctx.beginPath()
            ctx.moveTo(tipX, tipY)
            ctx.lineTo(b1X, b1Y)
            ctx.lineTo(b2X, b2Y)
            ctx.closePath()
            ctx.fill()

            if (idx % 2 === 0) {
              ctx.strokeStyle = '#94a3b8'
              ctx.lineWidth = 1
              ctx.stroke()
            }
          })

          ctx.beginPath()
          ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2)
          ctx.fillStyle = '#334155'
          ctx.fill()
          ctx.lineWidth = 1.2
          ctx.strokeStyle = '#0f172a'
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(centerX - 1, centerY - 1, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = '#67e8f9'
          ctx.fill()

          ctx.restore()
        }

        // SPIKE UP
        else if (tile === TILE.SPIKE_UP) {
          ctx.fillStyle = '#475569'
          ctx.beginPath()
          ctx.moveTo(tx, ty + TILE_SIZE)
          ctx.lineTo(tx + TILE_SIZE / 2, ty + 2)
          ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE)
          ctx.closePath()
          ctx.fill()
          ctx.fillStyle = '#f8fafc'
          ctx.fillRect(tx + TILE_SIZE / 2 - 1, ty + 2, 2, 4)
        }

        // TRAMPOLINE
        else if (tile === TILE.TRAMPOLINE) {
          ctx.fillStyle = '#f59e0b'
          ctx.fillRect(tx, ty + 4, TILE_SIZE, TILE_SIZE - 4)
          ctx.fillStyle = '#fef08a'
          ctx.fillRect(tx, ty + 4, TILE_SIZE, 3)
          ctx.fillStyle = '#1e293b'
          ctx.fillRect(tx + 4, ty + 10, 4, 6)
          ctx.fillRect(tx + 12, ty + 10, 4, 6)
        }

        // WATER
        else if (tile === TILE.WATER) {
          ctx.fillStyle = 'rgba(37, 99, 235, 0.75)'
          ctx.fillRect(tx, ty + 4, TILE_SIZE, TILE_SIZE - 4)
          ctx.fillStyle = 'rgba(147, 197, 253, 0.9)'
          const waveY = ty + 4 + Math.sin((timeNow() * 0.005) + c) * 1.5
          ctx.fillRect(tx, waveY, TILE_SIZE, 2)
        }

        // EXPANDER PUMP
        else if (tile === TILE.PUMP_EXPAND) {
          ctx.fillStyle = '#0284c7'
          ctx.fillRect(tx + 3, ty + 2, 14, 16)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 8px monospace'
          ctx.fillText('◄►', tx + 3, ty + 13)
        }

        // DEFLATER PUMP
        else if (tile === TILE.PUMP_DEFLATE) {
          ctx.fillStyle = '#d97706'
          ctx.fillRect(tx + 3, ty + 2, 14, 16)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 8px monospace'
          ctx.fillText('►◄', tx + 3, ty + 13)
        }

        // CHECKPOINT FLAG
        else if (tile === TILE.CHECKPOINT) {
          const isActive = checkpointRef.current && checkpointRef.current.x === tx + 10
          ctx.fillStyle = '#64748b'
          ctx.fillRect(tx + 4, ty + 2, 2, 16)
          ctx.fillStyle = isActive ? '#10b981' : '#f59e0b'
          ctx.beginPath()
          ctx.moveTo(tx + 6, ty + 3)
          ctx.lineTo(tx + 16, ty + 7)
          ctx.lineTo(tx + 6, ty + 11)
          ctx.closePath()
          ctx.fill()
        }

        // EXIT GATE
        else if (tile === TILE.EXIT) {
          const uncollected = ringsRef.current.filter(r => !r.collected).length
          const isOpen = uncollected === 0

          ctx.fillStyle = isOpen ? '#10b981' : '#991b1b'
          ctx.fillRect(tx + 2, ty + 1, 16, 19)

          if (isOpen) {
            ctx.fillStyle = '#fde047'
            ctx.font = 'bold 9px monospace'
            ctx.fillText('EXIT', tx + 2, ty + 14)
          } else {
            ctx.fillStyle = '#fca5a5'
            ctx.font = 'bold 9px monospace'
            ctx.fillText('🔒', tx + 4, ty + 14)
          }
        }
      }
    }

    // Render Golden Rings in level
    ringsRef.current.forEach(ring => {
      if (ring.collected) return
      ctx.save()
      ctx.translate(ring.x, ring.y)

      const shimmer = Math.sin(timeNow() * 0.005 + ring.id)
      const scaleX = 0.75 + shimmer * 0.25

      ctx.scale(scaleX, 1)

      ctx.beginPath()
      ctx.ellipse(0, 0, 4.5, 9, 0, 0, Math.PI * 2)
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#facc15'
      ctx.stroke()

      ctx.lineWidth = 1
      ctx.strokeStyle = '#b45309'
      ctx.stroke()

      ctx.restore()
    })

    // Render Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // Render Red Ball (solid red with crisp black outline & white specular highlight)
    const ball = ballRef.current
    if (!ball.isPopping) {
      ctx.save()
      ctx.translate(ball.x, ball.y)
      ctx.rotate(ball.rotation)

      if (isGodModeRef.current) {
        ctx.beginPath()
        ctx.arc(0, 0, ball.radius + 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(250, 204, 21, 0.45)'
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(0, 0, ball.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#eb3b1c'
      ctx.fill()

      ctx.lineWidth = 1.6
      ctx.strokeStyle = '#111118'
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(-ball.radius * 0.35, -ball.radius * 0.35, ball.radius * 0.25, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fill()

      ctx.restore()
    }

    ctx.restore() // Restore clipping to game area

    // -------------------------------------------------------------
    // HUD AT THE BOTTOM (EXACTLY MATCHING THE USER'S PHOTO)
    // -------------------------------------------------------------
    ctx.fillStyle = '#004ecc'
    ctx.fillRect(0, playAreaHeight, SCREEN_WIDTH, HUD_HEIGHT)

    // HUD Row 1:
    // Left: 5 Red Balls for Lives
    // Right: 7-digit Score (e.g. 0002360)
    const hudTopY = playAreaHeight + 16

    for (let i = 0; i < 5; i++) {
      const bx = 16 + i * 14
      const by = hudTopY

      if (i < livesRef.current) {
        ctx.beginPath()
        ctx.arc(bx, by, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#ef341e'
        ctx.fill()
        ctx.lineWidth = 1
        ctx.strokeStyle = '#0f172a'
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(bx - 1.5, by - 1.5, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(bx, by, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
        ctx.fill()
      }
    }

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 15px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(scoreRef.current.toString().padStart(7, '0'), SCREEN_WIDTH - 14, hudTopY + 5)

    // HUD Row 2:
    // Below lives: Vertical Golden Diamond Rings (◊ ◊ ◊)
    const hudBottomY = playAreaHeight + 32
    const remainingRings = ringsRef.current.filter(r => !r.collected).length

    for (let r = 0; r < Math.min(3, remainingRings); r++) {
      const rx = 16 + r * 11
      const ry = hudBottomY

      ctx.beginPath()
      ctx.ellipse(rx, ry, 3.5, 6, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#facc15'
      ctx.fill()
      ctx.lineWidth = 1
      ctx.strokeStyle = '#b45309'
      ctx.stroke()

      ctx.beginPath()
      ctx.ellipse(rx, ry, 1.5, 3.5, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#004ecc'
      ctx.fill()
    }

    // Tiny orange square on bottom-left
    ctx.fillStyle = '#f97316'
    ctx.fillRect(8, SCREEN_HEIGHT - 8, 4, 4)

    // -------------------------------------------------------------
    // OVERLAYS (Title, Menus, Pause)
    // -------------------------------------------------------------
    if (gameModeRef.current === 'title') {
      ctx.fillStyle = 'rgba(0, 30, 80, 0.85)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      ctx.font = '900 24px monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#7f1d1d'
      ctx.fillText('BOUNCE', SCREEN_WIDTH / 2 + 1, 65)
      ctx.fillStyle = '#ef4444'
      ctx.fillText('BOUNCE', SCREEN_WIDTH / 2, 64)

      ctx.fillStyle = '#fde047'
      ctx.font = 'bold 10px monospace'
      ctx.fillText('NOKIA 3510i', SCREEN_WIDTH / 2, 84)

      const demoBounce = Math.abs(Math.sin(timeNow() * 0.005)) * 18
      const demoY = 120 - demoBounce
      ctx.beginPath()
      ctx.arc(SCREEN_WIDTH / 2, demoY, 11, 0, Math.PI * 2)
      ctx.fillStyle = '#eb3b1c'
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#111118'
      ctx.stroke()

      ctx.fillStyle = '#10b981'
      ctx.fillRect(SCREEN_WIDTH / 2 - 60, 145, 120, 26)
      ctx.fillStyle = '#022c22'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('▶ TAP TO START', SCREEN_WIDTH / 2, 162)
    }

    else if (gameModeRef.current === 'paused') {
      ctx.fillStyle = 'rgba(0, 30, 80, 0.85)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      ctx.fillStyle = '#fde047'
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSED', SCREEN_WIDTH / 2, 85)

      ctx.fillStyle = '#10b981'
      ctx.fillRect(SCREEN_WIDTH / 2 - 50, 105, 100, 26)
      ctx.fillStyle = '#022c22'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('▶ RESUME', SCREEN_WIDTH / 2, 122)
    }

    else if (gameModeRef.current === 'level_clear') {
      ctx.fillStyle = 'rgba(0, 30, 80, 0.85)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      ctx.fillStyle = '#4ade80'
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('LEVEL CLEARED!', SCREEN_WIDTH / 2, 70)

      ctx.fillStyle = '#fde047'
      ctx.font = 'bold 11px monospace'
      ctx.fillText(`SCORE: ${scoreRef.current}`, SCREEN_WIDTH / 2, 95)

      ctx.fillStyle = '#10b981'
      ctx.fillRect(SCREEN_WIDTH / 2 - 55, 115, 110, 26)
      ctx.fillStyle = '#022c22'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('▶ NEXT LEVEL', SCREEN_WIDTH / 2, 132)
    }

    else if (gameModeRef.current === 'gameover') {
      ctx.fillStyle = 'rgba(30, 5, 5, 0.88)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      ctx.fillStyle = '#f87171'
      ctx.font = 'bold 18px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, 75)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px monospace'
      ctx.fillText(`SCORE: ${scoreRef.current}`, SCREEN_WIDTH / 2, 100)

      ctx.fillStyle = '#ef4444'
      ctx.fillRect(SCREEN_WIDTH / 2 - 55, 120, 110, 26)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('🔄 PLAY AGAIN', SCREEN_WIDTH / 2, 137)
    }

    else if (gameModeRef.current === 'won') {
      ctx.fillStyle = 'rgba(5, 30, 15, 0.88)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      ctx.fillStyle = '#facc15'
      ctx.font = 'bold 18px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('🏆 YOU WIN! 🏆', SCREEN_WIDTH / 2, 75)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px monospace'
      ctx.fillText(`FINAL: ${scoreRef.current}`, SCREEN_WIDTH / 2, 100)

      ctx.fillStyle = '#4ade80'
      ctx.fillRect(SCREEN_WIDTH / 2 - 55, 120, 110, 26)
      ctx.fillStyle = '#052e16'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('▶ PLAY AGAIN', SCREEN_WIDTH / 2, 137)
    }

    if (cheatBanner) {
      ctx.fillStyle = 'rgba(234, 179, 8, 0.95)'
      ctx.fillRect(10, 6, SCREEN_WIDTH - 20, 20)
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(cheatBanner, SCREEN_WIDTH / 2, 20)
    }
  }, [cheatBanner, timeNow])

  // Helper: Is tile solid for blocking
  const isSolid = (tile?: number) => tile === TILE.BRICK || tile === TILE.STONE

  // -------------------------------------------------------------
  // Physics & Game Loop (Separate X and Y pass - Zero Seam Snags!)
  // -------------------------------------------------------------
  useEffect(() => {
    lastTimeRef.current = gameNow()

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.04)
      lastTimeRef.current = time

      if (!isGamePaused() && gameModeRef.current === 'playing') {
        const ball = ballRef.current
        const level = currentLevelRef.current

        if (ball.isPopping) {
          ball.popTimer -= dt
          if (ball.popTimer <= 0) {
            if (livesRef.current > 0) {
              respawnBall()
            }
          }
        } else {
          // --- HORIZONTAL INPUT & ACCELERATION ---
          const maxSpd = ball.sizeType === 'big' ? BIG_MAX_SPEED : MAX_SPEED
          if (inputRef.current.left) {
            ball.vx = Math.max(ball.vx - MOVE_ACCEL * dt, -maxSpd)
          } else if (inputRef.current.right) {
            ball.vx = Math.min(ball.vx + MOVE_ACCEL * dt, maxSpd)
          } else {
            if (ball.grounded) {
              if (ball.vx > 0) ball.vx = Math.max(0, ball.vx - GROUND_FRICTION * dt)
              else if (ball.vx < 0) ball.vx = Math.min(0, ball.vx + GROUND_FRICTION * dt)
            } else {
              if (ball.vx > 0) ball.vx = Math.max(0, ball.vx - AIR_DRAG * dt)
              else if (ball.vx < 0) ball.vx = Math.min(0, ball.vx + AIR_DRAG * dt)
            }
          }

          ball.rotation += (ball.vx * dt) / ball.radius

          // --- VERTICAL FORCES & WATER PHYSICS ---
          if (ball.inWater) {
            if (ball.sizeType === 'big') {
              ball.vy += -380 * dt
              ball.vy *= 0.94
            } else {
              ball.vy += 140 * dt
              ball.vy *= 0.92
            }
          } else {
            ball.vy += GRAVITY * dt
          }

          // Jump Input
          if (inputRef.current.jump && (ball.grounded || ball.inWater)) {
            const jForce = ball.sizeType === 'big' ? BIG_JUMP_FORCE : JUMP_FORCE
            ball.vy = jForce
            ball.grounded = false
            nokiaSound.playBounce(1.2)
          }

          // ---------------------------------------------------------
          // PASS 1: X-AXIS MOVEMENT & COLLISION (No Seam Snags!)
          // ---------------------------------------------------------
          const oldX = ball.x
          ball.x += ball.vx * dt

          const mapW = level.width * TILE_SIZE
          if (ball.x - ball.radius < 0) {
            ball.x = ball.radius
            ball.vx = 0
          }
          if (ball.x + ball.radius > mapW) {
            ball.x = mapW - ball.radius
            ball.vx = 0
          }

          let minCol = Math.max(0, Math.floor((ball.x - ball.radius - 2) / TILE_SIZE))
          let maxCol = Math.min(level.width - 1, Math.floor((ball.x + ball.radius + 2) / TILE_SIZE))
          let minRow = Math.max(0, Math.floor((ball.y - ball.radius - 2) / TILE_SIZE))
          let maxRow = Math.min(level.height - 1, Math.floor((ball.y + ball.radius + 2) / TILE_SIZE))

          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              const tile = level.tiles[r]?.[c]
              if (isSolid(tile)) {
                const tileLeft = c * TILE_SIZE
                const tileRight = tileLeft + TILE_SIZE
                const tileTop = r * TILE_SIZE
                const tileBottom = tileTop + TILE_SIZE

                // Ball intersects vertically with this tile
                if (ball.y + ball.radius * 0.7 > tileTop && ball.y - ball.radius * 0.7 < tileBottom) {
                  // Moving right into left wall
                  if (ball.vx > 0 && ball.x + ball.radius > tileLeft && oldX + ball.radius <= tileLeft + 5) {
                    // Only block if neighbor to the left is EMPTY (exposed face!)
                    if (!isSolid(level.tiles[r]?.[c - 1])) {
                      ball.x = tileLeft - ball.radius
                      ball.vx = 0
                    }
                  }
                  // Moving left into right wall
                  else if (ball.vx < 0 && ball.x - ball.radius < tileRight && oldX - ball.radius >= tileRight - 5) {
                    // Only block if neighbor to the right is EMPTY (exposed face!)
                    if (!isSolid(level.tiles[r]?.[c + 1])) {
                      ball.x = tileRight + ball.radius
                      ball.vx = 0
                    }
                  }
                }
              }
            }
          }

          // ---------------------------------------------------------
          // PASS 2: Y-AXIS MOVEMENT & COLLISION (Smooth ground bounce!)
          // ---------------------------------------------------------
          const oldY = ball.y
          ball.y += ball.vy * dt
          ball.grounded = false
          ball.inWater = false

          minCol = Math.max(0, Math.floor((ball.x - ball.radius - 2) / TILE_SIZE))
          maxCol = Math.min(level.width - 1, Math.floor((ball.x + ball.radius + 2) / TILE_SIZE))
          minRow = Math.max(0, Math.floor((ball.y - ball.radius - 2) / TILE_SIZE))
          maxRow = Math.min(level.height - 1, Math.floor((ball.y + ball.radius + 2) / TILE_SIZE))

          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              const tile = level.tiles[r]?.[c]

              if (isSolid(tile)) {
                const tileLeft = c * TILE_SIZE
                const tileRight = tileLeft + TILE_SIZE
                const tileTop = r * TILE_SIZE
                const tileBottom = tileTop + TILE_SIZE

                // Ball intersects horizontally with this tile
                if (ball.x + ball.radius * 0.7 > tileLeft && ball.x - ball.radius * 0.7 < tileRight) {
                  // Falling down onto floor
                  if (ball.vy >= 0 && ball.y + ball.radius >= tileTop && oldY + ball.radius <= tileTop + 8) {
                    // Only land if block above is NOT solid (exposed floor!)
                    if (!isSolid(level.tiles[r - 1]?.[c])) {
                      ball.y = tileTop - ball.radius
                      ball.grounded = true
                      if (ball.vy > 30) {
                        ball.vy = -ball.vy * RESTITUTION
                        if (Math.abs(ball.vy) < 25) ball.vy = 0
                        nokiaSound.playBounce(Math.min(2, Math.abs(ball.vy) / 100))
                      } else {
                        ball.vy = 0
                      }
                    }
                  }
                  // Moving up into ceiling
                  else if (ball.vy < 0 && ball.y - ball.radius <= tileBottom && oldY - ball.radius >= tileBottom - 8) {
                    if (!isSolid(level.tiles[r + 1]?.[c])) {
                      ball.y = tileBottom + ball.radius
                      ball.vy = 0
                    }
                  }
                }
              }

              // Trampoline
              else if (tile === TILE.TRAMPOLINE) {
                const tileLeft = c * TILE_SIZE
                const tileRight = tileLeft + TILE_SIZE
                const tileTop = r * TILE_SIZE
                if (
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius >= tileTop &&
                  ball.y - ball.radius < tileTop + 8 &&
                  ball.vy > 0
                ) {
                  ball.y = tileTop - ball.radius
                  ball.vy = SUPER_BOUNCE_FORCE
                  ball.grounded = false
                  nokiaSound.playSuperBounce()
                }
              }

              // Spikes & Spiked Mine
              else if (
                tile === TILE.SPIKE_UP ||
                tile === TILE.SPIKE_DOWN ||
                tile === TILE.SPIKE_LEFT ||
                tile === TILE.SPIKE_RIGHT ||
                tile === TILE.MINE
              ) {
                const tileLeft = c * TILE_SIZE
                const tileRight = tileLeft + TILE_SIZE
                const tileTop = r * TILE_SIZE
                const tileBottom = tileTop + TILE_SIZE
                const margin = tile === TILE.MINE ? 1 : 2

                if (
                  ball.x + ball.radius * 0.7 > tileLeft + margin &&
                  ball.x - ball.radius * 0.7 < tileRight - margin &&
                  ball.y + ball.radius * 0.7 > tileTop + margin &&
                  ball.y - ball.radius * 0.7 < tileBottom - margin
                ) {
                  popBall()
                }
              }

              // Water
              else if (tile === TILE.WATER) {
                const tileLeft = c * TILE_SIZE
                const tileRight = tileLeft + TILE_SIZE
                const tileTop = r * TILE_SIZE
                const tileBottom = tileTop + TILE_SIZE
                if (
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius > tileTop + 4 &&
                  ball.y - ball.radius < tileBottom
                ) {
                  ball.inWater = true
                }
              }

              // Pumps
              else if (tile === TILE.PUMP_EXPAND) {
                const tileLeft = c * TILE_SIZE
                const tileRight = tileLeft + TILE_SIZE
                const tileTop = r * TILE_SIZE
                const tileBottom = tileTop + TILE_SIZE
                if (
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius > tileTop &&
                  ball.y - ball.radius < tileBottom
                ) {
                  if (ball.sizeType !== 'big') {
                    ball.sizeType = 'big'
                    ball.radius = 16
                    nokiaSound.playPump(true)
                  }
                }
              }
              else if (tile === TILE.PUMP_DEFLATE) {
                const tileLeft = c * TILE_SIZE
                const tileRight = tileLeft + TILE_SIZE
                const tileTop = r * TILE_SIZE
                const tileBottom = tileTop + TILE_SIZE
                if (
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius > tileTop &&
                  ball.y - ball.radius < tileBottom
                ) {
                  if (ball.sizeType !== 'normal') {
                    ball.sizeType = 'normal'
                    ball.radius = 10
                    nokiaSound.playPump(false)
                  }
                }
              }

              // Checkpoint Flag
              else if (tile === TILE.CHECKPOINT) {
                const tileLeft = c * TILE_SIZE
                const tileRight = tileLeft + TILE_SIZE
                const tileTop = r * TILE_SIZE
                const tileBottom = tileTop + TILE_SIZE
                if (
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius > tileTop &&
                  ball.y - ball.radius < tileBottom
                ) {
                  const cpCoord = { x: tileLeft + 10, y: tileTop + 10 }
                  if (!checkpointRef.current || checkpointRef.current.x !== cpCoord.x) {
                    checkpointRef.current = cpCoord
                    nokiaSound.playCheckpoint()
                  }
                }
              }

              // Exit Gate
              else if (tile === TILE.EXIT) {
                const tileLeft = c * TILE_SIZE
                const tileRight = tileLeft + TILE_SIZE
                const tileTop = r * TILE_SIZE
                const tileBottom = tileTop + TILE_SIZE
                const uncollected = ringsRef.current.filter(r => !r.collected).length
                if (
                  uncollected === 0 &&
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius > tileTop &&
                  ball.y - ball.radius < tileBottom
                ) {
                  scoreRef.current += 1000 + livesRef.current * 250
                  setScore(scoreRef.current)
                  setGameMode('level_clear')
                  nokiaSound.playLevelWin()
                }
              }
            }
          }

          // Fall off map check
          const mapH = level.height * TILE_SIZE
          if (ball.y > mapH + 30) {
            popBall()
          }

          // --- RING PICKUPS ---
          ringsRef.current.forEach(ring => {
            if (ring.collected) return
            const dx = ball.x - ring.x
            const dy = ball.y - ring.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < ball.radius + ring.radius + 3) {
              ring.collected = true
              scoreRef.current += 500
              setScore(scoreRef.current)
              nokiaSound.playRing()

              const remaining = ringsRef.current.filter(r => !r.collected).length
              if (remaining === 0) {
                nokiaSound.playExitOpen()
              }

              for (let p = 0; p < 8; p++) {
                const angle = Math.random() * Math.PI * 2
                const spd = 30 + Math.random() * 80
                particlesRef.current.push({
                  x: ring.x,
                  y: ring.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  life: 0.5,
                  maxLife: 0.5,
                  color: '#facc15',
                  size: 2,
                })
              }
            }
          })
        }

        // --- CAMERA FOLLOW ---
        const targetCamX = ball.x - SCREEN_WIDTH / 2
        const maxCamX = Math.max(0, level.width * TILE_SIZE - SCREEN_WIDTH)
        cameraRef.current.x += (Math.max(0, Math.min(targetCamX, maxCamX)) - cameraRef.current.x) * 0.15

        const playAreaHeight = SCREEN_HEIGHT - HUD_HEIGHT
        const targetCamY = ball.y > 60 ? 0 : Math.max(0, ball.y - playAreaHeight / 2)
        const maxCamY = Math.max(0, level.height * TILE_SIZE - playAreaHeight)
        cameraRef.current.y += (Math.max(0, Math.min(targetCamY, maxCamY)) - cameraRef.current.y) * 0.15

        // Update particle lifetimes
        particlesRef.current.forEach(p => {
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.vy += 260 * dt
          p.life -= dt
        })
        particlesRef.current = particlesRef.current.filter(p => p.life > 0)
      }

      // Render Frame
      renderCanvas()

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [popBall, respawnBall, renderCanvas])

  return (
    <GameLayout title={gameMeta.name} description={gameMeta.description} rules={gameMeta.rules}>
      <div className="flex flex-col items-center justify-center w-full py-1">
        
        {/* Top Header stats info */}
        <div className="flex justify-between items-center w-full max-w-[350px] mb-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold">
          <span className="text-red-400 flex items-center gap-1">
            🔴 NOKIA 3510i · BOUNCE
          </span>
          <span className="text-amber-300">
            👑 BEST: <span className="text-white ml-1">{bestScore || 0}</span>
          </span>
        </div>

        {/* EXACT NOKIA 3510i MOBILE PHONE CHASSIS (Real physical handset photo) */}
        <NokiaPhone
          onLeftSoft={handleLeftSoft}
          onRightSoft={handleRightSoft}
          onDirectionPress={handleDirectionPress}
          onActionPress={handleActionPress}
          onKeypadPress={handleKeyCheat}
          onEndPress={() => setGameMode('paused')}
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
            className="w-full h-full block cursor-pointer touch-none"
            title="Nokia 3510i Screen (Touch or Keypad to play)"
          />
        </NokiaPhone>

        {/* Game Result Modal (on game over or victory) */}
        {(gameMode === 'gameover' || gameMode === 'won') && (
          <div className="mt-4 w-full max-w-sm animate-pop-in">
            <GameResult
              game={gameMeta}
              score={score}
              isWin={gameMode === 'won'}
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
