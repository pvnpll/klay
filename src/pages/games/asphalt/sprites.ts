export type SpriteMatrix = string[]

// Player Red Supercar (16x26 px)
export const SPRITE_PLAYER_CAR: SpriteMatrix = [
  '.....111111.....',
  '....12222221....',
  '...1223333221...',
  '...1233333321...',
  '..112333333211..',
  '..122333333221..',
  '..122222222221..',
  '..124444444421..',
  '..124444444421..',
  '..124444444421..',
  '..122222222221..',
  '..122222222221..',
  '..122222222221..',
  '..122222222221..',
  '..124444444421..',
  '..124444444421..',
  '..122222222221..',
  '..122222222221..',
  '..112222222211..',
  '...1222222221...',
  '...1552222551...',
  '...1551111551...',
  '....11....11....',
]

// Civilian Sedan (16x24 px)
export const SPRITE_SEDAN: SpriteMatrix = [
  '.....111111.....',
  '....16666661....',
  '...1666666661...',
  '..116644446611..',
  '..166444444661..',
  '..166444444661..',
  '..166666666661..',
  '..166444444661..',
  '..166444444661..',
  '..166666666661..',
  '..166666666661..',
  '..166666666661..',
  '..166444444661..',
  '..166666666661..',
  '..116666666611..',
  '...1556666551...',
  '....11....11....',
]

// Yellow Taxi (16x24 px)
export const SPRITE_TAXI: SpriteMatrix = [
  '.....111111.....',
  '....17777771....',
  '...1777777771...',
  '..117744447711..',
  '..177444444771..',
  '..177444444771..',
  '..177788887771..', // Taxi roof sign
  '..177444444771..',
  '..177444444771..',
  '..177777777771..',
  '..177777777771..',
  '..177444444771..',
  '..177777777771..',
  '..117777777711..',
  '...1557777551...',
  '....11....11....',
]

// Police Cruiser (16x25 px)
export const SPRITE_POLICE: SpriteMatrix = [
  '.....111111.....',
  '....19999991....',
  '...1999999991...',
  '..119944449911..',
  '..199444444991..',
  '..199444444991..',
  '..199222333991..', // Red & Blue siren lightbar
  '..199444444991..',
  '..199444444991..',
  '..199999999991..',
  '..199999999991..',
  '..199444444991..',
  '..199999999991..',
  '..119999999911..',
  '...1559999551...',
  '....11....11....',
]

// Cargo Truck (18x32 px)
export const SPRITE_TRUCK: SpriteMatrix = [
  '....1111111111....',
  '...1aaaaaaaaaa1...',
  '..11aaaaaaaaaa11..',
  '..1aaaa4444aaaa1..',
  '..1aaaa4444aaaa1..',
  '..11aaaaaaaaaa11..',
  '..11bbbbbbbbbb11..',
  '..1bbbbbbbbbbbb1..',
  '..1bbbbbbbbbbbb1..',
  '..1bbbbbbbbbbbb1..',
  '..1bbbbbbbbbbbb1..',
  '..1bbbbbbbbbbbb1..',
  '..1bbbbbbbbbbbb1..',
  '..11bbbbbbbbbb11..',
  '..1bbbbbbbbbbbb1..',
  '..1bbbbbbbbbbbb1..',
  '..11bbbbbbbbbb11..',
  '...155bbbbbb551...',
  '....1111111111....',
]

// Nitro Bottle Pickup (10x12 px)
export const SPRITE_NITRO_BOTTLE: SpriteMatrix = [
  '...1111...',
  '...1331...',
  '..133331..',
  '.13322331.',
  '.13322331.',
  '.13333331.',
  '.13333331.',
  '..111111..',
]

// Cash Pickup ($ 10x10 px)
export const SPRITE_CASH: SpriteMatrix = [
  '..111111..',
  '.17777771.',
  '177.77.771',
  '1777777771',
  '177.77.771',
  '.17777771.',
  '..111111..',
]

const COLOR_MAP: Record<string, string> = {
  '1': '#11141a', // Tire / outline black
  '2': '#ff4757', // Player supercar Red
  '3': '#2ed573', // Headlights / nitro green
  '4': '#2f3542', // Tinted dark glass
  '5': '#ff6b81', // Taillights
  '6': '#1e90ff', // Sedan blue
  '7': '#ffa502', // Taxi yellow
  '8': '#ffffff', // Taxi white sign
  '9': '#ffffff', // Police white
  'a': '#2ed573', // Truck cab green
  'b': '#747d8c', // Truck silver trailer
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
