// Game time excludes help/pause dialogs and time spent in background tabs.
let pausedAt: number | null = null
let pauseTotal = 0
let nextId = 1
const frames = new Map<number, number>()
const timers = new Map<number, number>()
export const isGamePaused = () => pausedAt !== null
export const gameNow = () => (pausedAt ?? performance.now()) - pauseTotal
export function setGamePaused(paused: boolean) {
  if (paused && pausedAt === null) pausedAt = performance.now()
  else if (!paused && pausedAt !== null) { pauseTotal += performance.now() - pausedAt; pausedAt = null }
}
export function gameRaf(callback: FrameRequestCallback): number {
  const id = nextId++
  const tick = () => {
    if (isGamePaused()) { frames.set(id, window.requestAnimationFrame(tick)); return }
    frames.delete(id); callback(gameNow())
  }
  frames.set(id, window.requestAnimationFrame(tick)); return id
}
export function cancelGameRaf(id: number) { const frame = frames.get(id); if (frame !== undefined) window.cancelAnimationFrame(frame); frames.delete(id) }
function schedule(callback: () => void, delay: number, repeat: boolean): number {
  const id = nextId++, duration = Math.max(1, delay), due = gameNow() + duration
  let next = due
  const timer = window.setInterval(() => {
    if (isGamePaused() || gameNow() < next) return
    if (!repeat) clearGameTimer(id)
    else next = gameNow() + duration
    callback()
  }, Math.min(duration, 16))
  timers.set(id, timer); return id
}
export const gameTimeout = (callback: () => void, delay = 0) => schedule(callback, delay, false)
export const gameInterval = (callback: () => void, delay = 0) => schedule(callback, delay, true)
export function clearGameTimer(id: number | undefined | null) { if (id == null) return; const timer = timers.get(id); if (timer !== undefined) window.clearInterval(timer); timers.delete(id) }
