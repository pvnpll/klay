export type SpriteMatrix = string[]

// Explorer (16x16 px)
export const SPRITE_EXPLORER_FRONT: SpriteMatrix = [
  '.....111111.....',
  '....11111111....', // Fedora hat
  '..111111111111..',
  '....12222221....',
  '....12322321....',
  '.....222222.....',
  '....44444444....', // Blue shirt
  '....45544554....',
  '....44444444....',
  '....11111111....', // Belt
  '....66666666....', // Khaki trousers
  '....666..666....',
  '....666..666....',
  '....111..111....', // Boots
  '....111..111....',
  '................',
]

// Round Rolling Boulder (16x16 px)
export const SPRITE_BOULDER: SpriteMatrix = [
  '.....777777.....',
  '...7778888777...',
  '..778888888877..',
  '.77888888888877.',
  '.78888888888887.',
  '7888888888888887',
  '7888888888888887',
  '7888888888888887',
  '7888888888888887',
  '7888888888888887',
  '.78888888888887.',
  '.77888888888877.',
  '..778888888877..',
  '...7778888777...',
  '.....777777.....',
  '................',
]

// Red Ruby (10x10 px)
export const SPRITE_RUBY: SpriteMatrix = [
  '..999999..',
  '.99999999.',
  '9999999999',
  '9999999999',
  '.99999999.',
  '..999999..',
  '...9999...',
  '....99....',
]

// Sparkling Blue Diamond (12x12 px)
export const SPRITE_DIAMOND: SpriteMatrix = [
  '....aaaa....',
  '..aaaaaaaa..',
  '.aaaaaaaaaa.',
  'aaaaaaaaaaaa',
  'aaaaaaaaaaaa',
  '.aaaaaaaaaa.',
  '..aaaaaaaa..',
  '...aaaaaa...',
  '....aaaa....',
  '.....aa.....',
]

// Temple Cobra Snake (14x12 px)
export const SPRITE_SNAKE: SpriteMatrix = [
  '...bbbbbbb....',
  '..bbbbbbbbb...',
  '..bb33bb33b...',
  '..bbbbbbbbb...',
  '...bbbbbbb....',
  '....bbbbb.....',
  '..bbbbbbbbb...',
  '.bbbbbbbbbbb..',
  'bbbb.....bbbb.',
  'bbb.......bbb.',
  'bb.........bb.',
]

// Ancient Stone Wall Block (16x16 px)
export const SPRITE_WALL: SpriteMatrix = [
  'cccccccccccccccc',
  'cdddddddcddddddc',
  'cdddddddcddddddc',
  'cccccccccccccccc',
  'cddddcddddddcddc',
  'cddddcddddddcddc',
  'cccccccccccccccc',
  'cdddddddcddddddc',
  'cdddddddcddddddc',
  'cccccccccccccccc',
  'cddddcddddddcddc',
  'cddddcddddddcddc',
  'cccccccccccccccc',
  'cdddddddcddddddc',
  'cdddddddcddddddc',
  'cccccccccccccccc',
]

// Soft Soil / Dirt (16x16 px)
export const SPRITE_DIRT: SpriteMatrix = [
  'eeeeeeeeeeeeeeee',
  'eeffeeefffeeeffe',
  'effeeeefffeeeffe',
  'eeeeeeeeeeeeeeee',
  'eeffeeeeeeffeeee',
  'eeeeffeeeffeeeee',
  'eeeeeeeeeeeeeeee',
  'eeffeeeeffeeeeff',
  'efffeeefffeeeffe',
  'eeeeeeeeeeeeeeee',
  'eeffeeeeeeffeeee',
  'eeeeffeeeffeeeee',
  'eeeeeeeeeeeeeeee',
  'eeffeeeeffeeeeff',
  'efffeeefffeeeffe',
  'eeeeeeeeeeeeeeee',
]

// Golden Treasure Chest (14x14 px)
export const SPRITE_CHEST: SpriteMatrix = [
  '..ffffffffff..',
  '.ffffffffffff.',
  'ffffffffffffff',
  'ff1111111111ff',
  'ffffffffff11ff',
  'ffffffffff11ff',
  'ffffffffffffff',
  'ffffffffffffff',
  'ffffffffffffff',
  'ffffffffffffff',
  'ffffffffffffff',
  '..ffffffffff..',
]

// Ancient Exit Portal Gate (16x16 px)
export const SPRITE_EXIT_GATE: SpriteMatrix = [
  'gggggggggggggggg',
  'ghhhhhhhhhhhhhhg',
  'gh111111111111hg',
  'gh1..........1hg',
  'gh1..........1hg',
  'gh1..........1hg',
  'gh1..........1hg',
  'gh1..........1hg',
  'gh1..........1hg',
  'gh1..........1hg',
  'gh1..........1hg',
  'gh1..........1hg',
  'gh111111111111hg',
  'ghhhhhhhhhhhhhhg',
  'gggggggggggggggg',
  'gggggggggggggggg',
]

const COLOR_MAP: Record<string, string> = {
  '1': '#1e272e', // Outline black
  '2': '#ffdd59', // Skin tan
  '3': '#0be881', // Eyes green
  '4': '#0fbcf9', // Explorer shirt cyan-blue
  '5': '#d2dae2', // White vest straps
  '6': '#d6a2e8', // Khaki
  '7': '#485460', // Dark grey rock
  '8': '#808e9b', // Light grey stone
  '9': '#ff3f34', // Ruby red
  'a': '#00d2d3', // Diamond cyan
  'b': '#05c46b', // Snake green
  'c': '#2f3542', // Wall mortar
  'd': '#57606f', // Wall brick
  'e': '#8b572a', // Dirt brown
  'f': '#ffa801', // Gold trim
  'g': '#f5cd79', // Portal gold
  'h': '#f3a683', // Portal sandstone
}

export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  matrix: SpriteMatrix,
  x: number,
  y: number,
  scale = 1,
  colors: Record<string, string> = COLOR_MAP,
) {
  const roundedX = Math.round(x)
  const roundedY = Math.round(y)

  for (let row = 0; row < matrix.length; row++) {
    const line = matrix[row]
    for (let col = 0; col < line.length; col++) {
      const char = line[col]
      const color = colors[char]
      if (color) {
        ctx.fillStyle = color
        ctx.fillRect(roundedX + col * scale, roundedY + row * scale, scale, scale)
      }
    }
  }
}
