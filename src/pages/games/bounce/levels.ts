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
  let startY = 160
  let exitX = (width - 3) * 20
  let exitY = 160

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
// LEVEL 1: Green Meadow (Classic Introduction)
// 38 tiles wide, 14 tiles high
// -------------------------------------------------------------
const LEVEL_1_ASCII = [
  "======================================",
  "=                                    =",
  "=                                    =",
  "=        O                  O        =",
  "=       ###                ###       =",
  "=                                    =",
  "=             O        O             =",
  "=            ###      ###            =",
  "=  P                               E =",
  "= ###        ###      ###         ====",
  "=#####      #####    #####       =====",
  "=######    #######  #######     ======",
  "=################################=====",
  "======================================"
]

// -------------------------------------------------------------
// LEVEL 2: Spike Canyon (Precision platforming & Trampoline)
// 42 tiles wide, 14 tiles high
// -------------------------------------------------------------
const LEVEL_2_ASCII = [
  "==========================================",
  "=                                        =",
  "=               O               O        =",
  "=             #####           #####      =",
  "=                                    O   =",
  "=       O           C        O      ===  =",
  "=     #####       #####    #####    ===E =",
  "=                                   ======",
  "=  P                 T              ======",
  "= ###     ^    ^   #####   ^^   ^^  ======",
  "=#####   ###  ###  #####  #### #### ======",
  "=######  ###  ###  #####  #### #### ======",
  "=#########################################",
  "=========================================="
]

// -------------------------------------------------------------
// LEVEL 3: Aqua Springs & Expander (Water physics & Size pump)
// 48 tiles wide, 14 tiles high
// -------------------------------------------------------------
const LEVEL_3_ASCII = [
  "================================================",
  "=                                              =",
  "=                                              =",
  "=               O       O       O              =",
  "=              ###     ###     ###       S     =",
  "=                                       ###    =",
  "=                                         #    =",
  "=  P                                      #  E =",
  "= ###   B      ~~~~~~~~~~~~~~~~           #====",
  "=####  ###     ~~~~~~~~~~~~~~~~           #=====",
  "=##### ####    ~~~~~~~~~~~~~~~~    ^   ^  #=====",
  "=##############################   ### ### ======",
  "=###############################################",
  "================================================"
]

// -------------------------------------------------------------
// LEVEL 4: Citadel of Bounce (Master Challenge)
// 50 tiles wide, 14 tiles high
// -------------------------------------------------------------
const LEVEL_4_ASCII = [
  "==================================================",
  "=                       O                 O      =",
  "=       O             #####             #####    =",
  "=     #####   vvv              T                 =",
  "=             ###            #####               =",
  "=                     O                 C      E =",
  "=    T              #####             #####   ====",
  "=  #####                                    ======",
  "=         O                 O       O      =======",
  "=  P    #####     ^   ^   #####   #####   ========",
  "= ###            ### ###  #####   #####  =========",
  "=####   ^^^^^    ### ###  #####   ##### ==========",
  "=################################################=",
  "=================================================="
]

export const LEVELS: LevelData[] = [
  parseLevel(1, "Level 1: Green Meadow", LEVEL_1_ASCII),
  parseLevel(2, "Level 2: Spike Canyon", LEVEL_2_ASCII),
  parseLevel(3, "Level 3: Aqua Springs", LEVEL_3_ASCII),
  parseLevel(4, "Level 4: Citadel of Bounce", LEVEL_4_ASCII),
]
