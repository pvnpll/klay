/**
 * Authentic Nokia Space Impact Pixel Sprites
 * '1' = solid pixel, '2' = highlight pixel, '0' or '.' = transparent
 */

export type SpriteMatrix = string[]

// Player Ship (Iconic Nokia Space Impact fighter, 16x11 px)
export const SPRITE_PLAYER: SpriteMatrix = [
  '........11......',
  '..111111111.....',
  '1111221111111...',
  '111222111111111.',
  '1111111111111111',
  '1111111111111111',
  '111222111111111.',
  '1111221111111...',
  '..111111111.....',
  '........11......',
]

// Animated thruster flame frames
export const SPRITE_THRUSTER_0: SpriteMatrix = [
  '..',
  '1.',
  '11',
  '11',
  '1.',
  '..',
]

export const SPRITE_THRUSTER_1: SpriteMatrix = [
  '1.',
  '11',
  '11',
  '11',
  '11',
  '1.',
]

// Scout Drone (Wavy sine flyer, 14x10 px)
export const SPRITE_SCOUT: SpriteMatrix = [
  '.....1111.....',
  '....111111....',
  '..1111221111..',
  '11111111111111',
  '11111111111111',
  '..1111111111..',
  '....11..11....',
  '....11..11....',
]

// Diver / Charger (Fast arrow insect, 12x10 px)
export const SPRITE_DIVER: SpriteMatrix = [
  '11..........',
  '1111........',
  '..1111......',
  '..111111....',
  '111111111111',
  '111111111111',
  '..111111....',
  '..1111......',
  '1111........',
  '11..........',
]

// Cruiser / Gunship (Heavy alien ship with cannons, 18x12 px)
export const SPRITE_CRUISER: SpriteMatrix = [
  '.....111111.......',
  '....11111111......',
  '1111112222111111..',
  '111111111111111111',
  '..11111111111111..',
  '....1111111111....',
  '..11111111111111..',
  '111111111111111111',
  '1111112222111111..',
  '....11111111......',
  '.....111111.......',
]

// Space Mine (Spiky 8-way mine, 12x12 px)
export const SPRITE_MINE: SpriteMatrix = [
  '.....11.....',
  '..1..11..1..',
  '...111111...',
  '...111111...',
  '111112211111',
  '111112211111',
  '...111111...',
  '...111111...',
  '..1..11..1..',
  '.....11.....',
]

// Cargo / Powerup Pod (14x10 px)
export const SPRITE_CARGO: SpriteMatrix = [
  '..1111111111..',
  '.111111111111.',
  '111..1111..111',
  '111.112211.111',
  '111.112211.111',
  '111..1111..111',
  '.111111111111.',
  '..1111111111..',
]

// Alien Worm Segment (10x10 px)
export const SPRITE_WORM_SEGMENT: SpriteMatrix = [
  '..111111..',
  '.11111111.',
  '1111221111',
  '1112222111',
  '1111221111',
  '.11111111.',
  '..111111..',
]

// Level 1 Boss: The Megacrab (Original Space Impact Boss 1, 28x26 px)
export const SPRITE_BOSS1_MEGACRAB: SpriteMatrix = [
  '....1111..................1111....',
  '...111111................111111...',
  '..11111111..............11111111..',
  '..1111..111............111..1111..',
  '...1111..111..........111..1111...',
  '....1111.1111111111111111.1111....',
  '.....111111111111111111111111.....',
  '...1111111111111111111111111111...',
  '..111111111111222211111111111111..',
  '.11111111111122222211111111111111.',
  '1111111111111222222111111111111111',
  '1111111111111122221111111111111111',
  '1111111111111111111111111111111111',
  '1111111111111111111111111111111111',
  '.11111111111122222211111111111111.',
  '..111111111111222211111111111111..',
  '...1111111111111111111111111111...',
  '.....111111111111111111111111.....',
  '....1111.1111111111111111.1111....',
  '...1111..111..........111..1111...',
  '..1111..111............111..1111..',
  '..11111111..............11111111..',
  '...111111................111111...',
  '....1111..................1111....',
]

// Level 2 Boss: Mecha-Skull Dreadnought (30x26 px)
export const SPRITE_BOSS2_SKULL: SpriteMatrix = [
  '......1111111111111111......',
  '....11111111111111111111....',
  '..111111111111111111111111..',
  '..111111111111111111111111..',
  '.1111..11111111111111..1111.',
  '.111....111111111111....111.',
  '1111....111111111111....1111',
  '11111..11111111111111..11111',
  '1111111111111111111111111111',
  '.11111111111111111111111111.',
  '..111111111111111111111111..',
  '...1111111111111111111111...',
  '....1111.11.11.11.11.1111....',
  '....1111.11.11.11.11.1111....',
  '.....1111111111111111111.....',
]

// Level 3 Boss: Queen Hive Core (32x28 px)
export const SPRITE_BOSS3_QUEEN: SpriteMatrix = [
  '........111111111111........',
  '......1111111111111111......',
  '....11111111222211111111....',
  '..111111112222222211111111..',
  '..111111122222222221111111..',
  '.11111111222222222211111111.',
  '.11111111122222222111111111.',
  '1111..1111112222111111..1111',
  '111....11111111111111....111',
  '1111..1111111111111111..1111',
  '.11111111111111111111111111.',
  '..111111111111111111111111..',
  '....11111111111111111111....',
  '......1111111111111111......',
]

// Explosion frames (Chunky 8-bit blast stages)
export const SPRITE_EXPLODE_1: SpriteMatrix = [
  '..11..',
  '.1111.',
  '111111',
  '111111',
  '.1111.',
  '..11..',
]

export const SPRITE_EXPLODE_2: SpriteMatrix = [
  '.1..1.',
  '1.11.1',
  '.1..1.',
  '1.11.1',
  '.1..1.',
]

export const SPRITE_EXPLODE_3: SpriteMatrix = [
  '1....1',
  '..11..',
  '.1..1.',
  '..11..',
  '1....1',
]

// Missile Sprite (10x6 px)
export const SPRITE_MISSILE: SpriteMatrix = [
  '..111111..',
  '1111111111',
  '1111111111',
  '..111111..',
]

// Powerup Glyph Matrices (8x8 px)
export const GLYPH_SHIELD: SpriteMatrix = [
  '11....11',
  '11....11',
  '11111111',
  '11111111',
  '11....11',
  '11....11',
]

export const GLYPH_MISSILE: SpriteMatrix = [
  '11....11',
  '111..111',
  '11111111',
  '11.11.11',
  '11....11',
  '11....11',
]

export const GLYPH_LASER: SpriteMatrix = [
  '11......',
  '11......',
  '11......',
  '11......',
  '11111111',
  '11111111',
]

export const GLYPH_BOMB: SpriteMatrix = [
  '111111..',
  '11...11.',
  '111111..',
  '11...11.',
  '111111..',
]

export const GLYPH_UPGRADE: SpriteMatrix = [
  '11....11',
  '11....11',
  '11....11',
  '11....11',
  '.111111.',
]

/**
 * Universal Pixel Sprite Renderer
 * Draws chunky, sharp square pixels on any 2D canvas context.
 */
export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  matrix: SpriteMatrix,
  x: number,
  y: number,
  scale = 1,
  primaryColor = '#182210',
  secondaryColor = '#3b4d24',
) {
  const roundedX = Math.round(x)
  const roundedY = Math.round(y)

  for (let row = 0; row < matrix.length; row++) {
    const line = matrix[row]
    for (let col = 0; col < line.length; col++) {
      const char = line[col]
      if (char === '1') {
        ctx.fillStyle = primaryColor
        ctx.fillRect(roundedX + col * scale, roundedY + row * scale, scale, scale)
      } else if (char === '2') {
        ctx.fillStyle = secondaryColor
        ctx.fillRect(roundedX + col * scale, roundedY + row * scale, scale, scale)
      }
    }
  }
}
