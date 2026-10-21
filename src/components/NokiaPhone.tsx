import { type ReactNode, useState } from 'react'

function playDefaultKeyBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
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
    setTimeout(() => {
      void ctx.close()
    }, 100)
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
  const [, setActiveKey] = useState<string | null>(null)

  const playClick = () => {
    if (onKeySound) {
      onKeySound()
    } else {
      playDefaultKeyBeep()
    }
  }

  const handleKeyClick = (key: string) => {
    playClick()
    onKeypadPress?.(key)
  }

  // Key continuous hold handlers for directional movement
  const bindDirection = (dir: 'left' | 'right' | 'up' | 'down') => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault()
        setActiveKey(dir)
        playClick()
        onDirectionPress?.(dir, true)
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault()
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
      onPointerLeave: () => {
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
      onPointerCancel: () => {
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
    }
  }

  const bindAction = () => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault()
        setActiveKey('action')
        playClick()
        onActionPress?.(true)
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault()
        setActiveKey(null)
        onActionPress?.(false)
      },
      onPointerLeave: () => {
        setActiveKey(null)
        onActionPress?.(false)
      },
      onPointerCancel: () => {
        setActiveKey(null)
        onActionPress?.(false)
      },
    }
  }

  return (
    <div
      className="relative mx-auto select-none font-sans drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)]"
      style={{
        width: '100%',
        maxWidth: 350,
        aspectRatio: '438 / 870',
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
        className="absolute inset-0 z-20 w-full h-full pointer-events-none select-none object-contain"
      />

      {/* 
        3. TACTILE INTERACTIVE HITBOXES ON THE REAL PHONE BUTTONS
        All buttons are mapped to their exact photographic locations!
      */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        
        {/* Top Navi-Bar Button (Cyan dash) */}
        <button
          type="button"
          onClick={() => {
            playClick()
            onActionPress?.(true)
            setTimeout(() => onActionPress?.(false), 120)
            onLeftSoft?.()
          }}
          className="absolute rounded-full pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '57.0%',
            left: '34.5%',
            width: '31.0%',
            height: '5.0%',
          }}
          aria-label="Navi-Key (Select / Action)"
          title="Navi-Key"
        />

        {/* Clear Button: 'C' */}
        <button
          type="button"
          onClick={() => {
            playClick()
            onRightSoft?.()
          }}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '62.6%',
            left: '11.5%',
            width: '19.0%',
            height: '7.6%',
          }}
          aria-label="C / Clear"
          title="C (Clear / Back)"
        />

        {/* Red Power / End Button: ⏻ */}
        <button
          type="button"
          onClick={() => {
            playClick()
            onEndPress?.()
          }}
          className="absolute rounded-2xl pointer-events-auto active:bg-red-500/30 transition-colors"
          style={{
            top: '62.6%',
            left: '69.5%',
            width: '19.0%',
            height: '7.6%',
          }}
          aria-label="Power / End / Pause"
          title="Power / End"
        />

        {/* 4-Way Rocker D-Pad: Up (Jump / Fly Up) */}
        <button
          type="button"
          {...bindDirection('up')}
          className="absolute rounded-t-xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '61.2%',
            left: '41.0%',
            width: '18.0%',
            height: '4.5%',
          }}
          aria-label="Rocker Up"
        />

        {/* 4-Way Rocker D-Pad: Left */}
        <button
          type="button"
          {...bindDirection('left')}
          className="absolute rounded-l-xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '64.2%',
            left: '33.0%',
            width: '9.5%',
            height: '6.2%',
          }}
          aria-label="Rocker Left"
        />

        {/* 4-Way Rocker D-Pad: Center OK */}
        <button
          type="button"
          {...bindAction()}
          className="absolute rounded-full pointer-events-auto active:bg-white/25 transition-colors"
          style={{
            top: '64.5%',
            left: '42.5%',
            width: '15.0%',
            height: '5.6%',
          }}
          aria-label="Rocker OK"
        />

        {/* 4-Way Rocker D-Pad: Right */}
        <button
          type="button"
          {...bindDirection('right')}
          className="absolute rounded-r-xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '64.2%',
            left: '57.5%',
            width: '9.5%',
            height: '6.2%',
          }}
          aria-label="Rocker Right"
        />

        {/* 4-Way Rocker D-Pad: Down */}
        <button
          type="button"
          {...bindDirection('down')}
          className="absolute rounded-b-xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '69.2%',
            left: '41.0%',
            width: '18.0%',
            height: '4.5%',
          }}
          aria-label="Rocker Down"
        />

        {/* Keypad Row 1: Key 1 [1 oo] */}
        <button
          type="button"
          onClick={() => handleKeyClick('1')}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '73.2%',
            left: '11.0%',
            width: '24.0%',
            height: '7.2%',
          }}
          aria-label="Key 1"
        />

        {/* Keypad Row 1: Key 2 [2 abc] (Up) */}
        <button
          type="button"
          {...bindDirection('up')}
          onClick={() => handleKeyClick('2')}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '73.2%',
            left: '38.0%',
            width: '24.0%',
            height: '7.2%',
          }}
          aria-label="Key 2 (Up)"
        />

        {/* Keypad Row 1: Key 3 [3 def] */}
        <button
          type="button"
          onClick={() => handleKeyClick('3')}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '73.2%',
            left: '65.0%',
            width: '24.0%',
            height: '7.2%',
          }}
          aria-label="Key 3"
        />

        {/* Keypad Row 2: Key 4 [4 ghi] (Left) */}
        <button
          type="button"
          {...bindDirection('left')}
          onClick={() => handleKeyClick('4')}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '81.0%',
            left: '11.0%',
            width: '24.0%',
            height: '7.2%',
          }}
          aria-label="Key 4 (Left)"
        />

        {/* Keypad Row 2: Key 5 [• 5 • jkl] (Action / Fire) */}
        <button
          type="button"
          {...bindAction()}
          onClick={() => handleKeyClick('5')}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '81.0%',
            left: '38.0%',
            width: '24.0%',
            height: '7.2%',
          }}
          aria-label="Key 5 (Action / Fire)"
        />

        {/* Keypad Row 2: Key 6 [6 mno] (Right) */}
        <button
          type="button"
          {...bindDirection('right')}
          onClick={() => handleKeyClick('6')}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '81.0%',
            left: '65.0%',
            width: '24.0%',
            height: '7.2%',
          }}
          aria-label="Key 6 (Right)"
        />

        {/* Keypad Row 3: Key 7 [7 pqrs] */}
        <button
          type="button"
          onClick={() => handleKeyClick('7')}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '89.0%',
            left: '11.0%',
            width: '24.0%',
            height: '7.2%',
          }}
          aria-label="Key 7"
        />

        {/* Keypad Row 3: Key 8 [8 tuv] (Down) */}
        <button
          type="button"
          {...bindDirection('down')}
          onClick={() => handleKeyClick('8')}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '89.0%',
            left: '38.0%',
            width: '24.0%',
            height: '7.2%',
          }}
          aria-label="Key 8 (Down)"
        />

        {/* Keypad Row 3: Key 9 [9 wxyz] */}
        <button
          type="button"
          onClick={() => handleKeyClick('9')}
          className="absolute rounded-2xl pointer-events-auto active:bg-white/20 transition-colors"
          style={{
            top: '89.0%',
            left: '65.0%',
            width: '24.0%',
            height: '7.2%',
          }}
          aria-label="Key 9"
        />

      </div>
    </div>
  )
}
