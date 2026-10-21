export type SpriteMatrix = string[]

// Red Heart (10x9 px)
export const SPRITE_HEART: SpriteMatrix = [
  '.11...11.',
  '1111.1111',
  '111111111',
  '111111111',
  '.1111111.',
  '..11111..',
  '...111...',
  '....1....',
]

// Gold Star (9x9 px)
export const SPRITE_STAR: SpriteMatrix = [
  '....2....',
  '...222...',
  '..22222..',
  '222222222',
  '.2222222.',
  '..22222..',
  '.222.222.',
  '22.....22',
]

const COLOR_MAP: Record<string, string> = {
  '1': '#ff4757', // Heart red
  '2': '#ffa502', // Gold star
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

/**
 * Draws the iconic shaded Rapid Roll Ball with rotation and highlight
 */
export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  isGodMode: boolean,
) {
  ctx.save()
  ctx.translate(Math.round(x), Math.round(y))

  // Ball Body Gradient
  const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius)
  if (isGodMode) {
    grad.addColorStop(0, '#fff')
    grad.addColorStop(0.3, '#f1c40f')
    grad.addColorStop(0.8, '#e67e22')
    grad.addColorStop(1, '#d35400')
  } else {
    // Iconic Royal Blue / Cyan Ball
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.2, '#70a1ff')
    grad.addColorStop(0.7, '#1e90ff')
    grad.addColorStop(1, '#094592')
  }

  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  // Outline
  ctx.strokeStyle = isGodMode ? '#f39c12' : '#07326e'
  ctx.lineWidth = 1.2
  ctx.stroke()

  // Rotating seam / pattern to visualize roll
  ctx.rotate(rotation)
  ctx.strokeStyle = isGodMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 0.8)
  ctx.stroke()

  ctx.restore()
}
