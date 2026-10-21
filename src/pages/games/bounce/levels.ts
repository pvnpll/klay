import { TILE, type LevelData } from './types'

function parseLevel(
  id: number,
  name: string,
  asciiMap: string[]
): LevelData {
  const height = asciiMap.length
  const width = Math.max(...asciiMap.map(row => row.length))
  const tiles: number[][] = Array.from({ length: height }, () => Array(width).fill(TILE.EMPTY))
  const rings: { x: number; y: number }[] = []
  let startX = 40
  let startY = 100
  let exitX = (width - 3) * 20
  let exitY = 100

  for (let r = 0; r < height; r++) {
    const rowStr = asciiMap[r]
    for (let c = 0; c < rowStr.length; c++) {
      const ch = rowStr[c]
      switch (ch) {
        case '#':
          tiles[r][c] = TILE.BRICK
          break
        case '=':
          tiles[r][c] = TILE.STONE
          break
        case '^':
          tiles[r][c] = TILE.SPIKE_UP
          break
        case 'v':
          tiles[r][c] = TILE.SPIKE_DOWN
          break
        case '<':
          tiles[r][c] = TILE.SPIKE_LEFT
          break
        case '>':
          tiles[r][c] = TILE.SPIKE_RIGHT
          break
        case 'T':
          tiles[r][c] = TILE.TRAMPOLINE
          break
        case '~':
          tiles[r][c] = TILE.WATER
          break
        case 'B':
          tiles[r][c] = TILE.PUMP_EXPAND
          break
        case 'S':
          tiles[r][c] = TILE.PUMP_DEFLATE
          break
        case 'C':
          tiles[r][c] = TILE.CHECKPOINT
          break
        case 'M':
          tiles[r][c] = TILE.MINE
          break
        case 'E':
          tiles[r][c] = TILE.EXIT
          exitX = c * 20 + 10
          exitY = r * 20 + 10
          break
        case 'P':
          startX = c * 20 + 10
          startY = r * 20 + 10
          tiles[r][c] = TILE.EMPTY
          break
        case 'O':
          rings.push({ x: c * 20 + 10, y: r * 20 + 10 })
          tiles[r][c] = TILE.EMPTY
          break
        default:
          tiles[r][c] = TILE.EMPTY
          break
      }
    }
  }

  return {
    id,
    name,
    width,
    height,
    tiles,
    rings,
    startX,
    startY,
    exitX,
    exitY,
  }
}

// -------------------------------------------------------------
// LEVEL 1: Nokia Bounce Tutorial (Smooth, Navigable, Authentic)
// 44 tiles wide x 8 tiles high
// Features the exact room from the photo (spiked star mine in upper left,
// red ball rolling on floor, floating rings, trampoline hop, open exit)
// -------------------------------------------------------------
const LEVEL_1_ASCII = [
  "############################################",
  "# M             O            O             #",
  "#                                          #",
  "#               ###          ###           #",
  "#                                          #",
  "# P      O            T              O   E #",
  "############################################",
  "============================================",
]

// -------------------------------------------------------------
// LEVEL 2: Spike Canyon (Precision platforming & Trampoline)
// 48 tiles wide x 8 tiles high
// -------------------------------------------------------------
const LEVEL_2_ASCII = [
  "################################################",
  "#              M              O                #",
  "#            #####          #####          M   #",
  "#                                          #   #",
  "#      O               C             O     # E #",
  "# P          ^   ^     T    ^^   ^^        #===#",
  "################################################",
  "================================================",
]

// -------------------------------------------------------------
// LEVEL 3: Aqua Springs & Expander (Water physics & Size pump)
// 50 tiles wide x 8 tiles high
// -------------------------------------------------------------
const LEVEL_3_ASCII = [
  "##################################################",
  "#              O        O        O         S     #",
  "#             ###      ###      ###       ###    #",
  "#                                           #  E #",
  "# P   B       ~~~~~~~~~~~~~~~~~~~~~~~~~~    #====#",
  "##################################################",
  "==================================================",
  "==================================================",
]

// -------------------------------------------------------------
// LEVEL 4: Citadel of Bounce (Master Challenge)
// 52 tiles wide x 8 tiles high
// -------------------------------------------------------------
const LEVEL_4_ASCII = [
  "####################################################",
  "#         O                 M             O        #",
  "#       #####                             #        #",
  "#                 T        #####          #  C   E #",
  "#   T           #####                     #======###",
  "# P       O             ^^     O     O    ##########",
  "####################################################",
  "====================================================",
]

export const LEVELS: LevelData[] = [
  parseLevel(1, "Level 1: Classic Room", LEVEL_1_ASCII),
  parseLevel(2, "Level 2: Spike Canyon", LEVEL_2_ASCII),
  parseLevel(3, "Level 3: Aqua Springs", LEVEL_3_ASCII),
  parseLevel(4, "Level 4: Citadel of Bounce", LEVEL_4_ASCII),
]
