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

// Canvas display resolution inside Nokia LCD
const SCREEN_WIDTH = 260
const SCREEN_HEIGHT = 260

// Physics constants
const GRAVITY = 600
const JUMP_FORCE = -340
const BIG_JUMP_FORCE = -420
const SUPER_BOUNCE_FORCE = -540
const MOVE_ACCEL = 700
const MAX_SPEED = 160
const BIG_MAX_SPEED = 180
const GROUND_FRICTION = 550
const AIR_DRAG = 80
const RESTITUTION = 0.65

export default function Bounce() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Game state hooks
  const [gameMode, setGameMode] = useState<GameMode>('title')
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [ringsLeft, setRingsLeft] = useState(() => LEVELS[0].rings.length)
  const [ringsTotal, setRingsTotal] = useState(() => LEVELS[0].rings.length)
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
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
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
    radius: 11,
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
    y: Math.max(0, LEVELS[0].startY - SCREEN_HEIGHT / 2),
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
    setCurrentLevelIdx(lvlIdx % LEVELS.length)

    checkpointRef.current = null

    // Clone rings
    ringsRef.current = level.rings.map((r, i) => ({
      id: i,
      x: r.x,
      y: r.y,
      radius: 9,
      collected: false,
    }))

    setRingsLeft(ringsRef.current.length)
    setRingsTotal(ringsRef.current.length)

    if (!keepScore) {
      scoreRef.current = 0
      setScore(0)
      livesRef.current = 3
      setLives(3)
    }

    // Reset ball
    ballRef.current = {
      x: level.startX,
      y: level.startY,
      vx: 0,
      vy: 0,
      radius: 11,
      rotation: 0,
      sizeType: 'normal',
      grounded: false,
      inWater: false,
      isPopping: false,
      popTimer: 0,
    }

    cameraRef.current = {
      x: Math.max(0, ballRef.current.x - SCREEN_WIDTH / 2),
      y: Math.max(0, ballRef.current.y - SCREEN_HEIGHT / 2),
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
      radius: 11,
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
        color: i % 2 === 0 ? '#ef4444' : '#dc2626',
        size: 3 + Math.random() * 2,
      })
    }

    livesRef.current -= 1
    setLives(livesRef.current)

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
      setCheatBanner(newGod ? '★ GOD MODE: ACTIVATED ★' : '★ GOD MODE: DEACTIVATED ★')
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
      // Prevent scrolling when playing
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
  // Touch Screen Handlers (on the Nokia LCD canvas)
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

    // Title / Menu / Level-Clear Tap
    if (gameModeRef.current === 'title') {
      startNewGame()
      return
    }
    if (gameModeRef.current === 'level_clear') {
      advanceToNextLevel()
      return
    }
    if (gameModeRef.current === 'gameover') {
      startNewGame()
      return
    }
    if (gameModeRef.current === 'won') {
      startNewGame()
      return
    }
    if (gameModeRef.current === 'paused') {
      setGameMode('playing')
      return
    }

    // In-game touch steer / tap jump
    const normX = touchX / rect.width
    const normY = touchY / rect.height

    if (normY < 0.45) {
      // Tap top half -> Jump!
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
        // Center tap -> Jump
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
    if (Math.abs(dx) > 15) {
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

  // Left softkey: Menu / Pause / Start
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

  // Right softkey: Reset / Exit / Mute
  const handleRightSoft = () => {
    if (gameModeRef.current === 'playing' || gameModeRef.current === 'paused') {
      // Restart current level
      loadLevel(levelIdxRef.current, true)
      setGameMode('playing')
    } else {
      setGameMode('title')
    }
  }

  // -------------------------------------------------------------
  // Canvas Rendering (Pixel-Art Retro Style)
  // -------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.imageSmoothingEnabled = false

    // Clear background: Retro sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT)
    skyGradient.addColorStop(0, '#5ea5dc')
    skyGradient.addColorStop(0.7, '#88c6ec')
    skyGradient.addColorStop(1, '#a6ddf6')
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    const camX = cameraRef.current.x
    const camY = cameraRef.current.y
    const level = currentLevelRef.current

    // Distant Hills (Parallax background)
    ctx.fillStyle = '#4c983d'
    ctx.beginPath()
    ctx.ellipse(SCREEN_WIDTH * 0.3 - (camX * 0.1) % 200, SCREEN_HEIGHT - 30, 160, 40, 0, 0, Math.PI * 2)
    ctx.ellipse(SCREEN_WIDTH * 0.8 - (camX * 0.1) % 200, SCREEN_HEIGHT - 20, 190, 50, 0, 0, Math.PI * 2)
    ctx.fill()

    // Parallax Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    const cloudOffsets = [30, 120, 210]
    cloudOffsets.forEach((cx, idx) => {
      const px = (cx - camX * 0.15 + SCREEN_WIDTH) % (SCREEN_WIDTH + 80) - 40
      const py = 25 + idx * 22
      ctx.beginPath()
      ctx.arc(px, py, 14, 0, Math.PI * 2)
      ctx.arc(px + 12, py - 4, 11, 0, Math.PI * 2)
      ctx.arc(px + 22, py - 4, 12, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.translate(-Math.round(camX), -Math.round(camY))

    // Render Tiles
    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE))
    const endCol = Math.min(level.width - 1, Math.ceil((camX + SCREEN_WIDTH) / TILE_SIZE))
    const startRow = Math.max(0, Math.floor(camY / TILE_SIZE))
    const endRow = Math.min(level.height - 1, Math.ceil((camY + SCREEN_HEIGHT) / TILE_SIZE))

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = level.tiles[r][c]
        const tx = c * TILE_SIZE
        const ty = r * TILE_SIZE

        // BRICK
        if (tile === TILE.BRICK) {
          ctx.fillStyle = '#ba4a26'
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE)
          // Brick border bevel
          ctx.fillStyle = '#e27448'
          ctx.fillRect(tx, ty, TILE_SIZE, 2)
          ctx.fillRect(tx, ty, 2, TILE_SIZE)
          ctx.fillStyle = '#7c2b12'
          ctx.fillRect(tx, ty + TILE_SIZE - 2, TILE_SIZE, 2)
          ctx.fillRect(tx + TILE_SIZE - 2, ty, 2, TILE_SIZE)
          // Inner brick seam
          ctx.fillStyle = '#61210d'
          ctx.fillRect(tx + 2, ty + 10, TILE_SIZE - 4, 1)
        }

        // STONE
        else if (tile === TILE.STONE) {
          ctx.fillStyle = '#64748b'
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE)
          ctx.fillStyle = '#94a3b8'
          ctx.fillRect(tx, ty, TILE_SIZE, 2)
          ctx.fillRect(tx, ty, 2, TILE_SIZE)
          ctx.fillStyle = '#334155'
          ctx.fillRect(tx, ty + TILE_SIZE - 2, TILE_SIZE, 2)
          ctx.fillRect(tx + TILE_SIZE - 2, ty, 2, TILE_SIZE)
        }

        // SPIKE UP
        else if (tile === TILE.SPIKE_UP) {
          ctx.fillStyle = '#475569'
          ctx.beginPath()
          ctx.moveTo(tx, ty + TILE_SIZE)
          ctx.lineTo(tx + TILE_SIZE / 2, ty)
          ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE)
          ctx.closePath()
          ctx.fill()
          // Chrome tip highlight
          ctx.fillStyle = '#f8fafc'
          ctx.beginPath()
          ctx.moveTo(tx + TILE_SIZE / 2 - 2, ty + 5)
          ctx.lineTo(tx + TILE_SIZE / 2, ty)
          ctx.lineTo(tx + TILE_SIZE / 2 + 2, ty + 5)
          ctx.closePath()
          ctx.fill()
        }

        // SPIKE DOWN
        else if (tile === TILE.SPIKE_DOWN) {
          ctx.fillStyle = '#475569'
          ctx.beginPath()
          ctx.moveTo(tx, ty)
          ctx.lineTo(tx + TILE_SIZE / 2, ty + TILE_SIZE)
          ctx.lineTo(tx + TILE_SIZE, ty)
          ctx.closePath()
          ctx.fill()
        }

        // TRAMPOLINE
        else if (tile === TILE.TRAMPOLINE) {
          ctx.fillStyle = '#f59e0b'
          ctx.fillRect(tx, ty + 4, TILE_SIZE, TILE_SIZE - 4)
          ctx.fillStyle = '#fef08a'
          ctx.fillRect(tx, ty + 4, TILE_SIZE, 3)
          // Hazard chevron stripes
          ctx.fillStyle = '#1e293b'
          ctx.fillRect(tx + 4, ty + 10, 4, 6)
          ctx.fillRect(tx + 12, ty + 10, 4, 6)
        }

        // WATER
        else if (tile === TILE.WATER) {
          ctx.fillStyle = 'rgba(37, 99, 235, 0.65)'
          ctx.fillRect(tx, ty + 4, TILE_SIZE, TILE_SIZE - 4)
          // Animated ripple wave on top
          ctx.fillStyle = 'rgba(147, 197, 253, 0.8)'
          const waveY = ty + 4 + Math.sin((timeNow() * 0.005) + c) * 1.5
          ctx.fillRect(tx, waveY, TILE_SIZE, 2)
        }

        // EXPANDER PUMP (Big Ball)
        else if (tile === TILE.PUMP_EXPAND) {
          ctx.fillStyle = '#0284c7'
          ctx.fillRect(tx + 3, ty + 2, 14, 16)
          ctx.fillStyle = '#ffffff'
          // Draw expand arrows: ◄ ►
          ctx.font = 'bold 9px monospace'
          ctx.fillText('◄►', tx + 3, ty + 13)
        }

        // DEFLATER PUMP (Small/Normal Ball)
        else if (tile === TILE.PUMP_DEFLATE) {
          ctx.fillStyle = '#d97706'
          ctx.fillRect(tx + 3, ty + 2, 14, 16)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 9px monospace'
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
            // Pulsing golden doorway with arrow
            ctx.fillStyle = '#fde047'
            ctx.font = 'bold 10px monospace'
            ctx.fillText('EXIT', tx + 2, ty + 14)
          } else {
            // Padlock symbol
            ctx.fillStyle = '#fca5a5'
            ctx.font = 'bold 9px monospace'
            ctx.fillText('🔒', tx + 4, ty + 14)
          }
        }
      }
    }

    // Render Golden Rings
    ringsRef.current.forEach(ring => {
      if (ring.collected) return
      ctx.save()
      ctx.translate(ring.x, ring.y)

      // Ring Shimmer Rotation
      const shimmer = Math.sin(timeNow() * 0.005 + ring.id)
      const scaleX = 0.65 + shimmer * 0.35

      ctx.scale(scaleX, 1)

      // Outer gold ring
      ctx.beginPath()
      ctx.arc(0, 0, ring.radius, 0, Math.PI * 2)
      ctx.lineWidth = 3
      ctx.strokeStyle = '#eab308'
      ctx.stroke()

      // Inner gleam
      ctx.beginPath()
      ctx.arc(0, 0, ring.radius - 1, -Math.PI * 0.5, 0)
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#ffffff'
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

    // Render Ball (if not popped)
    const ball = ballRef.current
    if (!ball.isPopping) {
      ctx.save()
      ctx.translate(ball.x, ball.y)
      ctx.rotate(ball.rotation)

      // God Mode Shimmer Aura
      if (isGodModeRef.current) {
        ctx.beginPath()
        ctx.arc(0, 0, ball.radius + 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(250, 204, 21, 0.4)'
        ctx.fill()
      }

      // Ball Outer Circle
      ctx.beginPath()
      ctx.arc(0, 0, ball.radius, 0, Math.PI * 2)
      const ballGrad = ctx.createRadialGradient(
        -ball.radius * 0.35,
        -ball.radius * 0.35,
        ball.radius * 0.1,
        0,
        0,
        ball.radius
      )
      ballGrad.addColorStop(0, '#fca5a5')
      ballGrad.addColorStop(0.3, '#ef4444')
      ballGrad.addColorStop(1, '#991b1b')
      ctx.fillStyle = ballGrad
      ctx.fill()

      // Ball Rolling Texture / Seam Dot
      ctx.fillStyle = '#7f1d1d'
      ctx.beginPath()
      ctx.arc(ball.radius * 0.5, 0, 2, 0, Math.PI * 2)
      ctx.arc(-ball.radius * 0.5, 0, 2, 0, Math.PI * 2)
      ctx.fill()

      // Ball Specular Highlight (Nokia 3D shiny rubber look)
      ctx.beginPath()
      ctx.arc(-ball.radius * 0.35, -ball.radius * 0.35, ball.radius * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fill()

      ctx.restore()
    }

    ctx.restore() // Restore camera transform

    // --- OVERLAY: Touch Screen Hints / Controls Guide ---
    if (gameModeRef.current === 'playing') {
      // Subtle touch guidance arrows on screen bottom corners
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.font = 'bold 12px monospace'
      ctx.fillText('◄', 8, SCREEN_HEIGHT - 8)
      ctx.fillText('►', SCREEN_WIDTH - 18, SCREEN_HEIGHT - 8)

      // Active Touch Indicator Glow
      if (touchStateRef.current.active) {
        ctx.beginPath()
        ctx.arc(touchStateRef.current.currentX, touchStateRef.current.currentY, 16, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(34, 211, 238, 0.35)'
        ctx.fill()
      }
    }

    // --- OVERLAY: Title Screen / Menu ---
    if (gameModeRef.current === 'title') {
      ctx.fillStyle = 'rgba(5, 17, 25, 0.75)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      // 3D Title Shadow & Glow
      ctx.font = '900 30px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#7f1d1d'
      ctx.fillText('BOUNCE', SCREEN_WIDTH / 2 + 1.5, 83.5)
      ctx.fillStyle = '#ef4444'
      ctx.fillText('BOUNCE', SCREEN_WIDTH / 2, 82)

      ctx.fillStyle = '#fde047'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('★ NOKIA CLASSIC ★', SCREEN_WIDTH / 2, 102)

      // Bouncing Demo Ball with 3D Shader
      const demoBounce = Math.abs(Math.sin(timeNow() * 0.005)) * 25
      const demoY = 145 - demoBounce
      ctx.beginPath()
      ctx.arc(SCREEN_WIDTH / 2, demoY, 14, 0, Math.PI * 2)
      const ballGrad = ctx.createRadialGradient(
        SCREEN_WIDTH / 2 - 4,
        demoY - 4,
        2,
        SCREEN_WIDTH / 2,
        demoY,
        14
      )
      ballGrad.addColorStop(0, '#fca5a5')
      ballGrad.addColorStop(0.3, '#ef4444')
      ballGrad.addColorStop(1, '#991b1b')
      ctx.fillStyle = ballGrad
      ctx.fill()

      // Specular highlight on demo ball
      ctx.beginPath()
      ctx.arc(SCREEN_WIDTH / 2 - 4, demoY - 4, 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fill()

      // Interactive Touch Button
      ctx.fillStyle = '#10b981'
      ctx.fillRect(SCREEN_WIDTH / 2 - 70, 178, 140, 32)
      ctx.fillStyle = '#022c22'
      ctx.font = 'bold 12px monospace'
      ctx.fillText('▶ TAP TO START', SCREEN_WIDTH / 2, 199)

      ctx.fillStyle = '#94a3b8'
      ctx.font = '9px monospace'
      ctx.fillText('Or press 5 / Call on keypad', SCREEN_WIDTH / 2, 230)
    }

    // --- OVERLAY: Paused Screen ---
    else if (gameModeRef.current === 'paused') {
      ctx.fillStyle = 'rgba(5, 17, 25, 0.8)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      ctx.fillStyle = '#fde047'
      ctx.font = 'bold 18px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSED', SCREEN_WIDTH / 2, 110)

      ctx.fillStyle = '#10b981'
      ctx.fillRect(SCREEN_WIDTH / 2 - 60, 135, 120, 30)
      ctx.fillStyle = '#022c22'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('▶ RESUME', SCREEN_WIDTH / 2, 154)

      ctx.fillStyle = '#94a3b8'
      ctx.font = '10px monospace'
      ctx.fillText('Tap screen or Press 5', SCREEN_WIDTH / 2, 185)
    }

    // --- OVERLAY: Level Cleared ---
    else if (gameModeRef.current === 'level_clear') {
      ctx.fillStyle = 'rgba(5, 17, 25, 0.85)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      ctx.fillStyle = '#4ade80'
      ctx.font = 'bold 18px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('LEVEL CLEARED!', SCREEN_WIDTH / 2, 90)

      ctx.fillStyle = '#fde047'
      ctx.font = 'bold 12px monospace'
      ctx.fillText(`SCORE: ${scoreRef.current}`, SCREEN_WIDTH / 2, 120)

      ctx.fillStyle = '#10b981'
      ctx.fillRect(SCREEN_WIDTH / 2 - 65, 150, 130, 32)
      ctx.fillStyle = '#022c22'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('▶ NEXT LEVEL', SCREEN_WIDTH / 2, 170)

      ctx.fillStyle = '#cbd5e1'
      ctx.font = '10px monospace'
      ctx.fillText('Tap screen or Press 5', SCREEN_WIDTH / 2, 205)
    }

    // --- OVERLAY: Game Over ---
    else if (gameModeRef.current === 'gameover') {
      ctx.fillStyle = 'rgba(25, 5, 5, 0.85)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      ctx.fillStyle = '#f87171'
      ctx.font = 'bold 20px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, 95)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px monospace'
      ctx.fillText(`FINAL SCORE: ${scoreRef.current}`, SCREEN_WIDTH / 2, 125)

      ctx.fillStyle = '#ef4444'
      ctx.fillRect(SCREEN_WIDTH / 2 - 60, 150, 120, 32)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px monospace'
      ctx.fillText('🔄 PLAY AGAIN', SCREEN_WIDTH / 2, 170)
    }

    // --- OVERLAY: Won Game ---
    else if (gameModeRef.current === 'won') {
      ctx.fillStyle = 'rgba(5, 25, 15, 0.85)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      ctx.fillStyle = '#facc15'
      ctx.font = 'bold 20px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('🏆 YOU WIN! 🏆', SCREEN_WIDTH / 2, 85)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px monospace'
      ctx.fillText(`FINAL SCORE: ${scoreRef.current}`, SCREEN_WIDTH / 2, 115)

      ctx.fillStyle = '#4ade80'
      ctx.fillRect(SCREEN_WIDTH / 2 - 60, 145, 120, 32)
      ctx.fillStyle = '#052e16'
      ctx.font = 'bold 12px monospace'
      ctx.fillText('▶ PLAY AGAIN', SCREEN_WIDTH / 2, 165)
    }

    // Cheat Notification Banner
    if (cheatBanner) {
      ctx.fillStyle = 'rgba(234, 179, 8, 0.95)'
      ctx.fillRect(10, 8, SCREEN_WIDTH - 20, 24)
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(cheatBanner, SCREEN_WIDTH / 2, 24)
    }
  }, [cheatBanner, timeNow])

  // -------------------------------------------------------------
  // Physics & Game Loop
  // -------------------------------------------------------------
  useEffect(() => {
    lastTimeRef.current = gameNow()

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = time

      if (!isGamePaused() && gameModeRef.current === 'playing') {
        const ball = ballRef.current
        const level = currentLevelRef.current

        // Pop Animation Handling
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
            // Apply friction
            if (ball.grounded) {
              if (ball.vx > 0) ball.vx = Math.max(0, ball.vx - GROUND_FRICTION * dt)
              else if (ball.vx < 0) ball.vx = Math.min(0, ball.vx + GROUND_FRICTION * dt)
            } else {
              if (ball.vx > 0) ball.vx = Math.max(0, ball.vx - AIR_DRAG * dt)
              else if (ball.vx < 0) ball.vx = Math.min(0, ball.vx + AIR_DRAG * dt)
            }
          }

          // Ball Rotation (rolls proportional to horizontal displacement)
          ball.rotation += (ball.vx * dt) / ball.radius

          // --- VERTICAL FORCES & WATER PHYSICS ---
          if (ball.inWater) {
            if (ball.sizeType === 'big') {
              // Big ball floats high on water!
              ball.vy += -380 * dt // Buoyancy pushes it up
              ball.vy *= 0.94 // Water dampening
            } else {
              // Normal ball sinks slowly in water
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

          // --- TILEMAP COLLISION DETECTION & RESOLUTION ---
          const oldX = ball.x
          const oldY = ball.y
          const targetX = oldX + ball.vx * dt
          const targetY = oldY + ball.vy * dt

          // Update position tentatively
          ball.x = targetX
          ball.y = targetY

          const mapW = level.width * TILE_SIZE
          const mapH = level.height * TILE_SIZE

          // Map bounds
          if (ball.x - ball.radius < 0) {
            ball.x = ball.radius
            ball.vx = 0
          }
          if (ball.x + ball.radius > mapW) {
            ball.x = mapW - ball.radius
            ball.vx = 0
          }

          // Fell off map
          if (ball.y > mapH + 40) {
            popBall()
          }

          // Check tiles around ball
          const minCol = Math.max(0, Math.floor((ball.x - ball.radius - 2) / TILE_SIZE))
          const maxCol = Math.min(level.width - 1, Math.floor((ball.x + ball.radius + 2) / TILE_SIZE))
          const minRow = Math.max(0, Math.floor((ball.y - ball.radius - 2) / TILE_SIZE))
          const maxRow = Math.min(level.height - 1, Math.floor((ball.y + ball.radius + 2) / TILE_SIZE))

          ball.grounded = false
          ball.inWater = false

          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              const tile = level.tiles[r][c]
              if (tile === TILE.EMPTY) continue

              const tileLeft = c * TILE_SIZE
              const tileRight = tileLeft + TILE_SIZE
              const tileTop = r * TILE_SIZE
              const tileBottom = tileTop + TILE_SIZE

              // Solid block (Brick or Stone)
              if (tile === TILE.BRICK || tile === TILE.STONE) {
                // Find closest point on AABB to circle
                const closeX = Math.max(tileLeft, Math.min(ball.x, tileRight))
                const closeY = Math.max(tileTop, Math.min(ball.y, tileBottom))

                const distX = ball.x - closeX
                const distY = ball.y - closeY
                const distSq = distX * distX + distY * distY

                if (distSq < ball.radius * ball.radius && distSq > 0) {
                  const dist = Math.sqrt(distSq)
                  const overlap = ball.radius - dist
                  const nx = distX / dist
                  const ny = distY / dist

                  ball.x += nx * overlap
                  ball.y += ny * overlap

                  // Hitting top of block (landing)
                  if (ny < -0.6) {
                    ball.grounded = true
                    if (ball.vy > 30) {
                      ball.vy = -ball.vy * RESTITUTION
                      if (Math.abs(ball.vy) < 25) ball.vy = 0
                      nokiaSound.playBounce(Math.min(2, Math.abs(ball.vy) / 100))
                    } else if (ball.vy > 0) {
                      ball.vy = 0
                    }
                  } else if (ny > 0.6) {
                    // Ceiling hit
                    if (ball.vy < 0) ball.vy = 0
                  }

                  // Wall hit
                  if (Math.abs(nx) > 0.6) {
                    ball.vx = 0
                  }
                }
              }

              // Trampoline / Super Bounce Pad
              else if (tile === TILE.TRAMPOLINE) {
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

                  // Trampoline bounce sparkles
                  for (let p = 0; p < 8; p++) {
                    particlesRef.current.push({
                      x: ball.x,
                      y: tileTop,
                      vx: (Math.random() - 0.5) * 120,
                      vy: -50 - Math.random() * 80,
                      life: 0.4,
                      maxLife: 0.4,
                      color: '#fef08a',
                      size: 2.5,
                    })
                  }
                }
              }

              // Spikes
              else if (
                tile === TILE.SPIKE_UP ||
                tile === TILE.SPIKE_DOWN ||
                tile === TILE.SPIKE_LEFT ||
                tile === TILE.SPIKE_RIGHT
              ) {
                // Spike bounding box with slight margin
                if (
                  ball.x + ball.radius * 0.7 > tileLeft + 2 &&
                  ball.x - ball.radius * 0.7 < tileRight - 2 &&
                  ball.y + ball.radius * 0.7 > tileTop + 2 &&
                  ball.y - ball.radius * 0.7 < tileBottom - 2
                ) {
                  popBall()
                }
              }

              // Water
              else if (tile === TILE.WATER) {
                if (
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius > tileTop + 4 &&
                  ball.y - ball.radius < tileBottom
                ) {
                  ball.inWater = true
                }
              }

              // Expander Pump (Big Ball Power-up)
              else if (tile === TILE.PUMP_EXPAND) {
                if (
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius > tileTop &&
                  ball.y - ball.radius < tileBottom
                ) {
                  if (ball.sizeType !== 'big') {
                    ball.sizeType = 'big'
                    ball.radius = 18
                    nokiaSound.playPump(true)
                  }
                }
              }

              // Deflater Pump (Normal Ball)
              else if (tile === TILE.PUMP_DEFLATE) {
                if (
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius > tileTop &&
                  ball.y - ball.radius < tileBottom
                ) {
                  if (ball.sizeType !== 'normal') {
                    ball.sizeType = 'normal'
                    ball.radius = 11
                    nokiaSound.playPump(false)
                  }
                }
              }

              // Checkpoint Flag
              else if (tile === TILE.CHECKPOINT) {
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
                // Only accessible once all rings collected!
                const uncollected = ringsRef.current.filter(r => !r.collected).length
                if (
                  uncollected === 0 &&
                  ball.x + ball.radius > tileLeft &&
                  ball.x - ball.radius < tileRight &&
                  ball.y + ball.radius > tileTop &&
                  ball.y - ball.radius < tileBottom
                ) {
                  // Level Completed!
                  scoreRef.current += 1000 + livesRef.current * 250
                  setScore(scoreRef.current)
                  setGameMode('level_clear')
                  nokiaSound.playLevelWin()
                }
              }
            }
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
              setRingsLeft(remaining)

              if (remaining === 0) {
                nokiaSound.playExitOpen()
              }

              // Golden ring sparkle particles
              for (let p = 0; p < 10; p++) {
                const angle = Math.random() * Math.PI * 2
                const spd = 30 + Math.random() * 80
                particlesRef.current.push({
                  x: ring.x,
                  y: ring.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  life: 0.6,
                  maxLife: 0.6,
                  color: '#facc15',
                  size: 2.5,
                })
              }
            }
          })
        }

        // --- CAMERA FOLLOW ---
        const targetCamX = ball.x - SCREEN_WIDTH / 2
        const targetCamY = ball.y - SCREEN_HEIGHT / 2
        const maxCamX = Math.max(0, level.width * TILE_SIZE - SCREEN_WIDTH)
        const maxCamY = Math.max(0, level.height * TILE_SIZE - SCREEN_HEIGHT)

        // Smooth camera dampening
        cameraRef.current.x += (Math.max(0, Math.min(targetCamX, maxCamX)) - cameraRef.current.x) * 0.15
        cameraRef.current.y += (Math.max(0, Math.min(targetCamY, maxCamY)) - cameraRef.current.y) * 0.15

        // Update particle lifetimes
        particlesRef.current.forEach(p => {
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.vy += 280 * dt // particle gravity
          p.life -= dt
        })
        particlesRef.current = particlesRef.current.filter(p => p.life > 0)
      }

      // --- RENDER FRAME ON CANVAS ---
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
        <div className="flex justify-between items-center w-full max-w-[360px] mb-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold">
          <span className="text-red-400 flex items-center gap-1">
            🔴 BOUNCE
          </span>
          <span className="text-amber-300">
            👑 BEST: <span className="text-white ml-1">{bestScore || 0}</span>
          </span>
        </div>

        {/* NOKIA MOBILE DEVICE WITH WORKING TOUCH SCREEN & KEYPAD */}
        <NokiaPhone
          leftSoftLabel={
            gameMode === 'playing' ? 'Pause' : gameMode === 'paused' ? 'Resume' : 'Start'
          }
          rightSoftLabel={gameMode === 'playing' ? 'Reset' : 'Menu'}
          onLeftSoft={handleLeftSoft}
          onRightSoft={handleRightSoft}
          onDirectionPress={handleDirectionPress}
          onActionPress={handleActionPress}
          onKeypadPress={handleKeyCheat}
          onCallPress={startNewGame}
          onEndPress={() => setGameMode('paused')}
          cheatActive={isGodMode}
          lives={lives}
          ringsLeft={ringsLeft}
          ringsTotal={ringsTotal}
          score={score}
          levelName={LEVELS[currentLevelIdx]?.name.split(':')[0] || 'Level 1'}
        >
          {/* LCD Touchscreen Canvas */}
          <canvas
            ref={canvasRef}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            onPointerDown={handleLcdPointerDown}
            onPointerMove={handleLcdPointerMove}
            onPointerUp={handleLcdPointerUp}
            onPointerCancel={handleLcdPointerUp}
            className="w-full h-full block cursor-pointer touch-none"
            title="Nokia Touch Screen (Tap/Drag to play)"
          />
        </NokiaPhone>

        {/* Quick Instructions / Controls Guide */}
        <div className="mt-2 text-center text-slate-400 text-[11px] max-w-xs space-y-0.5">
          <p>
            <strong className="text-white">Touch Screen:</strong> Tap Left/Right to roll, Tap Top to jump.
          </p>
          <p>
            <strong className="text-white">Keypad:</strong> 4=Left, 6=Right, 2 or 5=Jump, *=Sound.
          </p>
          <p className="text-amber-300/80 font-mono text-[10px]">
            Cheat: Enter 787898 on keypad for God Mode!
          </p>
        </div>

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
