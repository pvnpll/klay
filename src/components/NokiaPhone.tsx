import { type ReactNode, useState, useRef } from 'react'

// Shared persistent audio context for instant, reliable keypad beeps
let sharedAudioCtx: AudioContext | null = null

function playDefaultKeyBeep() {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      sharedAudioCtx = new AudioCtx()
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume()
    }
    const ctx = sharedAudioCtx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1100, now)
    gain.gain.setValueAtTime(0.04, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.035)
  } catch {
    // Ignore audio initialization errors
  }
}

export interface NokiaPhoneProps {
  children: ReactNode // The LCD screen content (canvas)
  screenBg?: string // Background color of the LCD cutout (defaults to blue for Bounce or green-olive for Space Impact)
  onLeftSoft?: () => void
  onRightSoft?: () => void
  onDirectionPress?: (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => void
  onActionPress?: (pressed: boolean) => void
  onKeypadPress?: (key: string) => void
  onEndPress?: () => void
  onKeySound?: () => void
  cheatActive?: boolean
}

export function NokiaPhone({
  children,
  screenBg = '#004ecc',
  onLeftSoft,
  onRightSoft,
  onDirectionPress,
  onActionPress,
  onKeypadPress,
  onEndPress,
  onKeySound,
}: NokiaPhoneProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const activePointersRef = useRef<Map<number, string>>(new Map())

  const playClick = () => {
    if (onKeySound) {
      onKeySound()
    } else {
      playDefaultKeyBeep()
    }
  }

  // --- Resilient Pointer Capture Binding for Directions (Rocker & D-Pad) ---
  const bindDirection = (dir: 'left' | 'right' | 'up' | 'down', keyId: string) => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, keyId)
        } catch {
          // ignore if unsupported
        }
        setActiveKey(keyId)
        playClick()
        onDirectionPress?.(dir, true)
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {
          // ignore
        }
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {
          // ignore
        }
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        // If pointer is captured, do NOT cancel the hold on slight thumb movement!
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            return
          }
        } catch {
          // ignore
        }
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // --- Resilient Pointer Capture for Keypad Direction Keys (Keys 2, 4, 6, 8) ---
  const bindKeypadDirection = (key: string, dir: 'left' | 'right' | 'up' | 'down') => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, key)
        } catch {}
        setActiveKey(key)
        playClick()
        onKeypadPress?.(key)
        onDirectionPress?.(dir, true)
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            return
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // --- Resilient Pointer Capture for Action Keys (Key 5, Rocker Center OK) ---
  const bindAction = (keyId: string) => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, keyId)
        } catch {}
        setActiveKey(keyId)
        playClick()
        if (keyId === '5') onKeypadPress?.('5')
        onActionPress?.(true)
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onActionPress?.(false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onActionPress?.(false)
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            return
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onActionPress?.(false)
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // --- Resilient Pointer Capture for Regular Keypad Keys (Keys 1, 3, 7, 9, *, 0, #) ---
  const bindKeypadRegular = (key: string) => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, key)
        } catch {}
        setActiveKey(key)
        playClick()
        onKeypadPress?.(key)
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            return
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // --- Navi-Bar Button (Cyan dash) ---
  const bindNavi = () => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, 'navi')
        } catch {}
        setActiveKey('navi')
        playClick()
        if (onActionPress) {
          onActionPress(true)
        } else if (onLeftSoft) {
          onLeftSoft()
        }
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onActionPress?.(false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onActionPress?.(false)
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            return
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
        onActionPress?.(false)
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // --- Clear Button ('C' / Back) ---
  const bindClear = () => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, 'clear')
        } catch {}
        setActiveKey('clear')
        playClick()
        onRightSoft?.()
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // --- Red Power / End Button (⏻) ---
  const bindEnd = () => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, 'end')
        } catch {}
        setActiveKey('end')
        playClick()
        onEndPress?.()
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        setActiveKey(null)
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  return (
    <div
      className="relative mx-auto select-none font-sans drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)] touch-none"
      style={{
        width: '100%',
        maxWidth: 350,
        aspectRatio: '438 / 870',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* 
        1. THE LCD SCREEN VIEWPORT (Canvas sits right in the screen cutout)
        Cutout coordinates in the 438x870 Nokia 3510i photo:
        left: 19.63%, top: 24.37%, width: 60.73%, height: 29.08%
      */}
      <div
        className="absolute z-10 overflow-hidden"
        style={{
          left: '19.63%',
          top: '24.37%',
          width: '60.73%',
          height: '29.08%',
          backgroundColor: screenBg,
          touchAction: 'none',
        }}
      >
        {children}
      </div>

      {/* 
        2. THE REAL PHYSICAL NOKIA 3510i HANDSET (Exact photo from user)
        The screen area is punched transparent so the canvas shines through!
      */}
      <img
        src="/nokia-3510i-frame.png"
        alt="Nokia 3510i Handset"
        draggable={false}
        className="absolute inset-0 z-20 w-full h-full pointer-events-none select-none object-contain"
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      />

      {/* 
        3. TACTILE INTERACTIVE HITBOXES ON THE REAL PHONE BUTTONS
        All buttons are mapped to their photographic locations with generous touch targets,
        pointer capture, and authentic backlit illumination feedback!
      */}
      <div className="absolute inset-0 z-30 pointer-events-none touch-none">
        
        {/* Top Navi-Bar Button (Cyan dash) */}
        <button
          type="button"
          {...bindNavi()}
          className={`absolute rounded-full pointer-events-auto transition-colors ${
            activeKey === 'navi'
              ? 'bg-cyan-400/40 ring-2 ring-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.7)]'
              : 'active:bg-cyan-400/20'
          }`}
          style={{
            top: '56.0%',
            left: '32.0%',
            width: '36.0%',
            height: '6.2%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Navi-Key (Select / Action)"
          title="Navi-Key"
        />

        {/* Clear Button: 'C' */}
        <button
          type="button"
          {...bindClear()}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === 'clear'
              ? 'bg-white/35 ring-2 ring-white/60 shadow-[0_0_15px_rgba(255,255,255,0.7)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '61.5%',
            left: '10.0%',
            width: '21.0%',
            height: '8.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="C / Clear"
          title="C (Clear / Back)"
        />

        {/* Red Power / End Button: ⏻ */}
        <button
          type="button"
          {...bindEnd()}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === 'end'
              ? 'bg-red-500/50 ring-2 ring-red-400 shadow-[0_0_18px_rgba(239,68,68,0.8)]'
              : 'active:bg-red-500/30'
          }`}
          style={{
            top: '61.5%',
            left: '69.0%',
            width: '21.0%',
            height: '8.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Power / End / Pause"
          title="Power / End"
        />

        {/* 4-Way Rocker D-Pad: Up (Jump / Fly Up) */}
        <button
          type="button"
          {...bindDirection('up', 'rocker-up')}
          className={`absolute rounded-t-xl pointer-events-auto transition-colors ${
            activeKey === 'rocker-up'
              ? 'bg-amber-300/40 ring-1 ring-amber-300 shadow-[0_0_12px_rgba(253,224,71,0.7)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '59.5%',
            left: '36.0%',
            width: '28.0%',
            height: '6.0%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Rocker Up"
        />

        {/* 4-Way Rocker D-Pad: Left */}
        <button
          type="button"
          {...bindDirection('left', 'rocker-left')}
          className={`absolute rounded-l-xl pointer-events-auto transition-colors ${
            activeKey === 'rocker-left'
              ? 'bg-amber-300/40 ring-1 ring-amber-300 shadow-[0_0_12px_rgba(253,224,71,0.7)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '63.0%',
            left: '28.0%',
            width: '14.5%',
            height: '8.0%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Rocker Left"
        />

        {/* 4-Way Rocker D-Pad: Center OK */}
        <button
          type="button"
          {...bindAction('rocker-ok')}
          className={`absolute rounded-full pointer-events-auto transition-colors ${
            activeKey === 'rocker-ok'
              ? 'bg-cyan-300/45 ring-2 ring-cyan-300 shadow-[0_0_15px_rgba(103,232,249,0.8)]'
              : 'active:bg-white/25'
          }`}
          style={{
            top: '63.5%',
            left: '42.0%',
            width: '16.0%',
            height: '6.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Rocker OK"
        />

        {/* 4-Way Rocker D-Pad: Right */}
        <button
          type="button"
          {...bindDirection('right', 'rocker-right')}
          className={`absolute rounded-r-xl pointer-events-auto transition-colors ${
            activeKey === 'rocker-right'
              ? 'bg-amber-300/40 ring-1 ring-amber-300 shadow-[0_0_12px_rgba(253,224,71,0.7)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '63.0%',
            left: '57.5%',
            width: '14.5%',
            height: '8.0%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Rocker Right"
        />

        {/* 4-Way Rocker D-Pad: Down */}
        <button
          type="button"
          {...bindDirection('down', 'rocker-down')}
          className={`absolute rounded-b-xl pointer-events-auto transition-colors ${
            activeKey === 'rocker-down'
              ? 'bg-amber-300/40 ring-1 ring-amber-300 shadow-[0_0_12px_rgba(253,224,71,0.7)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '68.0%',
            left: '36.0%',
            width: '28.0%',
            height: '6.0%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Rocker Down"
        />

        {/* Keypad Row 1: Key 1 [1 oo] */}
        <button
          type="button"
          {...bindKeypadRegular('1')}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === '1'
              ? 'bg-amber-300/35 ring-2 ring-amber-300/60 shadow-[0_0_15px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '72.8%',
            left: '10.0%',
            width: '25.0%',
            height: '7.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 1"
        />

        {/* Keypad Row 1: Key 2 [2 abc] (Up / Jump) */}
        <button
          type="button"
          {...bindKeypadDirection('2', 'up')}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === '2'
              ? 'bg-amber-300/35 ring-2 ring-amber-300/60 shadow-[0_0_15px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '72.8%',
            left: '37.5%',
            width: '25.0%',
            height: '7.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 2 (Up)"
        />

        {/* Keypad Row 1: Key 3 [3 def] */}
        <button
          type="button"
          {...bindKeypadRegular('3')}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === '3'
              ? 'bg-amber-300/35 ring-2 ring-amber-300/60 shadow-[0_0_15px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '72.8%',
            left: '65.0%',
            width: '25.0%',
            height: '7.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 3"
        />

        {/* Keypad Row 2: Key 4 [4 ghi] (Left) */}
        <button
          type="button"
          {...bindKeypadDirection('4', 'left')}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === '4'
              ? 'bg-amber-300/35 ring-2 ring-amber-300/60 shadow-[0_0_15px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '80.6%',
            left: '10.0%',
            width: '25.0%',
            height: '7.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 4 (Left)"
        />

        {/* Keypad Row 2: Key 5 [• 5 • jkl] (Action / Fire / Jump) */}
        <button
          type="button"
          {...bindAction('5')}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === '5'
              ? 'bg-amber-300/35 ring-2 ring-amber-300/60 shadow-[0_0_15px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '80.6%',
            left: '37.5%',
            width: '25.0%',
            height: '7.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 5 (Action / Fire)"
        />

        {/* Keypad Row 2: Key 6 [6 mno] (Right) */}
        <button
          type="button"
          {...bindKeypadDirection('6', 'right')}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === '6'
              ? 'bg-amber-300/35 ring-2 ring-amber-300/60 shadow-[0_0_15px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '80.6%',
            left: '65.0%',
            width: '25.0%',
            height: '7.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 6 (Right)"
        />

        {/* Keypad Row 3: Key 7 [7 pqrs] */}
        <button
          type="button"
          {...bindKeypadRegular('7')}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === '7'
              ? 'bg-amber-300/35 ring-2 ring-amber-300/60 shadow-[0_0_15px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '88.4%',
            left: '10.0%',
            width: '25.0%',
            height: '7.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 7"
        />

        {/* Keypad Row 3: Key 8 [8 tuv] (Down) */}
        <button
          type="button"
          {...bindKeypadDirection('8', 'down')}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === '8'
              ? 'bg-amber-300/35 ring-2 ring-amber-300/60 shadow-[0_0_15px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '88.4%',
            left: '37.5%',
            width: '25.0%',
            height: '7.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 8 (Down)"
        />

        {/* Keypad Row 3: Key 9 [9 wxyz] */}
        <button
          type="button"
          {...bindKeypadRegular('9')}
          className={`absolute rounded-2xl pointer-events-auto transition-colors ${
            activeKey === '9'
              ? 'bg-amber-300/35 ring-2 ring-amber-300/60 shadow-[0_0_15px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '88.4%',
            left: '65.0%',
            width: '25.0%',
            height: '7.8%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 9"
        />

        {/* Bottom Keypad Row: Key * [ * + ] */}
        <button
          type="button"
          {...bindKeypadRegular('*')}
          className={`absolute rounded-b-xl pointer-events-auto transition-colors ${
            activeKey === '*'
              ? 'bg-amber-300/35 ring-1 ring-amber-300/60 shadow-[0_0_10px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '96.2%',
            left: '12.0%',
            width: '22.0%',
            height: '3.6%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key *"
        />

        {/* Bottom Keypad Row: Key 0 [ 0 _ ] */}
        <button
          type="button"
          {...bindKeypadRegular('0')}
          className={`absolute rounded-b-xl pointer-events-auto transition-colors ${
            activeKey === '0'
              ? 'bg-amber-300/35 ring-1 ring-amber-300/60 shadow-[0_0_10px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '96.2%',
            left: '38.0%',
            width: '24.0%',
            height: '3.6%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key 0"
        />

        {/* Bottom Keypad Row: Key # [ # ⇧ ] */}
        <button
          type="button"
          {...bindKeypadRegular('#')}
          className={`absolute rounded-b-xl pointer-events-auto transition-colors ${
            activeKey === '#'
              ? 'bg-amber-300/35 ring-1 ring-amber-300/60 shadow-[0_0_10px_rgba(253,224,71,0.6)]'
              : 'active:bg-white/20'
          }`}
          style={{
            top: '96.2%',
            left: '66.0%',
            width: '22.0%',
            height: '3.6%',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Key #"
        />

      </div>
    </div>
  )
}
