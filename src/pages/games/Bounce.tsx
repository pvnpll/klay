import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Maximize2,
  Minimize2,
  RotateCcw,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
} from 'lucide-react'
import { GameResult } from '../../components/GameResult'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import {
  isGamePaused,
  gameNow,
  gameRaf as requestAnimationFrame,
  cancelGameRaf as cancelAnimationFrame,
} from '../../utils/gameClock'
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

  // Full-screen and modal UI state
  const [soundOn, setSoundOn] = useState<boolean>(() => !nokiaSound.isMuted())
  const [levelNumber, setLevelNumber] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({})
  const activePointersRef = useRef<Map<number, string>>(new Map())

  const markKeyActive = useCallback((keyId: string, active: boolean) => {
    setActiveKeys((prev) => {
      if (prev[keyId] === active) return prev
      return { ...prev, [keyId]: active }
    })
  }, [])

  // Universal text selection suppression for mobile & touch browsers
  useEffect(() => {
    const preventSelection = (e: Event) => {
      e.preventDefault()
    }
    document.addEventListener('selectstart', preventSelection)
    return () => {
      document.removeEventListener('selectstart', preventSelection)
    }
  }, [])

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

  // Jump buffer and coyote time refs for responsive mobile & keypad controls
  const jumpBufferRef = useRef<number>(0)
  const coyoteTimerRef = useRef<number>(0)

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
  const timeNow = useCallback(() => (typeof performance !== 'undefined' ? performance.now() : Date.now()), [])

  // Track browser fullscreen status
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFs)
    return () => document.removeEventListener('fullscreenchange', handleFs)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.()
      } else {
        await document.exitFullscreen?.()
      }
    } catch {}
  }

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    nokiaSound.setMuted(!next)
  }

  const togglePause = () => {
    if (gameModeRef.current === 'playing') setGameMode('paused')
    else if (gameModeRef.current === 'paused') setGameMode('playing')
  }

  const playClick = () => {
    nokiaSound.playKeyClick()
  }

  // -------------------------------------------------------------
  // Level Initialization
  // -------------------------------------------------------------
  const loadLevel = useCallback((lvlIdx: number, keepScore = true) => {
    const level = LEVELS[lvlIdx % LEVELS.length]
    levelIdxRef.current = lvlIdx % LEVELS.length
    setLevelNumber((lvlIdx % LEVELS.length) + 1)
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
    inputRef.current.jump = false
    inputRef.current.left = false
    inputRef.current.right = false
    inputRef.current.down = false
    jumpBufferRef.current = 0
    coyoteTimerRef.current = 0
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

  const toggleGodMode = useCallback(() => {
    const newGod = !isGodModeRef.current
    isGodModeRef.current = newGod
    setIsGodMode(newGod)
    nokiaSound.playCheat()
    setCheatBanner(newGod ? '★ GOD MODE: ON ★' : '★ GOD MODE: OFF ★')
    setTimeout(() => setCheatBanner(null), 2500)
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

  // Expose test hook for deterministic test fixtures without altering gameplay
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as { __BOUNCE_TEST__?: unknown }).__BOUNCE_TEST__ = {
        getState: () => ({
          gameMode: gameModeRef.current,
          levelIdx: levelIdxRef.current,
          score: scoreRef.current,
          lives: livesRef.current,
          isGodMode: isGodModeRef.current,
          ball: { ...ballRef.current },
          checkpoint: checkpointRef.current,
          uncollectedRings: ringsRef.current.filter(r => !r.collected).length,
          totalRings: ringsRef.current.length,
          exitPosition: {
            x: currentLevelRef.current.exitX,
            y: currentLevelRef.current.exitY,
          },
        }),
        loadLevel: (idx: number, keepScore = true) => loadLevel(idx, keepScore),
        collectAllRings: () => {
          ringsRef.current.forEach(r => (r.collected = true))
          scoreRef.current += ringsRef.current.length * 500
          setScore(scoreRef.current)
        },
        teleportBall: (x: number, y: number) => {
          ballRef.current.x = x
          ballRef.current.y = y
          ballRef.current.vx = 0
          ballRef.current.vy = 0
        },
        popBall: () => popBall(),
        respawnBall: () => respawnBall(),
        setLives: (n: number) => {
          livesRef.current = n
        },
        advanceToNextLevel: () => advanceToNextLevel(),
        startNewGame: () => startNewGame(),
        pause: () => setGameMode('paused'),
        resume: () => setGameMode('playing'),
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as { __BOUNCE_TEST__?: unknown }).__BOUNCE_TEST__
      }
    }
  }, [loadLevel, popBall, respawnBall, advanceToNextLevel, startNewGame])

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
          if (ballRef.current.vx > -90) ballRef.current.vx = -90
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
        case '6':
          inputRef.current.right = true
          if (ballRef.current.vx < 90) ballRef.current.vx = 90
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
        case '2':
        case '5':
          inputRef.current.jump = true
          jumpBufferRef.current = 0.16
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
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

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
      jumpBufferRef.current = 0.16
      touchStateRef.current.isTapJump = true
    } else {
      if (normX < 0.42) {
        inputRef.current.left = true
        inputRef.current.right = false
        if (ballRef.current.vx > -90) ballRef.current.vx = -90
      } else if (normX > 0.58) {
        inputRef.current.right = true
        inputRef.current.left = false
        if (ballRef.current.vx < 90) ballRef.current.vx = 90
      } else {
        inputRef.current.jump = true
        jumpBufferRef.current = 0.16
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
    const dy = touchY - touchStateRef.current.startY

    // Upward swipe -> Jump
    if (dy < -18) {
      inputRef.current.jump = true
      jumpBufferRef.current = 0.16
    }

    if (Math.abs(dx) > 10) {
      if (dx < 0) {
        inputRef.current.left = true
        inputRef.current.right = false
        if (ballRef.current.vx > -90) ballRef.current.vx = -90
      } else {
        inputRef.current.right = true
        inputRef.current.left = false
        if (ballRef.current.vx < 90) ballRef.current.vx = 90
      }
    }
  }

  const handleLcdPointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      } catch {}
    }
    touchStateRef.current.active = false
    inputRef.current.left = false
    inputRef.current.right = false
    inputRef.current.jump = false
  }

  // -------------------------------------------------------------
  // Nokia Keypad Callbacks
  // -------------------------------------------------------------
  const handleDirectionPress = (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => {
    if (dir === 'left') {
      inputRef.current.left = pressed
      if (pressed && ballRef.current.vx > -90) {
        ballRef.current.vx = -90
      }
    }
    if (dir === 'right') {
      inputRef.current.right = pressed
      if (pressed && ballRef.current.vx < 90) {
        ballRef.current.vx = 90
      }
    }
    if (dir === 'up') {
      if (pressed) {
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
        inputRef.current.jump = true
        jumpBufferRef.current = 0.16
      } else {
        inputRef.current.jump = false
      }
    }
    if (dir === 'down') inputRef.current.down = pressed
  }

  const handleActionPress = (pressed: boolean) => {
    if (pressed) {
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
      if (gameModeRef.current === 'paused') {
        setGameMode('playing')
        return
      }
      inputRef.current.jump = true
      jumpBufferRef.current = 0.16
    } else {
      inputRef.current.jump = false
    }
  }

  // --- Dedicated Resilient Pointer Capture for Left & Right Buttons ---
  const bindDirection = (dir: 'left' | 'right', keyId: string) => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, keyId)
        } catch {}
        markKeyActive(keyId, true)
        playClick()
        handleDirectionPress(dir, true)
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKeyActive(keyId, false)
        handleDirectionPress(dir, false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKeyActive(keyId, false)
        handleDirectionPress(dir, false)
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) return
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKeyActive(keyId, false)
        handleDirectionPress(dir, false)
      },
      onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // --- Dedicated Resilient Pointer Capture for Jump Button ---
  const bindJump = (keyId = 'jump') => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, keyId)
        } catch {}
        markKeyActive(keyId, true)
        playClick()
        handleActionPress(true)
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKeyActive(keyId, false)
        handleActionPress(false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKeyActive(keyId, false)
        handleActionPress(false)
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) return
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKeyActive(keyId, false)
        handleActionPress(false)
      },
      onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // --- Pointer Capture for Navi, Clear, End ---
  const bindKey = (keyId: string, action: () => void) => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, keyId)
        } catch {}
        markKeyActive(keyId, true)
        playClick()
        action()
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKeyActive(keyId, false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKeyActive(keyId, false)
      },
      onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // --- Keypad cheat entry ---
  const bindKeypadCheat = (key: string) => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        playClick()
        handleKeyCheat(key)
        markKeyActive(`key-${key}`, true)
      },
      onPointerUp: () => markKeyActive(`key-${key}`, false),
      onPointerCancel: () => markKeyActive(`key-${key}`, false),
      onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  const handleNaviPress = () => {
    if (gameModeRef.current === 'title') {
      startNewGame()
    } else if (gameModeRef.current === 'level_clear') {
      advanceToNextLevel()
    } else if (gameModeRef.current === 'gameover' || gameModeRef.current === 'won') {
      startNewGame()
    } else if (gameModeRef.current === 'paused') {
      setGameMode('playing')
    } else {
      handleActionPress(true)
      setTimeout(() => handleActionPress(false), 120)
    }
  }

  const handleClearPress = () => {
    if (gameModeRef.current === 'playing') {
      setGameMode('paused')
    } else if (gameModeRef.current === 'paused') {
      setGameMode('playing')
    } else if (gameModeRef.current === 'title') {
      startNewGame()
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

          // Coyote time tracking
          if (ball.grounded || ball.inWater) {
            coyoteTimerRef.current = 0.12
          } else {
            coyoteTimerRef.current = Math.max(0, coyoteTimerRef.current - dt)
          }

          // Jump buffer tracking
          if (inputRef.current.jump) {
            jumpBufferRef.current = 0.16
          } else {
            jumpBufferRef.current = Math.max(0, jumpBufferRef.current - dt)
          }

          // Jump Input (Buffered Jump + Coyote Time for silky smooth responsive taps)
          if ((inputRef.current.jump || jumpBufferRef.current > 0) && (coyoteTimerRef.current > 0 || ball.inWater)) {
            const jForce = ball.sizeType === 'big' ? BIG_JUMP_FORCE : JUMP_FORCE
            ball.vy = jForce
            ball.grounded = false
            coyoteTimerRef.current = 0
            jumpBufferRef.current = 0
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
    <div
      className="bounce-root fixed inset-0 w-full h-[100dvh] flex flex-col justify-between bg-[#070b19] text-white select-none overflow-hidden touch-none"
      style={{
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        .bounce-root, .bounce-root * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
      `}</style>

      {/* 1. TOP HEADER TOOLBAR */}
      <header className="h-12 border-b border-white/10 bg-[#0c1222]/90 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 shrink-0 z-40 select-none">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 active:bg-white/15 text-xs font-semibold select-none"
          aria-label="Back to all games"
        >
          <ArrowLeft size={16} />
          <span>Games</span>
        </Link>

        <div className="flex items-center gap-2 select-none">
          <span className="text-red-400 font-bold font-mono text-xs sm:text-sm tracking-wide flex items-center gap-1">
            🔴 BOUNCE
          </span>
          <span className="text-[10px] text-amber-300 font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/80">
            LVL {levelNumber}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 select-none">
          <div className="hidden xs:flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 px-2 py-1 rounded-lg bg-black/40 border border-white/10 select-none">
            👑 {bestScore || 0}
          </div>

          <button
            type="button"
            onClick={toggleGodMode}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors select-none touch-none ${
              isGodMode
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
            }`}
            title="Toggle God Mode (Nokia Cheat 787898)"
          >
            ★ GOD
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 active:bg-white/15 select-none touch-none"
            aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={togglePause}
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 active:bg-white/15 select-none touch-none"
            aria-label={gameMode === 'paused' ? 'Resume game' : 'Pause game'}
          >
            {gameMode === 'paused' ? <Play size={16} /> : <Pause size={16} />}
          </button>

          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 active:bg-white/15 select-none touch-none"
            aria-label="How to play"
          >
            <Info size={16} />
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 active:bg-white/15 select-none touch-none"
            aria-label={isFullscreen ? 'Exit browser fullscreen' : 'Enter browser fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* 2. GAME STAGE / LCD DISPLAY UNIT */}
      <main className="flex-1 min-h-0 w-full flex items-center justify-center p-2 select-none overflow-hidden">
        {/* Authentic Nokia 3510i Bezel Frame */}
        <div className="w-full max-w-[340px] sm:max-w-[390px] flex flex-col items-center bg-[#131d2e] rounded-3xl p-2.5 sm:p-3 border-2 border-slate-700/80 shadow-[0_15px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.15)] relative">
          
          {/* Top Pill Speaker */}
          <div className="w-12 h-1 bg-slate-600/70 rounded-full mb-1" />
          
          {/* Nokia Brand */}
          <div className="text-[10px] font-sans font-black tracking-[0.25em] text-slate-400 uppercase mb-1.5 select-none">
            NOKIA
          </div>

          {/* LCD Screen Cutout */}
          <div className="w-full aspect-[258/248] max-h-[38dvh] rounded-xl overflow-hidden border-2 border-slate-900 bg-[#004ecc] relative shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
            <canvas
              ref={canvasRef}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              onPointerDown={handleLcdPointerDown}
              onPointerMove={handleLcdPointerMove}
              onPointerUp={handleLcdPointerUp}
              onPointerCancel={handleLcdPointerUp}
              className="w-full h-full block cursor-pointer touch-none"
              title="Nokia 3510i Screen (Touch or buttons to play)"
            />

            {/* In-Screen Cheat Banner */}
            {cheatBanner && (
              <div className="absolute top-2 inset-x-0 mx-auto w-fit px-3 py-1 bg-amber-400 text-slate-950 font-mono font-black text-xs rounded-full shadow-lg animate-bounce pointer-events-none">
                {cheatBanner}
              </div>
            )}

            {/* In-Screen Pause Overlay */}
            {gameMode === 'paused' && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
                <div className="text-amber-400 font-mono font-black text-lg mb-2">⏸ GAME PAUSED</div>
                <div className="text-xs text-slate-300 font-mono mb-4">Press Resume to continue</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGameMode('playing')}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 active:bg-amber-300"
                  >
                    <Play size={14} /> Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => loadLevel(levelNumber - 1, true)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-white border border-slate-700 font-bold text-xs flex items-center gap-1 active:bg-slate-700"
                  >
                    <RotateCcw size={14} /> Retry
                  </button>
                </div>
              </div>
            )}

            {/* In-Screen Level Clear Overlay */}
            {gameMode === 'level_clear' && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center z-20 animate-pop-in">
                <div className="text-amber-300 text-2xl font-black font-mono mb-1">🎉 LEVEL CLEAR!</div>
                <div className="text-xs text-slate-200 font-mono mb-3">Score: {score}</div>
                <button
                  type="button"
                  onClick={advanceToNextLevel}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-lg active:scale-95"
                >
                  NEXT LEVEL ▶
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. THE REQUIRED PLAYABLE BUTTONS (Massive, Tactile, Perfectly Clickable!) */}
      <footer className="w-full max-w-md mx-auto px-3 pb-3 sm:pb-4 flex flex-col gap-2 shrink-0 z-30 select-none">
        
        {/* Softkeys & Navi-Bar Row */}
        <div className="flex items-center justify-between w-full px-1 gap-2 select-none">
          {/* Clear / 'C' button */}
          <button
            type="button"
            aria-label="C / Clear"
            {...bindKey('c', () => handleClearPress())}
            className={`h-9 px-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all select-none touch-none ${
              activeKeys['c']
                ? 'bg-white/40 border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.7)]'
                : 'bg-slate-800/80 border-slate-600 text-slate-200 active:bg-white/20'
            }`}
          >
            <span>C</span>
            <span className="text-[10px] text-slate-400 font-normal">Back</span>
          </button>

          {/* Center Cyan Navi-Bar */}
          <button
            type="button"
            aria-label="Navi-Key (Select / Action)"
            {...bindKey('navi', () => handleNaviPress())}
            className={`flex-1 h-9 px-4 rounded-full border-2 font-mono font-bold text-xs flex items-center justify-center transition-all select-none touch-none ${
              activeKeys['navi']
                ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.8)]'
                : 'bg-cyan-950/40 border-cyan-400/60 text-cyan-300 active:bg-cyan-400/30'
            }`}
          >
            <span>─ ACTION / SELECT ─</span>
          </button>

          {/* Red Power / Pause button */}
          <button
            type="button"
            aria-label="Power / End / Pause"
            {...bindKey('end', () => setGameMode('paused'))}
            className={`h-9 px-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all select-none touch-none ${
              activeKeys['end']
                ? 'bg-red-500 text-white border-red-400 shadow-[0_0_14px_rgba(239,68,68,0.8)]'
                : 'bg-red-950/30 border-red-700/60 text-red-400 active:bg-red-500/30'
            }`}
          >
            <span>⏻</span>
            <span className="text-[10px] text-red-300/80 font-normal">Pause</span>
          </button>
        </div>

        {/* The Core Thumb Controls Row (Large, Ergonomic, Impossible to Miss) */}
        <div className="flex items-center justify-between w-full gap-3 px-1 select-none">
          {/* Left Thumb: Directional Steer */}
          <div className="flex items-center gap-2 select-none">
            {/* Left Button */}
            <button
              type="button"
              aria-label="Key 4 (Left)"
              {...bindDirection('left', 'left')}
              className={`w-20 h-16 sm:w-24 sm:h-18 rounded-2xl border-2 flex flex-col items-center justify-center select-none touch-none transition-all ${
                activeKeys['left']
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-[0.97]'
                  : 'bg-gradient-to-b from-slate-700 to-slate-900 border-slate-600 text-slate-100 shadow-[0_4px_0_#1e293b,0_6px_12px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0_1px_0_#1e293b]'
              }`}
            >
              <ChevronLeft size={28} strokeWidth={2.5} />
              <span className="text-[11px] font-mono font-bold tracking-wider text-amber-300">4 ghi</span>
            </button>

            {/* Right Button */}
            <button
              type="button"
              aria-label="Key 6 (Right)"
              {...bindDirection('right', 'right')}
              className={`w-20 h-16 sm:w-24 sm:h-18 rounded-2xl border-2 flex flex-col items-center justify-center select-none touch-none transition-all ${
                activeKeys['right']
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-[0.97]'
                  : 'bg-gradient-to-b from-slate-700 to-slate-900 border-slate-600 text-slate-100 shadow-[0_4px_0_#1e293b,0_6px_12px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0_1px_0_#1e293b]'
              }`}
            >
              <ChevronRight size={28} strokeWidth={2.5} />
              <span className="text-[11px] font-mono font-bold tracking-wider text-amber-300">6 mno</span>
            </button>
          </div>

          {/* Right Thumb: The Big Jump Button */}
          <div className="flex items-center select-none">
            <button
              type="button"
              aria-label="Key 5 (Action / Fire)"
              {...bindJump('jump')}
              className={`w-28 h-18 sm:w-32 sm:h-20 rounded-3xl border-3 flex flex-col items-center justify-center select-none touch-none transition-all ${
                activeKeys['jump']
                  ? 'bg-amber-300 text-amber-950 border-white shadow-[0_0_25px_rgba(253,224,71,0.9)] scale-[0.96] translate-y-1'
                  : 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-300 text-slate-950 shadow-[0_6px_0_#92400e,0_8px_18px_rgba(245,158,11,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#92400e]'
              }`}
            >
              <ArrowUp size={28} strokeWidth={3} className="text-slate-950 mb-[-2px]" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-950">JUMP · 5</span>
            </button>
          </div>
        </div>

        {/* Bottom Cheat & Keyboard Help Row */}
        <div className="flex items-center justify-between w-full px-2 pt-0.5 text-[11px] text-slate-400 font-mono select-none">
          <span className="hidden sm:inline">Desktop: ← / A / 4: Left · → / D / 6: Right · Space / 5: Jump</span>
          <div className="flex items-center gap-1.5 ml-auto select-none">
            <button
              type="button"
              aria-label="Key 7"
              {...bindKeypadCheat('7')}
              className="w-6 h-5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 active:bg-amber-400 active:text-black"
            >
              7
            </button>
            <button
              type="button"
              aria-label="Key 8 (Down)"
              {...bindKeypadCheat('8')}
              className="w-6 h-5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 active:bg-amber-400 active:text-black"
            >
              8
            </button>
            <button
              type="button"
              aria-label="Key 9"
              {...bindKeypadCheat('9')}
              className="w-6 h-5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 active:bg-amber-400 active:text-black"
            >
              9
            </button>
            <button
              type="button"
              onClick={toggleGodMode}
              className="text-[10px] font-bold text-amber-400/80 hover:text-amber-300 ml-1"
            >
              ★ 787898
            </button>
          </div>
        </div>
      </footer>

      {/* 4. HOW TO PLAY RULES MODAL */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => setShowRules(false)}
        >
          <div
            className="w-full max-w-sm bg-[#141b2d] border border-white/20 rounded-2xl p-5 text-slate-100 shadow-2xl animate-pop-in select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 select-none">
              <h2 className="text-base font-black font-mono text-amber-400">HOW TO PLAY BOUNCE</h2>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 font-sans select-none">
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold">1.</span>
                <span>Collect all golden rings on the level to unlock the Exit Gate.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <span>Use ◀ Left and Right ▶ to roll. Tap or hold JUMP to bounce high.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold">3.</span>
                <span>Avoid red spikes and spiked star mines. Touch checkpoints (flags) to save progress.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold">4.</span>
                <span>Jump on green trampolines for super bounce. Yellow pumps inflate / deflate the ball.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold">5.</span>
                <span>Big ball floats in water; small ball sinks to deep passages.</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 text-black font-black text-xs uppercase tracking-wider"
            >
              GOT IT · LET’S PLAY
            </button>
          </div>
        </div>
      )}

      {/* 5. GAME RESULT MODAL (GAME OVER OR WON) */}
      {(gameMode === 'gameover' || gameMode === 'won') && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm animate-pop-in">
            <GameResult
              game={gameMeta}
              score={score}
              isWin={gameMode === 'won'}
              isNewBest={isNewBest}
              bestScore={bestScore}
              onRestart={startNewGame}
            />
          </div>
        </div>
      )}
    </div>
  )
}
