import { useEffect, useRef, useState, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { NokiaPhone } from '../../components/NokiaPhone'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import { spaceSound } from './space-impact/sound'
import {
  SPRITE_PLAYER,
  SPRITE_THRUSTER_0,
  SPRITE_THRUSTER_1,
  SPRITE_SCOUT,
  SPRITE_DIVER,
  SPRITE_CRUISER,
  SPRITE_MINE,
  SPRITE_CARGO,
  SPRITE_WORM_SEGMENT,
  SPRITE_BOSS1_MEGACRAB,
  SPRITE_BOSS2_SKULL,
  SPRITE_BOSS3_QUEEN,
  SPRITE_MISSILE,
  GLYPH_SHIELD,
  GLYPH_MISSILE,
  GLYPH_LASER,
  GLYPH_BOMB,
  GLYPH_UPGRADE,
  drawPixelSprite,
} from './space-impact/sprites'
import { LEVELS } from './space-impact/levels'
import type {
  GameState,
  LcdTheme,
  PlayerState,
  Enemy,
  Bullet,
  Powerup,
  Particle,
  Star,
  PowerupType,
  SpecialWeaponType,
} from './space-impact/types'

const gameMeta = GAMES.find(g => g.id === 'space-impact')!

export const SCREEN_WIDTH = 258
export const SCREEN_HEIGHT = 248
export const HUD_HEIGHT = 26

// LCD Theme Palettes
const THEMES: Record<
  LcdTheme,
  {
    bg: string
    primary: string
    secondary: string
    highlight: string
    bullet: string
    laserBeam: string
  }
> = {
  green: {
    bg: '#94a174', // Classic Nokia green LCD
    primary: '#182210', // Dark monochrome pixel
    secondary: '#364620', // Medium pixel
    highlight: '#4e6330',
    bullet: '#182210',
    laserBeam: '#283818',
  },
  color: {
    bg: '#08101e', // 3510i Deep Space Blue
    primary: '#48dbfb',
    secondary: '#f368e0',
    highlight: '#ff9f43',
    bullet: '#ff4757',
    laserBeam: '#00d2d3',
  },
  mono: {
    bg: '#c5d1b7', // Retro 3310 high-contrast
    primary: '#0e140a',
    secondary: '#2e3a24',
    highlight: '#526344',
    bullet: '#0e140a',
    laserBeam: '#222b1b',
  },
}

export default function SpaceImpact() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<GameState>('title')
  const [score, setScore] = useState<number>(0)
  const [levelIndex, setLevelIndex] = useState<number>(0)
  const [lcdTheme, setLcdTheme] = useState<LcdTheme>('green')
  const [isGodMode, setIsGodMode] = useState<boolean>(false)

  // Best score
  const [bestScore, setBestScore] = useState<number>(() => {
    return getStats().bests['space-impact'] || 0
  })
  const [isNewBest, setIsNewBest] = useState<boolean>(false)

  // Game references
  const levelRef = useRef(LEVELS[0])
  const levelTimerRef = useRef<number>(0)
  const lastSpawnIndexRef = useRef<number>(0)
  const bossActiveRef = useRef<boolean>(false)
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const cheatBufferRef = useRef<string[]>([])
  const nextEntityIdRef = useRef<number>(1)

  // Stars background
  const starsRef = useRef<Star[]>([])

  // Player state
  const playerRef = useRef<PlayerState>({
    x: 24,
    y: 110,
    vx: 0,
    vy: 0,
    width: 28,
    height: 18,
    shields: 4,
    maxShields: 4,
    lives: 3,
    invulnerableTime: 0,
    firing: false,
    blasterLevel: 1,
    selectedSpecial: 'rocket',
    ammo: {
      rocket: 3,
      laser: 2,
      bomb: 1,
    },
  })

  // World entities
  const enemiesRef = useRef<Enemy[]>([])
  const bulletsRef = useRef<Bullet[]>([])
  const powerupsRef = useRef<Powerup[]>([])
  const particlesRef = useRef<Particle[]>([])

  // Active key state
  const keysDownRef = useRef<{
    up: boolean
    down: boolean
    left: boolean
    right: boolean
    fire: boolean
  }>({
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
  })

  // Touch state
  const touchStateRef = useRef<{
    active: boolean
    targetX: number
    targetY: number
    firing: boolean
  }>({
    active: false,
    targetX: 24,
    targetY: 110,
    firing: false,
  })

  const lastShootTimeRef = useRef<number>(0)

  // Initialize stars once
  useEffect(() => {
    const stars: Star[] = []
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * SCREEN_WIDTH,
        y: HUD_HEIGHT + Math.random() * (SCREEN_HEIGHT - HUD_HEIGHT),
        speed: 15 + Math.random() * 45,
        size: Math.random() > 0.8 ? 2 : 1,
        brightness: 0.3 + Math.random() * 0.7,
      })
    }
    starsRef.current = stars
  }, [])

  // -------------------------------------------------------------
  // Level Initialization
  // -------------------------------------------------------------
  const startLevel = useCallback((lvlIdx: number, resetPlayerStats = false) => {
    const idx = lvlIdx % LEVELS.length
    setLevelIndex(idx)
    levelRef.current = LEVELS[idx]
    levelTimerRef.current = 0
    lastSpawnIndexRef.current = 0
    bossActiveRef.current = false

    enemiesRef.current = []
    bulletsRef.current = []
    powerupsRef.current = []
    particlesRef.current = []

    if (resetPlayerStats) {
      playerRef.current = {
        x: 24,
        y: 110,
        vx: 0,
        vy: 0,
        width: 28,
        height: 18,
        shields: 4,
        maxShields: 4,
        lives: 3,
        invulnerableTime: 1.5,
        firing: false,
        blasterLevel: 1,
        selectedSpecial: 'rocket',
        ammo: {
          rocket: 3,
          laser: 2,
          bomb: 1,
        },
      }
      setScore(0)
    } else {
      // Keep ammo & upgrades, restore shields & reset pos
      playerRef.current.x = 24
      playerRef.current.y = 110
      playerRef.current.shields = playerRef.current.maxShields
      playerRef.current.invulnerableTime = 1.5
    }
  }, [])

  const startNewGame = useCallback(() => {
    setIsGodMode(false)
    setIsNewBest(false)
    startLevel(0, true)
    setGameState('playing')
  }, [startLevel])

  // -------------------------------------------------------------
  // Weapons & Firing Logic
  // -------------------------------------------------------------
  const fireBlaster = useCallback(() => {
    const p = playerRef.current
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (now - lastShootTimeRef.current < 140) return
    lastShootTimeRef.current = now

    spaceSound.playLaser()

    const lvl = p.blasterLevel
    if (lvl === 1) {
      bulletsRef.current.push({
        id: nextEntityIdRef.current++,
        x: p.x + p.width - 2,
        y: p.y + p.height / 2 - 2,
        vx: 320,
        vy: 0,
        width: 8,
        height: 3,
        damage: 1,
        isPlayer: true,
        type: 'blaster',
        life: 1.2,
      })
    } else if (lvl === 2) {
      bulletsRef.current.push(
        {
          id: nextEntityIdRef.current++,
          x: p.x + p.width - 2,
          y: p.y + 2,
          vx: 320,
          vy: 0,
          width: 8,
          height: 3,
          damage: 1,
          isPlayer: true,
          type: 'blaster',
          life: 1.2,
        },
        {
          id: nextEntityIdRef.current++,
          x: p.x + p.width - 2,
          y: p.y + p.height - 5,
          vx: 320,
          vy: 0,
          width: 8,
          height: 3,
          damage: 1,
          isPlayer: true,
          type: 'blaster',
          life: 1.2,
        },
      )
    } else {
      // Triple spread
      bulletsRef.current.push(
        {
          id: nextEntityIdRef.current++,
          x: p.x + p.width - 2,
          y: p.y + p.height / 2 - 2,
          vx: 320,
          vy: 0,
          width: 8,
          height: 3,
          damage: 1,
          isPlayer: true,
          type: 'blaster',
          life: 1.2,
        },
        {
          id: nextEntityIdRef.current++,
          x: p.x + p.width - 2,
          y: p.y + 2,
          vx: 300,
          vy: -60,
          width: 8,
          height: 3,
          damage: 1,
          isPlayer: true,
          type: 'blaster',
          life: 1.2,
        },
        {
          id: nextEntityIdRef.current++,
          x: p.x + p.width - 2,
          y: p.y + p.height - 5,
          vx: 300,
          vy: 60,
          width: 8,
          height: 3,
          damage: 1,
          isPlayer: true,
          type: 'blaster',
          life: 1.2,
        },
      )
    }
  }, [])

  const fireSpecialWeapon = useCallback(() => {
    const p = playerRef.current
    const special = p.selectedSpecial

    if (!isGodMode && p.ammo[special] <= 0) {
      // Out of ammo
      spaceSound.playHit()
      return
    }

    if (!isGodMode) {
      p.ammo[special]--
    }

    if (special === 'rocket') {
      spaceSound.playRocket()
      bulletsRef.current.push({
        id: nextEntityIdRef.current++,
        x: p.x + p.width,
        y: p.y + p.height / 2 - 3,
        vx: 240,
        vy: 0,
        width: 14,
        height: 6,
        damage: 8,
        isPlayer: true,
        type: 'rocket',
        life: 2.0,
        homing: true,
      })
    } else if (special === 'laser') {
      spaceSound.playLaserBeam()
      bulletsRef.current.push({
        id: nextEntityIdRef.current++,
        x: p.x + p.width,
        y: p.y + p.height / 2 - 4,
        vx: 800,
        vy: 0,
        width: SCREEN_WIDTH - (p.x + p.width),
        height: 8,
        damage: 12,
        isPlayer: true,
        type: 'laser',
        life: 0.5,
      })
    } else if (special === 'bomb') {
      spaceSound.playBomb()
      // Clear all enemy bullets
      bulletsRef.current = bulletsRef.current.filter(b => b.isPlayer)
      // Damage all on-screen enemies
      enemiesRef.current.forEach(e => {
        e.hp -= 20
        for (let i = 0; i < 6; i++) {
          particlesRef.current.push({
            x: e.x + Math.random() * e.width,
            y: e.y + Math.random() * e.height,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.4,
            maxLife: 0.4,
            size: 2,
          })
        }
      })
      // Screen blast particles
      for (let i = 0; i < 30; i++) {
        particlesRef.current.push({
          x: Math.random() * SCREEN_WIDTH,
          y: HUD_HEIGHT + Math.random() * (SCREEN_HEIGHT - HUD_HEIGHT),
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          life: 0.5,
          maxLife: 0.5,
          size: 3,
        })
      }
    }
  }, [isGodMode])

  // -------------------------------------------------------------
  // Cheat Code Handling (787898 or 8421)
  // -------------------------------------------------------------
  const handleKeyCheat = useCallback(
    (key: string) => {
      // Toggle theme with '#'
      if (key === '#') {
        setLcdTheme(prev => (prev === 'green' ? 'color' : prev === 'color' ? 'mono' : 'green'))
        return
      }

      // Cycle special weapon with '1' or '3'
      if (key === '1' || key === '3') {
        const specials: SpecialWeaponType[] = ['rocket', 'laser', 'bomb']
        const currentIdx = specials.indexOf(playerRef.current.selectedSpecial)
        const nextIdx = key === '3' ? (currentIdx + 1) % specials.length : (currentIdx + 2) % specials.length
        playerRef.current.selectedSpecial = specials[nextIdx]
        return
      }

      // Fire special weapon with '0'
      if (key === '0') {
        fireSpecialWeapon()
        return
      }

      cheatBufferRef.current.push(key)
      if (cheatBufferRef.current.length > 8) {
        cheatBufferRef.current.shift()
      }

      const seq = cheatBufferRef.current.join('')
      if (seq.includes('787898') || seq.includes('8421')) {
        setIsGodMode(true)
        playerRef.current.shields = 4
        playerRef.current.blasterLevel = 3
        playerRef.current.ammo = {
          rocket: 99,
          laser: 99,
          bomb: 99,
        }
        spaceSound.playPowerup()
        cheatBufferRef.current = []
      }
    },
    [fireSpecialWeapon],
  )

  // -------------------------------------------------------------
  // Boss Spawning
  // -------------------------------------------------------------
  const spawnBoss = useCallback((type: 'boss1' | 'boss2' | 'boss3') => {
    bossActiveRef.current = true
    spaceSound.playBossAlarm()

    let hp = 80
    let width = 48
    let height = 48

    if (type === 'boss2') {
      hp = 120
      width = 54
      height = 50
    } else if (type === 'boss3') {
      hp = 160
      width = 60
      height = 54
    }

    enemiesRef.current.push({
      id: nextEntityIdRef.current++,
      type,
      x: SCREEN_WIDTH + 10,
      y: SCREEN_HEIGHT / 2 - height / 2,
      vx: -40,
      vy: 45,
      width,
      height,
      hp,
      maxHp: hp,
      scoreValue: 1500,
      timeAlive: 0,
      initialY: SCREEN_HEIGHT / 2 - height / 2,
      shootCooldown: 1.5,
      isBoss: true,
    })
  }, [])

  // -------------------------------------------------------------
  // Explosion & Drops
  // -------------------------------------------------------------
  const createExplosion = useCallback((x: number, y: number, isLarge = false) => {
    spaceSound.playExplosion(isLarge ? 'large' : 'small')
    const count = isLarge ? 20 : 8
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (isLarge ? 50 : 25) + Math.random() * 60
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.6,
        size: Math.random() > 0.5 ? 2 : 1,
      })
    }
  }, [])

  const dropPowerup = useCallback((x: number, y: number) => {
    const roll = Math.random()
    let type: PowerupType = 'shield'
    if (roll < 0.25) type = 'shield'
    else if (roll < 0.45) type = 'rocket'
    else if (roll < 0.65) type = 'laser'
    else if (roll < 0.8) type = 'bomb'
    else if (roll < 0.92) type = 'upgrade'
    else type = 'points'

    powerupsRef.current.push({
      id: nextEntityIdRef.current++,
      type,
      x,
      y,
      vx: -35,
      width: 14,
      height: 12,
    })
  }, [])

  // -------------------------------------------------------------
  // Input Binding Handlers
  // -------------------------------------------------------------
  const handleDirectionPress = useCallback((dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => {
    keysDownRef.current[dir] = pressed
  }, [])

  const handleActionPress = useCallback(
    (pressed: boolean) => {
      keysDownRef.current.fire = pressed
      if (pressed && gameState === 'title') {
        startNewGame()
      } else if (pressed && gameState === 'playing') {
        fireBlaster()
      }
    },
    [gameState, startNewGame, fireBlaster],
  )

  // Direct touchscreen canvas handlers
  const handleLcdPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * SCREEN_WIDTH
    const y = ((e.clientY - rect.top) / rect.height) * SCREEN_HEIGHT

    if (gameState === 'title') {
      startNewGame()
      return
    }

    if (gameState === 'levelclear') {
      const nextIdx = levelIndex + 1
      if (nextIdx < LEVELS.length) {
        startLevel(nextIdx, false)
        setGameState('playing')
      } else {
        setGameState('victory')
      }
      return
    }

    touchStateRef.current.active = true
    touchStateRef.current.targetX = Math.max(10, Math.min(x - 14, SCREEN_WIDTH - 40))
    touchStateRef.current.targetY = Math.max(HUD_HEIGHT + 4, Math.min(y - 9, SCREEN_HEIGHT - 22))

    // Tap on right half fires blasters
    if (x > SCREEN_WIDTH * 0.65) {
      touchStateRef.current.firing = true
      fireBlaster()
    }

    // Tap on top-left special icon switches/fires special
    if (y < HUD_HEIGHT + 14 && x < 120) {
      fireSpecialWeapon()
    }
  }

  const handleLcdPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchStateRef.current.active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * SCREEN_WIDTH
    const y = ((e.clientY - rect.top) / rect.height) * SCREEN_HEIGHT

    touchStateRef.current.targetX = Math.max(10, Math.min(x - 14, SCREEN_WIDTH - 40))
    touchStateRef.current.targetY = Math.max(HUD_HEIGHT + 4, Math.min(y - 9, SCREEN_HEIGHT - 22))
  }

  const handleLcdPointerUp = () => {
    touchStateRef.current.active = false
    touchStateRef.current.firing = false
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          keysDownRef.current.up = true
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          keysDownRef.current.down = true
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keysDownRef.current.left = true
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          keysDownRef.current.right = true
          break
        case ' ':
        case 'z':
        case 'Z':
        case 'j':
        case 'J':
          keysDownRef.current.fire = true
          if (gameState === 'title') startNewGame()
          else if (gameState === 'playing') fireBlaster()
          break
        case 'x':
        case 'X':
        case 'k':
        case 'K':
        case 'c':
        case 'C':
          if (gameState === 'playing') fireSpecialWeapon()
          break
        case 'p':
        case 'P':
        case 'Escape':
          setGameState(prev => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev))
          break
        default:
          if ((e.key >= '0' && e.key <= '9') || e.key === '#' || e.key === '*') {
            handleKeyCheat(e.key)
          }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          keysDownRef.current.up = false
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          keysDownRef.current.down = false
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keysDownRef.current.left = false
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          keysDownRef.current.right = false
          break
        case ' ':
        case 'z':
        case 'Z':
        case 'j':
        case 'J':
          keysDownRef.current.fire = false
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, startNewGame, fireBlaster, fireSpecialWeapon, handleKeyCheat])

  // -------------------------------------------------------------
  // Canvas Rendering
  // -------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const palette = THEMES[lcdTheme]

    // 1. Clear LCD screen
    ctx.fillStyle = palette.bg
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    // Optional LCD Pixel Grid overlay (subtle CRT scanline look)
    ctx.fillStyle = palette.secondary
    ctx.globalAlpha = 0.05
    for (let y = 0; y < SCREEN_HEIGHT; y += 2) {
      ctx.fillRect(0, y, SCREEN_WIDTH, 1)
    }
    ctx.globalAlpha = 1.0

    // 2. Stars Background
    starsRef.current.forEach(st => {
      ctx.fillStyle = palette.primary
      ctx.globalAlpha = st.brightness
      ctx.fillRect(Math.round(st.x), Math.round(st.y), st.size, st.size)
    })
    ctx.globalAlpha = 1.0

    // 3. Top HUD Divider Line
    ctx.fillStyle = palette.primary
    ctx.fillRect(0, HUD_HEIGHT - 2, SCREEN_WIDTH, 1)

    // 4. Render HUD Items
    const p = playerRef.current

    // Shields: 4 solid blocks
    ctx.fillStyle = palette.primary
    ctx.font = 'bold 9px monospace'
    ctx.fillText('SHD', 4, 11)

    for (let i = 0; i < p.maxShields; i++) {
      const bx = 26 + i * 8
      ctx.strokeStyle = palette.primary
      ctx.lineWidth = 1
      ctx.strokeRect(bx, 4, 6, 8)
      if (i < p.shields) {
        ctx.fillStyle = palette.primary
        ctx.fillRect(bx + 1, 5, 4, 6)
      }
    }

    // Lives: Mini-ships glyphs
    ctx.fillStyle = palette.primary
    ctx.fillText(`L:${p.lives}`, 64, 11)

    // Special Weapon Ammo & Selected Icon
    const spec = p.selectedSpecial
    const ammoCount = isGodMode ? '∞' : p.ammo[spec]
    const specIcon = spec === 'rocket' ? '🚀' : spec === 'laser' ? '⚡' : '💣'
    ctx.fillText(`${specIcon}:${ammoCount}`, 94, 11)

    // Current Level tag
    ctx.fillText(`S${levelIndex + 1}`, 148, 11)

    // 7-digit Score
    const scoreStr = score.toString().padStart(7, '0')
    ctx.fillText(scoreStr, 184, 11)

    // 5. Boss Health Bar (if active)
    const boss = enemiesRef.current.find(e => e.isBoss)
    if (boss) {
      ctx.fillStyle = palette.primary
      ctx.font = 'bold 8px monospace'
      ctx.fillText('BOSS:', 4, HUD_HEIGHT + 10)

      const barX = 36
      const barY = HUD_HEIGHT + 3
      const barW = 180
      const barH = 7

      ctx.strokeRect(barX, barY, barW, barH)
      const fillW = Math.max(0, Math.floor((boss.hp / boss.maxHp) * (barW - 2)))
      ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2)
    }

    // 6. Render Power-ups
    powerupsRef.current.forEach(pw => {
      ctx.strokeStyle = palette.primary
      ctx.strokeRect(Math.round(pw.x), Math.round(pw.y), pw.width, pw.height)

      let glyph = GLYPH_SHIELD
      if (pw.type === 'rocket') glyph = GLYPH_MISSILE
      else if (pw.type === 'laser') glyph = GLYPH_LASER
      else if (pw.type === 'bomb') glyph = GLYPH_BOMB
      else if (pw.type === 'upgrade') glyph = GLYPH_UPGRADE

      drawPixelSprite(ctx, glyph, pw.x + 3, pw.y + 2, 1, palette.primary, palette.secondary)
    })

    // 7. Render Enemies
    enemiesRef.current.forEach(e => {
      let matrix = SPRITE_SCOUT
      let scale = 1

      if (e.type === 'scout') {
        matrix = SPRITE_SCOUT
        scale = 1
      } else if (e.type === 'diver') {
        matrix = SPRITE_DIVER
        scale = 1
      } else if (e.type === 'cruiser') {
        matrix = SPRITE_CRUISER
        scale = 1
      } else if (e.type === 'mine') {
        matrix = SPRITE_MINE
        scale = 1
      } else if (e.type === 'cargo') {
        matrix = SPRITE_CARGO
        scale = 1
      } else if (e.type === 'worm') {
        matrix = SPRITE_WORM_SEGMENT
        scale = 1
      } else if (e.type === 'boss1') {
        matrix = SPRITE_BOSS1_MEGACRAB
        scale = 2
      } else if (e.type === 'boss2') {
        matrix = SPRITE_BOSS2_SKULL
        scale = 2
      } else if (e.type === 'boss3') {
        matrix = SPRITE_BOSS3_QUEEN
        scale = 2
      }

      drawPixelSprite(ctx, matrix, e.x, e.y, scale, palette.primary, palette.secondary)
    })

    // 8. Render Bullets
    bulletsRef.current.forEach(b => {
      if (b.type === 'laser') {
        // Continuous Laser Beam
        ctx.fillStyle = palette.laserBeam
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.width, b.height)
        ctx.fillStyle = palette.bg
        ctx.fillRect(Math.round(b.x), Math.round(b.y + 2), b.width, b.height - 4)
      } else if (b.type === 'rocket') {
        drawPixelSprite(ctx, SPRITE_MISSILE, b.x, b.y, 1, palette.primary, palette.secondary)
        // Smoke exhaust
        ctx.fillStyle = palette.secondary
        ctx.fillRect(Math.round(b.x - 3), Math.round(b.y + 1), 2, 2)
      } else if (b.type === 'plasma') {
        ctx.fillStyle = palette.bullet
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.width, b.height)
      } else {
        // Main Blaster Bolt
        ctx.fillStyle = palette.bullet
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.width, b.height)
      }
    })

    // 9. Render Particles
    particlesRef.current.forEach(part => {
      ctx.fillStyle = part.color || palette.primary
      ctx.fillRect(Math.round(part.x), Math.round(part.y), part.size, part.size)
    })

    // 10. Render Player Ship (Blink if invulnerable)
    if (gameState === 'playing' || gameState === 'title') {
      const shouldDraw = p.invulnerableTime <= 0 || Math.floor(p.invulnerableTime * 12) % 2 === 0
      if (shouldDraw) {
        drawPixelSprite(ctx, SPRITE_PLAYER, p.x, p.y, 1, palette.primary, palette.secondary)

        // Animated Thruster Flame
        const flameMatrix = Math.floor(Date.now() / 80) % 2 === 0 ? SPRITE_THRUSTER_0 : SPRITE_THRUSTER_1
        drawPixelSprite(ctx, flameMatrix, p.x - 4, p.y + 4, 1, palette.secondary, palette.highlight)
      }
    }

    // 11. God Mode Banner
    if (isGodMode) {
      ctx.fillStyle = palette.primary
      ctx.font = 'bold 9px monospace'
      ctx.fillText('★ GOD MODE: ON ★', SCREEN_WIDTH / 2 - 50, HUD_HEIGHT + 14)
    }

    // 12. Modal State Overlays on LCD Screen
    if (gameState === 'title') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.fillRect(16, 45, SCREEN_WIDTH - 32, 160)

      ctx.fillStyle = palette.bg
      ctx.fillRect(18, 47, SCREEN_WIDTH - 36, 156)

      ctx.fillStyle = palette.primary
      ctx.font = 'bold 15px monospace'
      ctx.fillText('SPACE IMPACT', SCREEN_WIDTH / 2 - 56, 80)

      ctx.font = '10px monospace'
      ctx.fillText('NOKIA ORIGINAL', SCREEN_WIDTH / 2 - 44, 98)

      ctx.font = '9px monospace'
      ctx.fillText('★ TAP SCREEN OR 5 ★', SCREEN_WIDTH / 2 - 58, 134)
      ctx.fillText('TO START MISSION', SCREEN_WIDTH / 2 - 50, 148)

      ctx.font = '8px monospace'
      ctx.fillText(`HI-SCORE: ${bestScore}`, SCREEN_WIDTH / 2 - 38, 175)
    } else if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(30, 80, SCREEN_WIDTH - 60, 80)
      ctx.fillStyle = palette.bg
      ctx.fillRect(32, 82, SCREEN_WIDTH - 64, 76)

      ctx.fillStyle = palette.primary
      ctx.font = 'bold 14px monospace'
      ctx.fillText('PAUSED', SCREEN_WIDTH / 2 - 28, 115)
      ctx.font = '9px monospace'
      ctx.fillText('PRESS 5 OR ⏻', SCREEN_WIDTH / 2 - 36, 135)
    } else if (gameState === 'levelclear') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(20, 60, SCREEN_WIDTH - 40, 120)
      ctx.fillStyle = palette.bg
      ctx.fillRect(22, 62, SCREEN_WIDTH - 44, 116)

      ctx.fillStyle = palette.primary
      ctx.font = 'bold 13px monospace'
      ctx.fillText('SECTOR CLEARED!', SCREEN_WIDTH / 2 - 58, 95)
      ctx.font = '9px monospace'
      ctx.fillText(`BONUS: +1000 PTS`, SCREEN_WIDTH / 2 - 46, 118)
      ctx.fillText('TAP SCREEN OR 5', SCREEN_WIDTH / 2 - 46, 145)
      ctx.fillText('FOR NEXT SECTOR', SCREEN_WIDTH / 2 - 46, 158)
    } else if (gameState === 'victory') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(16, 50, SCREEN_WIDTH - 32, 145)
      ctx.fillStyle = palette.bg
      ctx.fillRect(18, 52, SCREEN_WIDTH - 36, 141)

      ctx.fillStyle = palette.primary
      ctx.font = 'bold 13px monospace'
      ctx.fillText('MISSION COMPLETE!', SCREEN_WIDTH / 2 - 64, 85)
      ctx.font = '9px monospace'
      ctx.fillText('THE GALAXY IS SAVED!', SCREEN_WIDTH / 2 - 58, 108)
      ctx.fillText(`FINAL SCORE: ${score}`, SCREEN_WIDTH / 2 - 54, 130)
      ctx.fillText('TAP TO PLAY AGAIN', SCREEN_WIDTH / 2 - 50, 160)
    }
  }, [gameState, isGodMode, lcdTheme, score, levelIndex, bestScore])

  // -------------------------------------------------------------
  // Main Game Loop & Physics Update
  // -------------------------------------------------------------
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const dt = Math.min(0.05, (timestamp - lastTimeRef.current) / 1000)
      lastTimeRef.current = timestamp

      if (gameState === 'playing') {
        const p = playerRef.current
        const keys = keysDownRef.current
        const touch = touchStateRef.current

        // 1. Player Movement (analog touch or keypad keys)
        let dx = 0
        let dy = 0

        if (keys.left) dx -= 1
        if (keys.right) dx += 1
        if (keys.up) dy -= 1
        if (keys.down) dy += 1

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071
          dy *= 0.7071
        }

        const moveSpeed = 145
        if (touch.active) {
          // Direct smooth touch dragging
          const diffX = touch.targetX - p.x
          const diffY = touch.targetY - p.y
          p.x += diffX * 0.22
          p.y += diffY * 0.22
        } else {
          p.x += dx * moveSpeed * dt
          p.y += dy * moveSpeed * dt
        }

        // Clamp inside playfield
        p.x = Math.max(8, Math.min(p.x, SCREEN_WIDTH - p.width - 8))
        p.y = Math.max(HUD_HEIGHT + 2, Math.min(p.y, SCREEN_HEIGHT - p.height - 4))

        // Invulnerability countdown
        if (p.invulnerableTime > 0) {
          p.invulnerableTime -= dt
        }

        // Auto-fire if held
        if (keys.fire || touch.firing) {
          fireBlaster()
        }

        // 2. Wave Spawner & Level Progress
        levelTimerRef.current += dt
        const currentLevel = levelRef.current
        const spawns = currentLevel.spawns

        while (
          lastSpawnIndexRef.current < spawns.length &&
          levelTimerRef.current >= spawns[lastSpawnIndexRef.current].time
        ) {
          const spawn = spawns[lastSpawnIndexRef.current]
          lastSpawnIndexRef.current++

          const spawnY = spawn.y !== -1 ? spawn.y : HUD_HEIGHT + 20 + Math.random() * (SCREEN_HEIGHT - HUD_HEIGHT - 40)

          let width = 16
          let height = 12
          let hp = 1
          let scoreVal = 50
          let vx = -65
          let vy = 0

          if (spawn.type === 'diver') {
            width = 14
            height = 12
            hp = 2
            scoreVal = 100
            vx = -110
          } else if (spawn.type === 'cruiser') {
            width = 22
            height = 14
            hp = 4
            scoreVal = 200
            vx = -45
          } else if (spawn.type === 'mine') {
            width = 14
            height = 14
            hp = 5
            scoreVal = 120
            vx = -30
          } else if (spawn.type === 'cargo') {
            width = 16
            height = 12
            hp = 2
            scoreVal = 150
            vx = -40
          } else if (spawn.type === 'worm') {
            width = 12
            height = 12
            hp = 6
            scoreVal = 300
            vx = -55
          }

          enemiesRef.current.push({
            id: nextEntityIdRef.current++,
            type: spawn.type,
            x: SCREEN_WIDTH + 8,
            y: spawnY,
            vx,
            vy,
            width,
            height,
            hp,
            maxHp: hp,
            scoreValue: scoreVal,
            timeAlive: 0,
            initialY: spawnY,
            shootCooldown: 1.0 + Math.random(),
          })
        }

        // Trigger boss when timer reaches duration and no boss yet
        if (!bossActiveRef.current && levelTimerRef.current >= currentLevel.duration) {
          spawnBoss(currentLevel.bossType as 'boss1' | 'boss2' | 'boss3')
        }

        // 3. Update Enemies
        enemiesRef.current.forEach(e => {
          e.timeAlive += dt

          if (e.isBoss) {
            // Boss AI patterns
            if (e.x > SCREEN_WIDTH - e.width - 12) {
              e.x += e.vx * dt
            } else {
              // Move up and down
              e.y += e.vy * dt
              if (e.y < HUD_HEIGHT + 10) {
                e.y = HUD_HEIGHT + 10
                e.vy = Math.abs(e.vy)
              } else if (e.y > SCREEN_HEIGHT - e.height - 10) {
                e.y = SCREEN_HEIGHT - e.height - 10
                e.vy = -Math.abs(e.vy)
              }

              // Boss attack cooldown
              e.shootCooldown -= dt
              if (e.shootCooldown <= 0) {
                e.shootCooldown = e.hp < e.maxHp * 0.5 ? 0.9 : 1.4
                spaceSound.playHit()
                // Shoot plasma bullets towards player
                bulletsRef.current.push(
                  {
                    id: nextEntityIdRef.current++,
                    x: e.x - 4,
                    y: e.y + 10,
                    vx: -130,
                    vy: -20,
                    width: 5,
                    height: 5,
                    damage: 1,
                    isPlayer: false,
                    type: 'plasma',
                    life: 2.5,
                  },
                  {
                    id: nextEntityIdRef.current++,
                    x: e.x - 4,
                    y: e.y + e.height - 12,
                    vx: -130,
                    vy: 20,
                    width: 5,
                    height: 5,
                    damage: 1,
                    isPlayer: false,
                    type: 'plasma',
                    life: 2.5,
                  },
                )
              }
            }
          } else {
            // Regular enemy AI
            if (e.type === 'scout') {
              // Sinusoidal wave
              e.x += e.vx * dt
              e.y = e.initialY + Math.sin(e.timeAlive * 3.8) * 16
            } else if (e.type === 'diver') {
              e.x += e.vx * dt
              // Seek player Y gently
              if (Math.abs(e.y - p.y) > 4) {
                e.y += (e.y < p.y ? 35 : -35) * dt
              }
            } else if (e.type === 'cruiser') {
              if (e.x > 170) {
                e.x += e.vx * dt
              } else {
                // Hover and fire
                e.shootCooldown -= dt
                if (e.shootCooldown <= 0) {
                  e.shootCooldown = 1.8
                  spaceSound.playHit()
                  bulletsRef.current.push({
                    id: nextEntityIdRef.current++,
                    x: e.x - 4,
                    y: e.y + e.height / 2 - 2,
                    vx: -140,
                    vy: 0,
                    width: 5,
                    height: 5,
                    damage: 1,
                    isPlayer: false,
                    type: 'plasma',
                    life: 2.5,
                  })
                }
                e.x -= 15 * dt
              }
            } else if (e.type === 'worm') {
              e.x += e.vx * dt
              e.y = e.initialY + Math.sin(e.timeAlive * 5.0) * 25
            } else {
              e.x += e.vx * dt
            }
          }
        })

        // 4. Update Bullets & Homing Missiles
        bulletsRef.current.forEach(b => {
          if (b.homing && b.isPlayer) {
            // Find closest enemy
            let closest: Enemy | null = null
            let minDist = 99999
            enemiesRef.current.forEach(en => {
              const dist = Math.hypot(en.x - b.x, en.y - b.y)
              if (dist < minDist) {
                minDist = dist
                closest = en
              }
            })
            if (closest) {
              const target = closest as Enemy
              const angle = Math.atan2(target.y + target.height / 2 - b.y, target.x - b.x)
              b.vx += Math.cos(angle) * 350 * dt
              b.vy += Math.sin(angle) * 350 * dt
            }
          }

          b.x += b.vx * dt
          b.y += b.vy * dt
          b.life -= dt
        })

        // Filter offscreen or expired bullets
        bulletsRef.current = bulletsRef.current.filter(
          b => b.life > 0 && b.x > -20 && b.x < SCREEN_WIDTH + 20 && b.y > HUD_HEIGHT - 5 && b.y < SCREEN_HEIGHT + 10,
        )

        // 5. Update Power-ups
        powerupsRef.current.forEach(pw => {
          pw.x += pw.vx * dt
        })
        powerupsRef.current = powerupsRef.current.filter(pw => pw.x > -20)

        // 6. Update Particles
        particlesRef.current.forEach(part => {
          part.x += part.vx * dt
          part.y += part.vy * dt
          part.life -= dt
        })
        particlesRef.current = particlesRef.current.filter(part => part.life > 0)

        // 7. Update Starfield
        starsRef.current.forEach(st => {
          st.x -= st.speed * dt
          if (st.x < 0) {
            st.x = SCREEN_WIDTH
            st.y = HUD_HEIGHT + Math.random() * (SCREEN_HEIGHT - HUD_HEIGHT)
          }
        })

        // -----------------------------------------------------------
        // 8. Collisions: Player Bullets vs Enemies
        // -----------------------------------------------------------
        bulletsRef.current.forEach(b => {
          if (!b.isPlayer) return

          enemiesRef.current.forEach(en => {
            if (en.hp <= 0) return

            // AABB Check
            if (b.x < en.x + en.width && b.x + b.width > en.x && b.y < en.y + en.height && b.y + b.height > en.y) {
              en.hp -= b.damage
              if (b.type !== 'laser') {
                b.life = 0 // Destroy non-piercing bullet
              }

              if (en.hp <= 0) {
                // Destroyed enemy
                createExplosion(en.x + en.width / 2, en.y + en.height / 2, en.isBoss)
                setScore(prev => {
                  const newScore = prev + en.scoreValue
                  if (newScore > bestScore) {
                    setBestScore(newScore)
                    setIsNewBest(true)
                    saveScore(gameMeta, newScore)
                  }
                  return newScore
                })

                if (en.type === 'cargo') {
                  dropPowerup(en.x, en.y)
                }

                if (en.isBoss) {
                  // Boss defeated! Level victory!
                  spaceSound.playLevelClear()
                  setGameState('levelclear')
                }
              } else {
                spaceSound.playHit()
              }
            }
          })
        })

        // -----------------------------------------------------------
        // 9. Collisions: Enemy Bullets & Enemy Ships vs Player
        // -----------------------------------------------------------
        if (p.invulnerableTime <= 0 && !isGodMode) {
          // Check enemy bullets
          bulletsRef.current.forEach(b => {
            if (b.isPlayer || b.life <= 0) return

            if (b.x < p.x + p.width && b.x + b.width > p.x && b.y < p.y + p.height && b.y + b.height > p.y) {
              b.life = 0
              p.shields -= 1
              p.invulnerableTime = 1.2
              spaceSound.playPlayerHit()

              if (p.shields <= 0) {
                p.lives -= 1
                p.shields = p.maxShields
                createExplosion(p.x + p.width / 2, p.y + p.height / 2, true)
                spaceSound.playPlayerDeath()

                if (p.lives <= 0) {
                  setGameState('gameover')
                  spaceSound.playGameOver()
                }
              }
            }
          })

          // Check direct enemy collision
          enemiesRef.current.forEach(en => {
            if (en.hp <= 0) return

            if (en.x < p.x + p.width && en.x + en.width > p.x && en.y < p.y + p.height && en.y + en.height > p.y) {
              p.shields -= 2
              p.invulnerableTime = 1.4
              spaceSound.playPlayerHit()

              if (!en.isBoss) {
                en.hp = 0
                createExplosion(en.x + en.width / 2, en.y + en.height / 2, false)
              }

              if (p.shields <= 0) {
                p.lives -= 1
                p.shields = p.maxShields
                createExplosion(p.x + p.width / 2, p.y + p.height / 2, true)
                spaceSound.playPlayerDeath()

                if (p.lives <= 0) {
                  setGameState('gameover')
                  spaceSound.playGameOver()
                }
              }
            }
          })
        }

        // -----------------------------------------------------------
        // 10. Collisions: Player vs Power-ups
        // -----------------------------------------------------------
        powerupsRef.current.forEach(pw => {
          if (pw.x < p.x + p.width && pw.x + pw.width > p.x && pw.y < p.y + p.height && pw.y + pw.height > p.y) {
            // Collected powerup!
            spaceSound.playPowerup()
            pw.x = -100

            if (pw.type === 'shield') {
              p.shields = Math.min(p.maxShields, p.shields + 2)
            } else if (pw.type === 'rocket') {
              p.ammo.rocket = Math.min(99, p.ammo.rocket + 3)
              p.selectedSpecial = 'rocket'
            } else if (pw.type === 'laser') {
              p.ammo.laser = Math.min(99, p.ammo.laser + 2)
              p.selectedSpecial = 'laser'
            } else if (pw.type === 'bomb') {
              p.ammo.bomb = Math.min(99, p.ammo.bomb + 1)
              p.selectedSpecial = 'bomb'
            } else if (pw.type === 'upgrade') {
              p.blasterLevel = Math.min(3, p.blasterLevel + 1)
            } else if (pw.type === 'points') {
              setScore(prev => prev + 1000)
            }
          }
        })

        // Clean up dead entities
        enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0 && e.x > -60)
        powerupsRef.current = powerupsRef.current.filter(pw => pw.x > -20)
      }

      // Render Frame
      renderCanvas()

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [gameState, isGodMode, bestScore, fireBlaster, createExplosion, dropPowerup, spawnBoss, renderCanvas])

  return (
    <GameLayout title={gameMeta.name} description={gameMeta.description} rules={gameMeta.rules}>
      <div className="flex flex-col items-center justify-center w-full py-1">
        {/* Top Header stats info */}
        <div className="flex justify-between items-center w-full max-w-[350px] mb-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold">
          <span className="text-emerald-400 flex items-center gap-1">
            🚀 NOKIA 3510i · SPACE IMPACT
          </span>
          <span className="text-amber-300">
            👑 BEST: <span className="text-white ml-1">{bestScore || 0}</span>
          </span>
        </div>

        {/* EXACT NOKIA 3510i MOBILE PHONE CHASSIS (Shared Handset Component) */}
        <NokiaPhone
          screenBg={THEMES[lcdTheme].bg}
          onLeftSoft={() => {
            if (gameState === 'title') startNewGame()
            else fireBlaster()
          }}
          onRightSoft={() => {
            if (gameState === 'playing') fireSpecialWeapon()
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

        {/* Quick Interactive Shortcuts & Mode Toggles under Phone */}
        <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[350px] text-[11px] font-mono text-zinc-400 text-center">
          <button
            type="button"
            onClick={() => fireBlaster()}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Fire primary blasters"
          >
            🔥 <strong className="text-zinc-200">5 / OK</strong>: Fire
          </button>
          <button
            type="button"
            onClick={() => fireSpecialWeapon()}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Fire equipped special weapon"
          >
            🚀 <strong className="text-zinc-200">0 / C</strong>: Special
          </button>
          <button
            type="button"
            onClick={() => setLcdTheme(prev => (prev === 'green' ? 'color' : prev === 'color' ? 'mono' : 'green'))}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Switch LCD theme: Classic Green, Color 3510i, or Monochrome"
          >
            🎨 <strong className="text-zinc-200">#</strong>: LCD ({lcdTheme.toUpperCase()})
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
