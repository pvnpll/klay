import { useEffect, useRef, useState, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { NokiaPhone } from '../../components/NokiaPhone'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import { rapidRollSound } from './rapid-roll/sound'
import { SPRITE_HEART, SPRITE_STAR, drawPixelSprite, drawBall } from './rapid-roll/sprites'
import type { GameState, Platform, PlayerBall, Particle, PlatformType } from './rapid-roll/types'

export const SCREEN_WIDTH = 258
export const SCREEN_HEIGHT = 248
export const HUD_HEIGHT = 22
export const CEILING_SPIKES_HEIGHT = 10
export const BALL_RADIUS = 7

export default function RapidRoll() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<GameState>('title')
  const [score, setScore] = useState<number>(0)
  const [isGodMode, setIsGodMode] = useState<boolean>(false)

  const [bestScore, setBestScore] = useState<number>(() => {
    return getStats().bests['rapid-roll'] || 0
  })
  const [isNewBest, setIsNewBest] = useState<boolean>(false)

  // Mutable Game References for High-Performance 60 FPS Loop
  const gameStateRef = useRef<GameState>('title')
  const scoreRef = useRef<number>(0)
  const isGodModeRef = useRef<boolean>(false)

  const playerRef = useRef<PlayerBall>({
    x: SCREEN_WIDTH / 2,
    y: 80,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    lives: 3,
    maxLives: 5,
    invulnerableTime: 0,
    isOnPlatform: false,
    activePlatformId: null,
    rotation: 0,
  })

  const platformsRef = useRef<Platform[]>([])
  const particlesRef = useRef<Particle[]>([])
  const platformSpeedRef = useRef<number>(48)
  const nextPlatformIdRef = useRef<number>(1)
  const cheatSequenceRef = useRef<string>('')

  const inputRef = useRef({
    left: false,
    right: false,
    down: false,
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
          maxLife: 0.3 + Math.random() * 0.3,
          size: Math.random() > 0.5 ? size : Math.max(1, size - 1),
          color,
        })
      }
    },
    [],
  )

  // Generate a new platform below screen
  const generatePlatform = useCallback((yPos: number, forcedNormal = false): Platform => {
    const id = nextPlatformIdRef.current++
    const width = Math.floor(Math.random() * 24) + 40 // 40 to 64 px wide
    const x = Math.floor(Math.random() * (SCREEN_WIDTH - width - 20)) + 10

    let type: PlatformType = 'normal'
    if (!forcedNormal) {
      const rand = Math.random()
      if (rand < 0.22) type = 'spikes'
      else if (rand < 0.4) type = 'conveyor_left'
      else if (rand < 0.58) type = 'conveyor_right'
      else if (rand < 0.75) type = 'bouncy'
      else if (rand < 0.88) type = 'collapsing'
    }

    const hasHeart = type !== 'spikes' && Math.random() < 0.12
    const hasStar = type !== 'spikes' && !hasHeart && Math.random() < 0.15

    return {
      id,
      x,
      y: yPos,
      width,
      height: 7,
      type,
      stepped: false,
      hasHeart,
      hasStar,
    }
  }, [])

  // Start / Reset Game
  const startNewGame = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    setIsNewBest(false)
    platformSpeedRef.current = 48

    playerRef.current = {
      x: SCREEN_WIDTH / 2,
      y: 70,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      lives: 3,
      maxLives: 5,
      invulnerableTime: 0,
      isOnPlatform: false,
      activePlatformId: null,
      rotation: 0,
    }

    // Pre-populate platforms descending down screen
    const initialPlatforms: Platform[] = []
    let currentY = 110
    // First platform directly under ball is safe
    initialPlatforms.push(generatePlatform(currentY, true))

    while (currentY < SCREEN_HEIGHT + 60) {
      currentY += Math.floor(Math.random() * 12) + 40
      initialPlatforms.push(generatePlatform(currentY, false))
    }

    platformsRef.current = initialPlatforms
    particlesRef.current = []
    setGameState('playing')
    rapidRollSound.playKeyClick()
  }, [generatePlatform])

  // Lose 1 Life (falling off or hitting ceiling spikes)
  const loseLife = useCallback(
    (_reason: 'spikes' | 'pit' | 'ceiling') => {
      if (isGodModeRef.current) return
      const p = playerRef.current
      if (p.invulnerableTime > 0) return

      p.lives -= 1
      p.invulnerableTime = 1.4
      rapidRollSound.playSpikeHit()
      addParticles(p.x, p.y, 16, '#ff4757', 70, 2)

      if (p.lives <= 0) {
        rapidRollSound.playGameOver()
        gameStateRef.current = 'gameover'
        setGameState('gameover')
        const currentMeta = GAMES.find(g => g.id === 'rapid-roll')!
        const isBest = saveScore(currentMeta, scoreRef.current)
        if (isBest) {
          setBestScore(scoreRef.current)
          setIsNewBest(true)
        }
      } else {
        // Respawn ball on the lowest safe platform near center
        const safePlat = platformsRef.current.find(
          plat => plat.y > 60 && plat.y < SCREEN_HEIGHT - 40 && plat.type !== 'spikes',
        )
        if (safePlat) {
          p.x = safePlat.x + safePlat.width / 2
          p.y = safePlat.y - p.radius - 2
        } else {
          p.x = SCREEN_WIDTH / 2
          p.y = 70
        }
        p.vx = 0
        p.vy = 0
        p.isOnPlatform = true
      }
    },
    [addParticles],
  )

  // Handle Nokia Keypad
  const handleKeyCheat = useCallback(
    (key: string) => {
      cheatSequenceRef.current = (cheatSequenceRef.current + key).slice(-6)

      if (cheatSequenceRef.current === '787898' || cheatSequenceRef.current.endsWith('1989')) {
        setIsGodMode(prev => {
          const next = !prev
          if (next) {
            playerRef.current.lives = playerRef.current.maxLives
            rapidRollSound.playCheat()
          }
          return next
        })
        cheatSequenceRef.current = ''
      }

      // Quick Numeric Keypad mappings
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
      if (key === '5' || key === '2') {
        if (gameStateRef.current === 'title') startNewGame()
        else {
          inputRef.current.down = true
          setTimeout(() => {
            inputRef.current.down = false
          }, 150)
        }
      }
    },
    [startNewGame],
  )

  // Hardware/Directional Press
  const handleDirectionPress = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => {
      if (dir === 'left') inputRef.current.left = pressed
      if (dir === 'right') inputRef.current.right = pressed
      if (dir === 'down') inputRef.current.down = pressed
      if (dir === 'up' && pressed && gameStateRef.current === 'title') {
        startNewGame()
      }
    },
    [startNewGame],
  )

  const handleActionPress = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        if (gameStateRef.current === 'title') startNewGame()
      }
    },
    [startNewGame],
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

    if (canvasX < SCREEN_WIDTH / 2) {
      inputRef.current.left = true
      inputRef.current.right = false
    } else {
      inputRef.current.right = true
      inputRef.current.left = false
    }
  }

  const handleLcdPointerUp = () => {
    inputRef.current.left = false
    inputRef.current.right = false
    inputRef.current.down = false
  }

  // Keyboard Shortcuts (Arrow keys, A/D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault()
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputRef.current.left = true
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRef.current.right = true
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        inputRef.current.down = true
      }
      if (e.key === ' ' || e.key === 'Enter') {
        if (gameStateRef.current === 'title' || gameStateRef.current === 'gameover') {
          startNewGame()
        }
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState(prev => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = false
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') inputRef.current.down = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startNewGame])

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
      // 1. GAME SIMULATION & PHYSICS
      // -------------------------------------------------------------
      if (state === 'playing') {
        // Accelerate scroll speed gradually (up to ~90 px/s)
        platformSpeedRef.current = Math.min(95, platformSpeedRef.current + dt * 0.4)
        const scrollSpeed = platformSpeedRef.current

        // Timers
        if (p.invulnerableTime > 0) p.invulnerableTime -= dt

        // Horizontal Movement
        const rollAccel = 450
        const maxSpeed = 125
        if (inputRef.current.left) {
          p.vx = Math.max(-maxSpeed, p.vx - rollAccel * dt)
          p.rotation -= 8 * dt
        } else if (inputRef.current.right) {
          p.vx = Math.min(maxSpeed, p.vx + rollAccel * dt)
          p.rotation += 8 * dt
        } else {
          p.vx *= 0.88
          if (Math.abs(p.vx) < 4) p.vx = 0
        }

        p.x += p.vx * dt

        // Screen Side Boundaries (Wrap or Wall bounce)
        if (p.x - p.radius < 4) {
          p.x = 4 + p.radius
          p.vx = 0
        } else if (p.x + p.radius > SCREEN_WIDTH - 4) {
          p.x = SCREEN_WIDTH - 4 - p.radius
          p.vx = 0
        }

        // Apply Vertical Movement & Gravity
        const gravity = 380
        p.vy += gravity * dt
        if (inputRef.current.down) {
          p.vy += 220 * dt // Fast drop
        }
        if (p.vy > 260) p.vy = 260

        p.y += p.vy * dt

        // Move Platforms Upwards
        const plats = platformsRef.current
        for (let i = plats.length - 1; i >= 0; i--) {
          const plat = plats[i]
          plat.y -= scrollSpeed * dt

          // Collapsing Platform Timer
          if (plat.type === 'collapsing' && plat.stepped && !plat.collapsed) {
            plat.collapseTimer = (plat.collapseTimer || 0) + dt
            if (plat.collapseTimer > 0.35) {
              plat.collapsed = true
              rapidRollSound.playSpikeHit()
              addParticles(plat.x + plat.width / 2, plat.y, 10, '#ffa502', 40, 2)
            }
          }

          // Remove platform if off top of screen
          if (plat.y < -15) {
            plats.splice(i, 1)
          }
        }

        // Spawn new platforms as needed below
        const lowestPlatY = plats.reduce((max, pl) => Math.max(max, pl.y), 0)
        if (lowestPlatY < SCREEN_HEIGHT + 30) {
          const nextY = lowestPlatY + Math.floor(Math.random() * 12) + 38
          plats.push(generatePlatform(nextY, false))
        }

        // Platform Collision Detection
        p.isOnPlatform = false
        p.activePlatformId = null

        plats.forEach(plat => {
          if (plat.collapsed) return

          // Ball bottom landing on top surface of platform
          const ballBottom = p.y + p.radius
          const prevBallBottom = ballBottom - p.vy * dt
          const platTop = plat.y

          if (
            p.vy >= 0 &&
            prevBallBottom <= platTop + 3 &&
            ballBottom >= platTop - 2 &&
            p.x + p.radius * 0.7 > plat.x &&
            p.x - p.radius * 0.7 < plat.x + plat.width
          ) {
            p.y = platTop - p.radius
            p.vy = 0
            p.isOnPlatform = true
            p.activePlatformId = plat.id

            // Handle Stepping
            if (!plat.stepped) {
              plat.stepped = true
              scoreRef.current += 10
              setScore(scoreRef.current)
              rapidRollSound.playLand()
            }

            // Platform Types Behavior
            if (plat.type === 'spikes') {
              loseLife('spikes')
            } else if (plat.type === 'bouncy') {
              p.vy = -210 // High bounce launch!
              p.isOnPlatform = false
              rapidRollSound.playBounceSpring()
              addParticles(p.x, p.y + p.radius, 8, '#70a1ff', 50, 2)
            } else if (plat.type === 'conveyor_left') {
              p.x -= 70 * dt // Push left
              p.rotation -= 12 * dt
            } else if (plat.type === 'conveyor_right') {
              p.x += 70 * dt // Push right
              p.rotation += 12 * dt
            }

            // Item Pickups
            if (plat.hasHeart) {
              plat.hasHeart = false
              p.lives = Math.min(p.maxLives, p.lives + 1)
              scoreRef.current += 100
              setScore(scoreRef.current)
              rapidRollSound.playHeartPickup()
              addParticles(p.x, p.y, 12, '#ff4757', 60, 2)
            } else if (plat.hasStar) {
              plat.hasStar = false
              scoreRef.current += 500
              setScore(scoreRef.current)
              rapidRollSound.playStarPickup()
              addParticles(p.x, p.y, 14, '#ffa502', 70, 2)
            }
          }
        })

        // If ball is resting on platform, ride it upwards!
        if (p.isOnPlatform) {
          p.y -= scrollSpeed * dt
        }

        // Increment score for descending safely over time
        scoreRef.current += Math.round(dt * 15)
        setScore(scoreRef.current)

        // Top Ceiling Spikes Collision
        if (p.y - p.radius <= HUD_HEIGHT + CEILING_SPIKES_HEIGHT) {
          p.y = HUD_HEIGHT + CEILING_SPIKES_HEIGHT + p.radius + 4
          p.vy = 60
          loseLife('ceiling')
        }

        // Bottom Screen Fall Pit
        if (p.y - p.radius > SCREEN_HEIGHT) {
          loseLife('pit')
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

      // -------------------------------------------------------------
      // 2. CANVAS RENDERING
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      // Classic Nokia Slate Background
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      // Subtle vertical background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 1
      for (let gx = 16; gx < SCREEN_WIDTH; gx += 20) {
        ctx.beginPath()
        ctx.moveTo(gx, HUD_HEIGHT)
        ctx.lineTo(gx, SCREEN_HEIGHT)
        ctx.stroke()
      }

      // Render Ceiling Spikes (Top Hazard)
      ctx.fillStyle = '#e74c3c'
      const spikeW = 8
      for (let sx = 0; sx < SCREEN_WIDTH; sx += spikeW) {
        ctx.beginPath()
        ctx.moveTo(sx, HUD_HEIGHT)
        ctx.lineTo(sx + spikeW / 2, HUD_HEIGHT + CEILING_SPIKES_HEIGHT)
        ctx.lineTo(sx + spikeW, HUD_HEIGHT)
        ctx.fill()
      }

      // Render Platforms
      platformsRef.current.forEach(plat => {
        if (plat.collapsed) return

        const px = Math.round(plat.x)
        const py = Math.round(plat.y)
        const pw = plat.width
        const ph = plat.height

        if (plat.type === 'normal') {
          // Classic Nokia Green Bar
          ctx.fillStyle = '#2ed573'
          ctx.fillRect(px, py, pw, ph)
          ctx.fillStyle = '#7bed9f'
          ctx.fillRect(px, py, pw, 2)
          ctx.fillStyle = '#1e90ff'
          ctx.fillRect(px, py + ph - 2, pw, 2)
        } else if (plat.type === 'spikes') {
          // Spike Platform: base + teeth
          ctx.fillStyle = '#57606f'
          ctx.fillRect(px, py + 2, pw, ph - 2)
          ctx.fillStyle = '#ff4757'
          const teethCount = Math.floor(pw / 6)
          for (let t = 0; t < teethCount; t++) {
            ctx.beginPath()
            ctx.moveTo(px + t * 6, py + 3)
            ctx.lineTo(px + t * 6 + 3, py - 4)
            ctx.lineTo(px + t * 6 + 6, py + 3)
            ctx.fill()
          }
        } else if (plat.type === 'conveyor_left') {
          // Conveyor Left (Amber)
          ctx.fillStyle = '#ffa502'
          ctx.fillRect(px, py, pw, ph)
          // Animated Left Chevron Arrows
          ctx.fillStyle = '#744210'
          const offset = Math.floor((currentTime * 0.05) % 10)
          for (let cx = px + 6; cx < px + pw - 6; cx += 12) {
            const arrowX = cx - offset
            if (arrowX > px && arrowX < px + pw - 6) {
              ctx.fillText('◀', arrowX, py + ph - 1)
            }
          }
        } else if (plat.type === 'conveyor_right') {
          // Conveyor Right (Amber)
          ctx.fillStyle = '#ffa502'
          ctx.fillRect(px, py, pw, ph)
          // Animated Right Chevron Arrows
          ctx.fillStyle = '#744210'
          const offset = Math.floor((currentTime * 0.05) % 10)
          for (let cx = px + 6; cx < px + pw - 6; cx += 12) {
            const arrowX = cx + offset
            if (arrowX > px && arrowX < px + pw - 6) {
              ctx.fillText('▶', arrowX, py + ph - 1)
            }
          }
        } else if (plat.type === 'bouncy') {
          // Trampoline Spring (Cyan)
          ctx.fillStyle = '#00d2d3'
          ctx.fillRect(px, py, pw, ph)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(px + 4, py + 1, pw - 8, 2)
          // Springs underneath
          ctx.strokeStyle = '#01a3a4'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(px + 8, py + ph)
          ctx.lineTo(px + 12, py + ph + 3)
          ctx.lineTo(px + 16, py + ph)
          ctx.moveTo(px + pw - 16, py + ph)
          ctx.lineTo(px + pw - 12, py + ph + 3)
          ctx.lineTo(px + pw - 8, py + ph)
          ctx.stroke()
        } else if (plat.type === 'collapsing') {
          // Collapsing Platform (Cracked Yellow)
          ctx.fillStyle = plat.stepped ? '#ff6348' : '#eccc68'
          ctx.fillRect(px, py, pw, ph)
          // Crack lines
          ctx.strokeStyle = '#2f3542'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(px + pw * 0.3, py)
          ctx.lineTo(px + pw * 0.45, py + ph)
          ctx.moveTo(px + pw * 0.7, py)
          ctx.lineTo(px + pw * 0.6, py + ph)
          ctx.stroke()
        }

        // Platform Border Outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.lineWidth = 1
        ctx.strokeRect(px, py, pw, ph)

        // Floating Item Pickups
        if (plat.hasHeart) {
          drawPixelSprite(ctx, SPRITE_HEART, px + pw / 2 - 5, py - 12, 1)
        } else if (plat.hasStar) {
          drawPixelSprite(ctx, SPRITE_STAR, px + pw / 2 - 4, py - 12, 1)
        }
      })

      // Render Player Ball
      const isFlickering = p.invulnerableTime > 0 && Math.floor(currentTime * 0.02) % 2 === 0
      if (!isFlickering && (p.lives > 0 || state === 'title')) {
        drawBall(ctx, p.x, p.y, p.radius, p.rotation, isGodModeRef.current)
      }

      // Render Particles
      particlesRef.current.forEach(pt => {
        ctx.fillStyle = pt.color
        ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size)
      })

      // -------------------------------------------------------------
      // 3. TOP IN-GAME HUD
      // -------------------------------------------------------------
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, HUD_HEIGHT)
      ctx.fillStyle = '#334155'
      ctx.fillRect(0, HUD_HEIGHT - 1, SCREEN_WIDTH, 1)

      // Lives (Red Hearts)
      for (let i = 0; i < p.maxLives; i++) {
        const hx = 8 + i * 12
        const hy = 5
        if (i < p.lives) {
          drawPixelSprite(ctx, SPRITE_HEART, hx, hy, 1)
        } else {
          ctx.strokeStyle = '#475569'
          ctx.strokeRect(hx, hy + 1, 7, 7)
        }
      }

      // Speed Gauge
      ctx.fillStyle = '#64748b'
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`SPD ${Math.round(platformSpeedRef.current)}`, 74, 15)

      // Score
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${scoreRef.current}`, SCREEN_WIDTH - 8, 15)

      // -------------------------------------------------------------
      // 4. OVERLAYS (Title, GameOver, Paused)
      // -------------------------------------------------------------
      if (state === 'title') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        ctx.fillStyle = '#2ed573'
        ctx.font = 'bold 18px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('RAPID ROLL', SCREEN_WIDTH / 2, 60)

        ctx.fillStyle = '#70a1ff'
        ctx.font = 'bold 10px monospace'
        ctx.fillText('NOKIA ORIGINAL CLASSIC', SCREEN_WIDTH / 2, 78)

        // Draw animated ball on platform
        drawBall(ctx, SCREEN_WIDTH / 2, 115, 10, currentTime * 0.003, false)
        ctx.fillStyle = '#2ed573'
        ctx.fillRect(SCREEN_WIDTH / 2 - 25, 126, 50, 6)

        const pulse = Math.floor(currentTime * 0.003) % 2 === 0
        if (pulse) {
          ctx.fillStyle = '#ffa502'
          ctx.font = 'bold 11px monospace'
          ctx.fillText('PRESS 5 / TAP TO ROLL', SCREEN_WIDTH / 2, 168)
        }

        ctx.fillStyle = '#94a3b8'
        ctx.font = '8px monospace'
        ctx.fillText('4: LEFT  6: RIGHT  5: BRAKE', SCREEN_WIDTH / 2, 198)
        ctx.fillText('TOUCH LEFT/RIGHT SCREEN TO STEER', SCREEN_WIDTH / 2, 210)
        ctx.fillText('CHEAT: 787898 FOR GOD MODE', SCREEN_WIDTH / 2, 224)
      } else if (state === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        ctx.fillStyle = '#2ed573'
        ctx.font = 'bold 15px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('PAUSED', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 8)

        ctx.fillStyle = '#94a3b8'
        ctx.font = '9px monospace'
        ctx.fillText('PRESS P / END TO RESUME', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 12)
      }

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    animationFrameId = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [addParticles, generatePlatform, loseLife])

  const gameMeta = GAMES.find(g => g.id === 'rapid-roll')!

  return (
    <GameLayout title={gameMeta.name} description={gameMeta.description} rules={gameMeta.rules}>
      <div className="flex flex-col items-center justify-center w-full py-1">
        {/* Top Header stats info */}
        <div className="flex justify-between items-center w-full max-w-[350px] mb-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold">
          <span className="text-emerald-400 flex items-center gap-1">
            🔴 NOKIA 3510i · RAPID ROLL
          </span>
          <span className="text-amber-300">
            🏆 BEST: <span className="text-white ml-1">{bestScore || 0}</span>
          </span>
        </div>

        {/* EXACT NOKIA 3510i MOBILE PHONE CHASSIS */}
        <NokiaPhone
          screenBg="#0f172a"
          onLeftSoft={() => {
            if (gameState === 'title') startNewGame()
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
            title="Roll ball left"
          >
            ◀ <strong className="text-zinc-200">4 / Left</strong>
          </button>
          <button
            type="button"
            onPointerDown={() => {
              inputRef.current.down = true
            }}
            onPointerUp={() => {
              inputRef.current.down = false
            }}
            onPointerLeave={() => {
              inputRef.current.down = false
            }}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-3 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Drop faster"
          >
            🔽 <strong className="text-zinc-200">5 / Down</strong>
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
            title="Roll ball right"
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
