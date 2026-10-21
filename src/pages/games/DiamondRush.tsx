import { useEffect, useRef, useState, useCallback } from 'react'
import { GameLayout } from '../../components/GameLayout'
import { GameResult } from '../../components/GameResult'
import { NokiaPhone } from '../../components/NokiaPhone'
import { GAMES } from '../../data/games'
import { saveScore, getStats } from '../../utils/storage'
import { diamondRushSound } from './diamond-rush/sound'
import {
  SPRITE_EXPLORER_FRONT,
  SPRITE_BOULDER,
  SPRITE_RUBY,
  SPRITE_DIAMOND,
  SPRITE_SNAKE,
  SPRITE_WALL,
  SPRITE_DIRT,
  SPRITE_CHEST,
  SPRITE_EXIT_GATE,
  drawPixelSprite,
} from './diamond-rush/sprites'
import { LEVELS, TILE_SIZE } from './diamond-rush/levels'
import type { GameState, TileType, Particle } from './diamond-rush/types'

export const SCREEN_WIDTH = 258
export const SCREEN_HEIGHT = 248
export const HUD_HEIGHT = 22

export default function DiamondRush() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<GameState>('title')
  const [score, setScore] = useState<number>(0)
  const [levelIndex, setLevelIndex] = useState<number>(0)
  const [, setDiamondsCount] = useState<{ current: number; needed: number }>({
    current: 0,
    needed: 3,
  })
  const [isGodMode, setIsGodMode] = useState<boolean>(false)

  const [bestScore, setBestScore] = useState<number>(() => {
    return getStats().bests['diamond-rush'] || 0
  })
  const [isNewBest, setIsNewBest] = useState<boolean>(false)

  // Mutable Game References for High-Performance 60 FPS Loop
  const gameStateRef = useRef<GameState>('title')
  const scoreRef = useRef<number>(0)
  const levelIndexRef = useRef<number>(0)
  const isGodModeRef = useRef<boolean>(false)

  // Player Explorer State
  const playerRef = useRef({
    gridX: 1,
    gridY: 1,
    x: 16,
    y: 16,
    facing: 'down' as 'up' | 'down' | 'left' | 'right',
    diamondsCollected: 0,
    diamondsNeeded: 3,
    lives: 3,
    maxLives: 3,
    invulnerableTime: 0,
  })

  // Grid Map: 16 cols x 14 rows
  const gridRef = useRef<TileType[][]>([])
  const particlesRef = useRef<Particle[]>([])
  const cheatSequenceRef = useRef<string>('')
  const boulderFallTimerRef = useRef<number>(0)

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

  // Spawn visual particles
  const addParticles = useCallback(
    (x: number, y: number, count: number, color: string, speed = 40, size = 2) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const spd = (Math.random() * 0.7 + 0.3) * speed
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 0,
          maxLife: 0.3 + Math.random() * 0.25,
          size: Math.random() > 0.5 ? size : Math.max(1, size - 1),
          color,
        })
      }
    },
    [],
  )

  // Load a Level
  const initLevel = useCallback((lvlIdx: number, keepStats = false) => {
    const lvl = LEVELS[lvlIdx % LEVELS.length]
    levelIndexRef.current = lvlIdx
    setLevelIndex(lvlIdx)

    // Deep copy tile grid
    gridRef.current = lvl.tiles.map(row => [...row])

    const p = playerRef.current
    p.gridX = lvl.playerStart.x
    p.gridY = lvl.playerStart.y
    p.x = p.gridX * TILE_SIZE
    p.y = p.gridY * TILE_SIZE
    p.diamondsCollected = 0
    p.diamondsNeeded = lvl.diamondsRequired
    p.invulnerableTime = 0
    if (!keepStats) {
      p.lives = 3
    }

    setDiamondsCount({ current: 0, needed: lvl.diamondsRequired })
    particlesRef.current = []
  }, [])

  // Start fresh game
  const startNewGame = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    setIsNewBest(false)
    initLevel(0, false)
    setGameState('playing')
    diamondRushSound.playKeyClick()
  }, [initLevel])

  // Move Player by Grid Steps (dx, dy)
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (gameStateRef.current !== 'playing') return
      const p = playerRef.current
      const grid = gridRef.current
      if (!grid.length) return

      const targetX = p.gridX + dx
      const targetY = p.gridY + dy

      // Facing orientation
      if (dx < 0) p.facing = 'left'
      else if (dx > 0) p.facing = 'right'
      else if (dy < 0) p.facing = 'up'
      else if (dy > 0) p.facing = 'down'

      if (targetY < 0 || targetY >= grid.length || targetX < 0 || targetX >= grid[0].length) return
      const targetTile = grid[targetY][targetX]

      // 1. Move into Empty
      if (targetTile === 'empty') {
        p.gridX = targetX
        p.gridY = targetY
        p.x = targetX * TILE_SIZE
        p.y = targetY * TILE_SIZE
        return
      }

      // 2. Dig through Dirt
      if (targetTile === 'dirt') {
        grid[targetY][targetX] = 'empty'
        p.gridX = targetX
        p.gridY = targetY
        p.x = targetX * TILE_SIZE
        p.y = targetY * TILE_SIZE
        diamondRushSound.playDig()
        addParticles(targetX * TILE_SIZE + 8, targetY * TILE_SIZE + 8, 8, '#8b572a', 30, 2)
        scoreRef.current += 10
        setScore(scoreRef.current)
        return
      }

      // 3. Collect Ruby
      if (targetTile === 'ruby') {
        grid[targetY][targetX] = 'empty'
        p.gridX = targetX
        p.gridY = targetY
        p.x = targetX * TILE_SIZE
        p.y = targetY * TILE_SIZE
        diamondRushSound.playGemPickup()
        addParticles(targetX * TILE_SIZE + 8, targetY * TILE_SIZE + 8, 12, '#ff3f34', 50, 2)
        scoreRef.current += 100
        setScore(scoreRef.current)
        return
      }

      // 4. Collect Diamond
      if (targetTile === 'diamond') {
        grid[targetY][targetX] = 'empty'
        p.gridX = targetX
        p.gridY = targetY
        p.x = targetX * TILE_SIZE
        p.y = targetY * TILE_SIZE
        p.diamondsCollected += 1
        setDiamondsCount({ current: p.diamondsCollected, needed: p.diamondsNeeded })
        diamondRushSound.playDiamondPickup()
        addParticles(targetX * TILE_SIZE + 8, targetY * TILE_SIZE + 8, 16, '#00d2d3', 60, 2)
        scoreRef.current += 300
        setScore(scoreRef.current)
        return
      }

      // 5. Open Chest
      if (targetTile === 'chest') {
        grid[targetY][targetX] = 'empty'
        p.gridX = targetX
        p.gridY = targetY
        p.x = targetX * TILE_SIZE
        p.y = targetY * TILE_SIZE
        diamondRushSound.playDiamondPickup()
        addParticles(targetX * TILE_SIZE + 8, targetY * TILE_SIZE + 8, 20, '#ffa801', 70, 2)
        scoreRef.current += 1000
        setScore(scoreRef.current)
        return
      }

      // 6. Push Boulder (Horizontally only)
      if (targetTile === 'boulder' && dy === 0) {
        const behindX = targetX + dx
        if (behindX >= 0 && behindX < grid[0].length && grid[targetY][behindX] === 'empty') {
          grid[targetY][behindX] = 'boulder'
          grid[targetY][targetX] = 'empty'
          p.gridX = targetX
          p.gridY = targetY
          p.x = targetX * TILE_SIZE
          p.y = targetY * TILE_SIZE
          diamondRushSound.playBoulderThud()
          return
        }
      }

      // 7. Reach Exit Gate
      if (targetTile === 'exit') {
        if (p.diamondsCollected >= p.diamondsNeeded || isGodModeRef.current) {
          diamondRushSound.playVictory()
          scoreRef.current += 2000
          setScore(scoreRef.current)

          if (levelIndexRef.current >= LEVELS.length - 1) {
            gameStateRef.current = 'victory'
            setGameState('victory')
            const currentMeta = GAMES.find(g => g.id === 'diamond-rush')!
            const isBest = saveScore(currentMeta, scoreRef.current)
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
    },
    [addParticles],
  )

  // Handle Nokia Keypad Cheats (787898 or 1989 for God Mode)
  const handleKeyCheat = useCallback(
    (key: string) => {
      cheatSequenceRef.current = (cheatSequenceRef.current + key).slice(-6)

      if (cheatSequenceRef.current === '787898' || cheatSequenceRef.current.endsWith('1989')) {
        setIsGodMode(prev => {
          const next = !prev
          if (next) {
            playerRef.current.lives = playerRef.current.maxLives
            playerRef.current.diamondsCollected = playerRef.current.diamondsNeeded
            setDiamondsCount({
              current: playerRef.current.diamondsNeeded,
              needed: playerRef.current.diamondsNeeded,
            })
            diamondRushSound.playCheat()
          }
          return next
        })
        cheatSequenceRef.current = ''
      }

      if (key === '4') movePlayer(-1, 0)
      if (key === '6') movePlayer(1, 0)
      if (key === '2') {
        if (gameStateRef.current === 'title') startNewGame()
        else movePlayer(0, -1)
      }
      if (key === '8') movePlayer(0, 1)
      if (key === '5') {
        if (gameStateRef.current === 'title') startNewGame()
        else if (gameStateRef.current === 'levelclear') {
          initLevel(levelIndexRef.current + 1, true)
          setGameState('playing')
        }
      }
    },
    [movePlayer, startNewGame, initLevel],
  )

  // Directional Buttons / D-Pad
  const handleDirectionPress = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => {
      if (pressed) {
        if (gameStateRef.current === 'title') {
          startNewGame()
          return
        }
        if (dir === 'left') movePlayer(-1, 0)
        if (dir === 'right') movePlayer(1, 0)
        if (dir === 'up') movePlayer(0, -1)
        if (dir === 'down') movePlayer(0, 1)
      }
    },
    [movePlayer, startNewGame],
  )

  const handleActionPress = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        if (gameStateRef.current === 'title') startNewGame()
        else if (gameStateRef.current === 'levelclear') {
          initLevel(levelIndexRef.current + 1, true)
          setGameState('playing')
        }
      }
    },
    [startNewGame, initLevel],
  )

  // Direct LCD Touchscreen Handlers
  const handleLcdPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scaleX = SCREEN_WIDTH / rect.width
    const scaleY = SCREEN_HEIGHT / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY

    if (gameStateRef.current === 'title' || gameStateRef.current === 'gameover') {
      startNewGame()
      return
    }

    if (gameStateRef.current === 'levelclear') {
      initLevel(levelIndexRef.current + 1, true)
      setGameState('playing')
      return
    }

    // Directional tap relative to player
    const p = playerRef.current
    const playerCenterX = p.gridX * TILE_SIZE + 8
    const playerCenterY = HUD_HEIGHT + p.gridY * TILE_SIZE + 8
    const dx = canvasX - playerCenterX
    const dy = canvasY - playerCenterY

    if (Math.abs(dx) > Math.abs(dy)) {
      movePlayer(dx > 0 ? 1 : -1, 0)
    } else {
      movePlayer(0, dy > 0 ? 1 : -1)
    }
  }

  // Keyboard Shortcuts (Arrow keys, WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault()
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePlayer(-1, 0)
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayer(1, 0)
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (gameStateRef.current === 'title') startNewGame()
        else movePlayer(0, -1)
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') movePlayer(0, 1)
      if (e.key === ' ' || e.key === 'Enter') {
        if (gameStateRef.current === 'title' || gameStateRef.current === 'gameover') {
          startNewGame()
        } else if (gameStateRef.current === 'levelclear') {
          initLevel(levelIndexRef.current + 1, true)
          setGameState('playing')
        }
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState(prev => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [movePlayer, startNewGame, initLevel])

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
      const grid = gridRef.current
      const p = playerRef.current

      // -------------------------------------------------------------
      // 1. BOULDER GRAVITY & ROLLING PHYSICS
      // -------------------------------------------------------------
      if (state === 'playing' && grid.length > 0) {
        boulderFallTimerRef.current += dt
        if (boulderFallTimerRef.current > 0.18) {
          boulderFallTimerRef.current = 0

          // Iterate bottom to top so falling cascades correctly
          for (let r = grid.length - 2; r >= 0; r--) {
            for (let c = 0; c < grid[0].length; c++) {
              if (grid[r][c] === 'boulder') {
                const below = grid[r + 1][c]

                // Fall straight down into empty
                if (below === 'empty' && !(p.gridX === c && p.gridY === r + 1)) {
                  grid[r + 1][c] = 'boulder'
                  grid[r][c] = 'empty'
                  diamondRushSound.playBoulderThud()
                }
                // Squash Snake below!
                else if (below === 'snake') {
                  grid[r + 1][c] = 'boulder'
                  grid[r][c] = 'empty'
                  diamondRushSound.playSquash()
                  addParticles(c * TILE_SIZE + 8, (r + 1) * TILE_SIZE + 8, 18, '#05c46b', 60, 2)
                  scoreRef.current += 500
                  setScore(scoreRef.current)
                }
                // Roll off boulder or wall
                else if (below === 'boulder' || below === 'wall') {
                  // Check roll left
                  if (
                    c > 0 &&
                    grid[r][c - 1] === 'empty' &&
                    grid[r + 1][c - 1] === 'empty' &&
                    !(p.gridX === c - 1 && p.gridY === r)
                  ) {
                    grid[r][c - 1] = 'boulder'
                    grid[r][c] = 'empty'
                  }
                  // Check roll right
                  else if (
                    c < grid[0].length - 1 &&
                    grid[r][c + 1] === 'empty' &&
                    grid[r + 1][c + 1] === 'empty' &&
                    !(p.gridX === c + 1 && p.gridY === r)
                  ) {
                    grid[r][c + 1] = 'boulder'
                    grid[r][c] = 'empty'
                  }
                }
              }
            }
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

      // -------------------------------------------------------------
      // 2. CANVAS RENDERING
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      // Temple Background
      ctx.fillStyle = '#1e272e'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

      // Render Grid Tiles
      if (grid.length > 0) {
        for (let r = 0; r < grid.length; r++) {
          for (let c = 0; c < grid[0].length; c++) {
            const tile = grid[r][c]
            const drawX = c * TILE_SIZE
            const drawY = HUD_HEIGHT + r * TILE_SIZE

            if (tile === 'wall') {
              drawPixelSprite(ctx, SPRITE_WALL, drawX, drawY, 1)
            } else if (tile === 'dirt') {
              drawPixelSprite(ctx, SPRITE_DIRT, drawX, drawY, 1)
            } else if (tile === 'boulder') {
              drawPixelSprite(ctx, SPRITE_BOULDER, drawX, drawY, 1)
            } else if (tile === 'ruby') {
              drawPixelSprite(ctx, SPRITE_RUBY, drawX + 3, drawY + 3, 1)
            } else if (tile === 'diamond') {
              drawPixelSprite(ctx, SPRITE_DIAMOND, drawX + 2, drawY + 2, 1)
            } else if (tile === 'chest') {
              drawPixelSprite(ctx, SPRITE_CHEST, drawX + 1, drawY + 1, 1)
            } else if (tile === 'snake') {
              drawPixelSprite(ctx, SPRITE_SNAKE, drawX + 1, drawY + 2, 1)
            } else if (tile === 'exit') {
              drawPixelSprite(ctx, SPRITE_EXIT_GATE, drawX, drawY, 1)
              // Glow if unlocked
              if (p.diamondsCollected >= p.diamondsNeeded || isGodModeRef.current) {
                ctx.fillStyle = 'rgba(0, 210, 211, 0.4)'
                ctx.fillRect(drawX + 3, drawY + 3, 10, 10)
              }
            }
          }
        }
      }

      // Render Player Explorer
      if (p.lives > 0 || state === 'title') {
        const px = p.gridX * TILE_SIZE
        const py = HUD_HEIGHT + p.gridY * TILE_SIZE
        drawPixelSprite(ctx, SPRITE_EXPLORER_FRONT, px, py, 1)

        // God Mode Glow
        if (isGodModeRef.current) {
          ctx.strokeStyle = '#ffa801'
          ctx.lineWidth = 1.5
          ctx.strokeRect(px - 1, py - 1, TILE_SIZE + 2, TILE_SIZE + 2)
        }
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
      ctx.fillStyle = '#f5cd79'
      ctx.fillRect(0, HUD_HEIGHT - 1, SCREEN_WIDTH, 1)

      // Diamonds Progress (Icon + Count)
      drawPixelSprite(ctx, SPRITE_DIAMOND, 8, 5, 0.8)
      ctx.fillStyle = '#00d2d3'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${p.diamondsCollected}/${p.diamondsNeeded}`, 22, 15)

      // Level Name
      ctx.fillStyle = '#f5cd79'
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`LVL ${levelIndexRef.current + 1}`, SCREEN_WIDTH / 2, 15)

      // Score
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${scoreRef.current}`, SCREEN_WIDTH - 8, 15)

      // -------------------------------------------------------------
      // 4. OVERLAYS (Title, Level Clear, GameOver, Paused)
      // -------------------------------------------------------------
      if (state === 'title') {
        ctx.fillStyle = 'rgba(10, 15, 25, 0.94)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        ctx.fillStyle = '#00d2d3'
        ctx.font = 'bold 18px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('DIAMOND RUSH', SCREEN_WIDTH / 2, 58)

        ctx.fillStyle = '#ffa801'
        ctx.font = 'bold 10px monospace'
        ctx.fillText('GAMELOFT · NOKIA 3510i EDITION', SCREEN_WIDTH / 2, 76)

        // Explorer & Diamond in Center
        drawPixelSprite(ctx, SPRITE_EXPLORER_FRONT, SCREEN_WIDTH / 2 - 16, 100, 1.4)
        drawPixelSprite(ctx, SPRITE_DIAMOND, SCREEN_WIDTH / 2 + 10, 106, 1.2)

        const pulse = Math.floor(currentTime * 0.003) % 2 === 0
        if (pulse) {
          ctx.fillStyle = '#f5cd79'
          ctx.font = 'bold 11px monospace'
          ctx.fillText('PRESS 5 / TAP TO EXPLORE', SCREEN_WIDTH / 2, 166)
        }

        ctx.fillStyle = '#a4b0be'
        ctx.font = '8px monospace'
        ctx.fillText('2/4/6/8: MOVE & PUSH BOULDERS', SCREEN_WIDTH / 2, 196)
        ctx.fillText('COLLECT ALL GEMS TO OPEN PORTAL', SCREEN_WIDTH / 2, 208)
        ctx.fillText('CHEAT: 787898 FOR GOD MODE', SCREEN_WIDTH / 2, 222)
      } else if (state === 'levelclear') {
        ctx.fillStyle = 'rgba(10, 15, 25, 0.88)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        ctx.fillStyle = '#00d2d3'
        ctx.font = 'bold 15px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('TEMPLE CLEARED!', SCREEN_WIDTH / 2, 80)

        ctx.fillStyle = '#ecf0f1'
        ctx.font = '10px monospace'
        ctx.fillText(`SCORE: ${scoreRef.current}`, SCREEN_WIDTH / 2, 110)
        ctx.fillText('DIAMOND BONUS: +1000', SCREEN_WIDTH / 2, 128)

        const pulse = Math.floor(currentTime * 0.003) % 2 === 0
        if (pulse) {
          ctx.fillStyle = '#2ecc71'
          ctx.font = 'bold 10px monospace'
          ctx.fillText('TAP OR PRESS 5 TO ADVANCE', SCREEN_WIDTH / 2, 175)
        }
      } else if (state === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        ctx.fillStyle = '#00d2d3'
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

  const gameMeta = GAMES.find(g => g.id === 'diamond-rush')!

  return (
    <GameLayout title={gameMeta.name} description={gameMeta.description} rules={gameMeta.rules}>
      <div className="flex flex-col items-center justify-center w-full py-1">
        {/* Top Header stats info */}
        <div className="flex justify-between items-center w-full max-w-[350px] mb-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold">
          <span className="text-cyan-400 flex items-center gap-1">
            💎 NOKIA 3510i · DIAMOND RUSH
          </span>
          <span className="text-amber-300">
            🏆 BEST: <span className="text-white ml-1">{bestScore || 0}</span>
          </span>
        </div>

        {/* EXACT NOKIA 3510i MOBILE PHONE CHASSIS */}
        <NokiaPhone
          screenBg="#1e272e"
          onLeftSoft={() => {
            if (gameState === 'title') startNewGame()
            else if (gameState === 'levelclear') {
              initLevel(levelIndex + 1, true)
              setGameState('playing')
            }
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
            className="w-full h-full block cursor-crosshair touch-none"
            title="Nokia 3510i Screen (Touch or Keypad to play)"
          />
        </NokiaPhone>

        {/* Quick Interactive Shortcuts under Phone */}
        <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[350px] text-[11px] font-mono text-zinc-400 text-center">
          <button
            type="button"
            onClick={() => movePlayer(0, -1)}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Move Up"
          >
            ⬆️ <strong className="text-zinc-200">2 / Up</strong>
          </button>
          <button
            type="button"
            onClick={() => movePlayer(-1, 0)}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Move Left"
          >
            ⬅️ <strong className="text-zinc-200">4 / Left</strong>
          </button>
          <button
            type="button"
            onClick={() => movePlayer(1, 0)}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Move Right"
          >
            ➡️ <strong className="text-zinc-200">6 / Right</strong>
          </button>
          <button
            type="button"
            onClick={() => movePlayer(0, 1)}
            className="bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Move Down"
          >
            ⬇️ <strong className="text-zinc-200">8 / Down</strong>
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
