import type { LevelMap, TileType } from './types'

export const TILE_SIZE = 16

function parseAsciiMap(ascii: string[]): TileType[][] {
  return ascii.map(row =>
    row.split('').map(char => {
      switch (char) {
        case '#':
          return 'wall'
        case '.':
          return 'dirt'
        case 'O':
          return 'boulder'
        case 'r':
          return 'ruby'
        case 'D':
          return 'diamond'
        case 'S':
          return 'snake'
        case 'E':
          return 'exit'
        case 'C':
          return 'chest'
        default:
          return 'empty'
      }
    }),
  )
}

// Level 1: Angkor Wat Temple - The Golden Threshold
const LEVEL_1_ASCII = [
  '################',
  '#P....O...r....#',
  '#.###.O.######.#',
  '#...#.O....D...#',
  '#.#.##########.#',
  '#.O.....r......#',
  '#.O.##########.#',
  '#...#....O...D.#',
  '#####.##.O.#####',
  '#r....#..O.....#',
  '#.###.#.######.#',
  '#...D.#.S....E.#',
  '#C....#.S......#',
  '################',
]

// Level 2: Bavarian Castle Crypt
const LEVEL_2_ASCII = [
  '################',
  '#P.O....D....O.#',
  '#..O.#######.O.#',
  '#..O.#.....#.O.#',
  '#r...#.O.O.#...#',
  '####.#.D.D.#.###',
  '#....#.O.O.#...#',
  '#.##.#######.##.#',
  '#..S.........S.#',
  '#.##############',
  '#....r....D....#',
  '#.######.#####.#',
  '#...C........E.#',
  '################',
]

export const LEVELS: LevelMap[] = [
  {
    name: 'Angkor Wat: Antechamber',
    width: 16,
    height: 14,
    diamondsRequired: 3,
    tiles: parseAsciiMap(LEVEL_1_ASCII),
    playerStart: { x: 1, y: 1 },
  },
  {
    name: 'Bavaria: Castle Crypt',
    width: 16,
    height: 14,
    diamondsRequired: 4,
    tiles: parseAsciiMap(LEVEL_2_ASCII),
    playerStart: { x: 1, y: 1 },
  },
]
