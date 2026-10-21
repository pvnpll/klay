import type { LevelConfig } from './types'

export const LEVELS: LevelConfig[] = [
  // LEVEL 1: Deep Space Sector (Original Space Impact Level 1)
  {
    id: 1,
    name: 'Sector 1: Deep Space',
    duration: 38, // 38 seconds of waves before Megacrab Boss
    bossType: 'boss1',
    spawns: [
      // Wave 1: Sine scout drones (y: 60 to 180)
      { time: 1.5, type: 'scout', y: 60 },
      { time: 2.2, type: 'scout', y: 90 },
      { time: 2.9, type: 'scout', y: 120 },
      { time: 4.5, type: 'scout', y: 160 },
      { time: 5.2, type: 'scout', y: 130 },

      // Wave 2: Power-up Cargo Drone
      { time: 7.0, type: 'cargo', y: 80 },

      // Wave 3: Diver bug squad
      { time: 9.0, type: 'diver', y: 50 },
      { time: 10.5, type: 'diver', y: 180 },
      { time: 12.0, type: 'diver', y: 110 },

      // Wave 4: Space Mines
      { time: 14.0, type: 'mine', y: 70 },
      { time: 15.0, type: 'mine', y: 150 },

      // Wave 5: Alien Cruiser (shoots plasma)
      { time: 17.5, type: 'cruiser', y: 100 },

      // Wave 6: Scouts + Cargo
      { time: 21.0, type: 'scout', y: 50 },
      { time: 21.8, type: 'scout', y: 80 },
      { time: 23.0, type: 'cargo', y: 140 },

      // Wave 7: Divers & Cruiser combo
      { time: 25.5, type: 'diver', y: 70 },
      { time: 26.5, type: 'cruiser', y: 160 },
      { time: 28.0, type: 'diver', y: 130 },

      // Wave 8: Heavy Minefield + Cargo
      { time: 30.5, type: 'mine', y: 90 },
      { time: 31.5, type: 'mine', y: 170 },
      { time: 33.0, type: 'cargo', y: 110 },
      { time: 34.5, type: 'scout', y: 60 },
      { time: 35.5, type: 'scout', y: 180 },
    ],
  },

  // LEVEL 2: Asteroid Cavern (Mecha-Skull Boss)
  {
    id: 2,
    name: 'Sector 2: Asteroid Cavern',
    duration: 44,
    bossType: 'boss2',
    spawns: [
      { time: 1.5, type: 'mine', y: 60 },
      { time: 2.2, type: 'mine', y: 120 },
      { time: 3.5, type: 'worm', y: 90 },

      { time: 6.0, type: 'cargo', y: 70 },
      { time: 8.0, type: 'diver', y: 150 },
      { time: 8.8, type: 'diver', y: 60 },

      { time: 11.0, type: 'cruiser', y: 80 },
      { time: 13.0, type: 'cruiser', y: 160 },

      { time: 16.5, type: 'worm', y: 140 },
      { time: 18.0, type: 'cargo', y: 100 },

      { time: 21.0, type: 'scout', y: 50 },
      { time: 21.6, type: 'scout', y: 80 },
      { time: 22.2, type: 'scout', y: 110 },
      { time: 24.0, type: 'mine', y: 180 },

      { time: 27.0, type: 'cruiser', y: 120 },
      { time: 29.0, type: 'diver', y: 70 },
      { time: 29.8, type: 'diver', y: 170 },

      { time: 32.5, type: 'cargo', y: 90 },
      { time: 34.0, type: 'worm', y: 80 },
      { time: 36.5, type: 'cruiser', y: 150 },
      { time: 38.0, type: 'mine', y: 100 },
      { time: 40.0, type: 'diver', y: 130 },
    ],
  },

  // LEVEL 3: The Alien Hive (Queen Core Final Boss)
  {
    id: 3,
    name: 'Sector 3: The Hive Core',
    duration: 48,
    bossType: 'boss3',
    spawns: [
      { time: 1.5, type: 'scout', y: 70 },
      { time: 2.0, type: 'scout', y: 150 },
      { time: 3.5, type: 'diver', y: 100 },
      { time: 5.0, type: 'cruiser', y: 80 },

      { time: 8.0, type: 'cargo', y: 130 },
      { time: 10.0, type: 'worm', y: 60 },
      { time: 12.5, type: 'cruiser', y: 170 },

      { time: 15.0, type: 'mine', y: 90 },
      { time: 16.0, type: 'mine', y: 130 },
      { time: 17.5, type: 'diver', y: 60 },
      { time: 18.5, type: 'diver', y: 180 },

      { time: 21.0, type: 'cargo', y: 100 },
      { time: 23.0, type: 'worm', y: 150 },
      { time: 25.0, type: 'cruiser', y: 70 },
      { time: 26.5, type: 'cruiser', y: 160 },

      { time: 30.0, type: 'scout', y: 80 },
      { time: 30.8, type: 'scout', y: 120 },
      { time: 31.6, type: 'scout', y: 160 },
      { time: 33.5, type: 'cargo', y: 80 },

      { time: 36.0, type: 'diver', y: 100 },
      { time: 37.0, type: 'mine', y: 70 },
      { time: 38.0, type: 'mine', y: 170 },
      { time: 41.0, type: 'cruiser', y: 110 },
      { time: 43.0, type: 'worm', y: 120 },
    ],
  },
]
