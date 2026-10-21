import type { LevelData } from './types'

export const TILE_SIZE = 16

/**
 * Parses ASCII tile map into number[][] matrix
 * '.' = 0: empty air
 * '#' = 1: solid stone block / floor
 * '|' = 2: solid stone wall
 * 'C' = 3: background column
 * 'A' = 4: mosaic arch
 * 'S' = 5: spike floor
 * 'W' = 6: water spout
 * 'G' = 7: exit gate
 */
function parseMap(ascii: string[]): number[][] {
  return ascii.map(row =>
    row.split('').map(char => {
      switch (char) {
        case '#':
          return 1
        case '|':
          return 2
        case 'C':
          return 3
        case 'A':
          return 4
        case 'S':
          return 5
        case 'W':
          return 6
        case 'G':
          return 7
        default:
          return 0
      }
    }),
  )
}

// -----------------------------------------------------------------
// LEVEL 1: The Royal Ramparts & Palace Courtyard
// -----------------------------------------------------------------
const LEVEL_1_MAP = [
  '................................................................',
  '..A.................A...................A...................A...',
  '..|.................|...................|...................|...',
  '..|.................|...................|...................|...',
  '..|..C...........C..|..C.............C..|..C.............C..|...',
  '..|..C...........C..|..C.............C..|..C.............C..|...',
  '..|..C...........C..|..C.............C..|..C.............C..|...',
  '..|#################|..###############..|..###############..|...',
  '..|.................|...................|...................|...',
  '..|.................|...................|........#######...|...',
  '..|...................######............|...................|..G',
  '..|.......#####...............######....|...................|..G',
  '..|.....................................|...................|..G',
  '..|.....................................|...................|..G',
  '..|###################SSSSS##############SSSSS##############|###',
  '..|#########################################################|###',
]

// -----------------------------------------------------------------
// LEVEL 2: The Water Gardens of Babylon (Water Freezing)
// -----------------------------------------------------------------
const LEVEL_2_MAP = [
  '................................................................',
  '..A...................A...................A.................A...',
  '..|...................|...................|.................|...',
  '..|.....W.............|......W............|......W..........|...',
  '..|..C..W..........C..|..C...W.........C..|..C...W.......C..|...',
  '..|..C..W..........C..|..C...W.........C..|..C...W.......C..|...',
  '..|..C..W..........C..|..C...W.........C..|..C...W.......C..|...',
  '..|#####W#############|..####W##########..|..####W#######...|...',
  '..|.....W.............|......W............|......W..........|...',
  '..|.....W.............|......W............|......W..#####...|...',
  '..|.....W......#####..|......W....#####...|......W..........|..G',
  '..|.....W.............|......W............|......W..........|..G',
  '..|.....W.............|......W............|......W..........|..G',
  '..|.....W.............|......W............|......W..........|..G',
  '..|#####W#############SSSSS##W###########SSSSS###W##########|###',
  '..|#########################################################|###',
]

// -----------------------------------------------------------------
// LEVEL 3: The Forgotten Tomb of Malik (The Final Escape)
// -----------------------------------------------------------------
const LEVEL_3_MAP = [
  '................................................................',
  '..A...................A...................A.................A...',
  '..|...................|...................|.................|...',
  '..|...................|...................|.................|...',
  '..|..C...........C....|..C.............C..|..C...........C..|...',
  '..|..C...........C....|..C.............C..|..C...........C..|...',
  '..|..C...........C....|..C.............C..|..C...........C..|...',
  '..|#######..##########|..#######...#####..|..####...#####...|...',
  '..|...................|...................|.................|...',
  '..|...................|.........#####.....|.......#######...|...',
  '..|.......####........|...................|.................|..G',
  '..|..............###..|.....####..........|.....#####.......|..G',
  '..|...................|...................|.................|..G',
  '..|...................|...................|.................|..G',
  '..|#######SSSSS#######SSSSS###############SSSSS#############|###',
  '..|#########################################################|###',
]

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: 'Sector I: Royal Ramparts',
    subtitle: 'The Palace of Azad under siege',
    width: 64,
    height: 16,
    map: parseMap(LEVEL_1_MAP),
    playerStart: { x: 3 * TILE_SIZE, y: 12 * TILE_SIZE },
    exitGate: { x: 59 * TILE_SIZE, y: 10 * TILE_SIZE, width: 24, height: 48 },
    enemies: [
      {
        type: 'warrior',
        x: 18 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        vx: 30,
        vy: 0,
        width: 18,
        height: 22,
        facing: 'left',
        hp: 3,
        maxHp: 3,
        patrolLeft: 14 * TILE_SIZE,
        patrolRight: 20 * TILE_SIZE,
        attackCooldown: 1.5,
        scoreValue: 100,
      },
      {
        type: 'warrior',
        x: 32 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        vx: 30,
        vy: 0,
        width: 18,
        height: 22,
        facing: 'left',
        hp: 3,
        maxHp: 3,
        patrolLeft: 28 * TILE_SIZE,
        patrolRight: 36 * TILE_SIZE,
        attackCooldown: 1.5,
        scoreValue: 100,
      },
      {
        type: 'warrior',
        x: 48 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        vx: 35,
        vy: 0,
        width: 18,
        height: 22,
        facing: 'left',
        hp: 4,
        maxHp: 4,
        patrolLeft: 44 * TILE_SIZE,
        patrolRight: 54 * TILE_SIZE,
        attackCooldown: 1.2,
        scoreValue: 150,
      },
    ],
    pots: [
      { x: 12 * TILE_SIZE, y: 13 * TILE_SIZE, drop: 'sand' },
      { x: 26 * TILE_SIZE, y: 13 * TILE_SIZE, drop: 'health' },
      { x: 42 * TILE_SIZE, y: 13 * TILE_SIZE, drop: 'sand' },
    ],
    traps: [
      { type: 'spikes', x: 21 * TILE_SIZE, y: 14 * TILE_SIZE, width: 5 * TILE_SIZE, height: 16 },
      { type: 'spikes', x: 41 * TILE_SIZE, y: 14 * TILE_SIZE, width: 5 * TILE_SIZE, height: 16 },
      {
        type: 'saw',
        x: 30 * TILE_SIZE,
        y: 6 * TILE_SIZE,
        width: 16,
        height: 16,
        startX: 26 * TILE_SIZE,
        endX: 35 * TILE_SIZE,
        speed: 40,
      },
    ],
    waterSpouts: [],
  },

  {
    id: 2,
    name: 'Sector II: Water Gardens',
    subtitle: 'Harness the Elemental Power of Ice',
    width: 64,
    height: 16,
    map: parseMap(LEVEL_2_MAP),
    playerStart: { x: 3 * TILE_SIZE, y: 12 * TILE_SIZE },
    exitGate: { x: 59 * TILE_SIZE, y: 10 * TILE_SIZE, width: 24, height: 48 },
    enemies: [
      {
        type: 'warrior',
        x: 15 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        vx: 30,
        vy: 0,
        width: 18,
        height: 22,
        facing: 'left',
        hp: 3,
        maxHp: 3,
        patrolLeft: 12 * TILE_SIZE,
        patrolRight: 18 * TILE_SIZE,
        attackCooldown: 1.4,
        scoreValue: 120,
      },
      {
        type: 'brute',
        x: 36 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        vx: 20,
        vy: 0,
        width: 24,
        height: 26,
        facing: 'left',
        hp: 6,
        maxHp: 6,
        patrolLeft: 32 * TILE_SIZE,
        patrolRight: 40 * TILE_SIZE,
        attackCooldown: 1.8,
        scoreValue: 300,
      },
      {
        type: 'warrior',
        x: 50 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        vx: 35,
        vy: 0,
        width: 18,
        height: 22,
        facing: 'left',
        hp: 4,
        maxHp: 4,
        patrolLeft: 46 * TILE_SIZE,
        patrolRight: 55 * TILE_SIZE,
        attackCooldown: 1.2,
        scoreValue: 150,
      },
    ],
    pots: [
      { x: 10 * TILE_SIZE, y: 13 * TILE_SIZE, drop: 'sand' },
      { x: 28 * TILE_SIZE, y: 13 * TILE_SIZE, drop: 'health' },
      { x: 44 * TILE_SIZE, y: 13 * TILE_SIZE, drop: 'sand' },
    ],
    traps: [
      { type: 'spikes', x: 21 * TILE_SIZE, y: 14 * TILE_SIZE, width: 5 * TILE_SIZE, height: 16 },
      { type: 'spikes', x: 41 * TILE_SIZE, y: 14 * TILE_SIZE, width: 5 * TILE_SIZE, height: 16 },
      {
        type: 'saw',
        x: 16 * TILE_SIZE,
        y: 6 * TILE_SIZE,
        width: 16,
        height: 16,
        startX: 12 * TILE_SIZE,
        endX: 20 * TILE_SIZE,
        speed: 50,
      },
    ],
    waterSpouts: [
      { x: 8 * TILE_SIZE, y: 3 * TILE_SIZE, width: 8, height: 11 * TILE_SIZE },
      { x: 24 * TILE_SIZE, y: 3 * TILE_SIZE, width: 8, height: 11 * TILE_SIZE },
      { x: 43 * TILE_SIZE, y: 3 * TILE_SIZE, width: 8, height: 11 * TILE_SIZE },
    ],
  },

  {
    id: 3,
    name: 'Sector III: The Forgotten Tomb',
    subtitle: 'The Final Stand at Malik’s Vault',
    width: 64,
    height: 16,
    map: parseMap(LEVEL_3_MAP),
    playerStart: { x: 3 * TILE_SIZE, y: 12 * TILE_SIZE },
    exitGate: { x: 59 * TILE_SIZE, y: 10 * TILE_SIZE, width: 24, height: 48 },
    enemies: [
      {
        type: 'captain',
        x: 20 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        vx: 40,
        vy: 0,
        width: 20,
        height: 24,
        facing: 'left',
        hp: 6,
        maxHp: 6,
        patrolLeft: 16 * TILE_SIZE,
        patrolRight: 24 * TILE_SIZE,
        attackCooldown: 1.0,
        scoreValue: 250,
      },
      {
        type: 'brute',
        x: 35 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        vx: 25,
        vy: 0,
        width: 24,
        height: 26,
        facing: 'left',
        hp: 8,
        maxHp: 8,
        patrolLeft: 30 * TILE_SIZE,
        patrolRight: 42 * TILE_SIZE,
        attackCooldown: 1.5,
        scoreValue: 400,
      },
      {
        type: 'captain',
        x: 50 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        vx: 45,
        vy: 0,
        width: 20,
        height: 24,
        facing: 'left',
        hp: 7,
        maxHp: 7,
        patrolLeft: 46 * TILE_SIZE,
        patrolRight: 56 * TILE_SIZE,
        attackCooldown: 0.9,
        scoreValue: 300,
      },
    ],
    pots: [
      { x: 8 * TILE_SIZE, y: 13 * TILE_SIZE, drop: 'sand' },
      { x: 26 * TILE_SIZE, y: 13 * TILE_SIZE, drop: 'sand' },
      { x: 45 * TILE_SIZE, y: 13 * TILE_SIZE, drop: 'health' },
    ],
    traps: [
      { type: 'spikes', x: 9 * TILE_SIZE, y: 14 * TILE_SIZE, width: 5 * TILE_SIZE, height: 16 },
      { type: 'spikes', x: 21 * TILE_SIZE, y: 14 * TILE_SIZE, width: 5 * TILE_SIZE, height: 16 },
      { type: 'spikes', x: 41 * TILE_SIZE, y: 14 * TILE_SIZE, width: 5 * TILE_SIZE, height: 16 },
      {
        type: 'saw',
        x: 22 * TILE_SIZE,
        y: 6 * TILE_SIZE,
        width: 16,
        height: 16,
        startX: 16 * TILE_SIZE,
        endX: 28 * TILE_SIZE,
        speed: 60,
      },
      {
        type: 'saw',
        x: 46 * TILE_SIZE,
        y: 6 * TILE_SIZE,
        width: 16,
        height: 16,
        startX: 40 * TILE_SIZE,
        endX: 52 * TILE_SIZE,
        speed: 65,
      },
    ],
    waterSpouts: [],
  },
]
