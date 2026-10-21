import { type ReactNode, useEffect, useState } from 'react'
import { Phone, PhoneOff, Volume2, VolumeX, Sparkles } from 'lucide-react'
import { nokiaSound } from './sound'

interface NokiaPhoneProps {
  children: ReactNode // The LCD screen content (canvas + HUD overlays)
  leftSoftLabel?: string
  rightSoftLabel?: string
  onLeftSoft?: () => void
  onRightSoft?: () => void
  onDirectionPress?: (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => void
  onActionPress?: (pressed: boolean) => void
  onKeypadPress?: (key: string) => void
  onCallPress?: () => void
  onEndPress?: () => void
  cheatActive?: boolean
  lives?: number
  ringsLeft?: number
  ringsTotal?: number
  score?: number
  levelName?: string
}

export function NokiaPhone({
  children,
  leftSoftLabel = 'Menu',
  rightSoftLabel = 'Reset',
  onLeftSoft,
  onRightSoft,
  onDirectionPress,
  onActionPress,
  onKeypadPress,
  onCallPress,
  onEndPress,
  cheatActive = false,
  lives = 3,
  ringsLeft = 0,
  ringsTotal = 0,
  score = 0,
  levelName = 'Level 1',
}: NokiaPhoneProps) {
  const [clock, setClock] = useState('12:00')
  const [soundOn, setSoundOn] = useState(() => !nokiaSound.isMuted())
  const [activeKey, setActiveKey] = useState<string | null>(null)

  // Real-time Nokia clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hrs = String(now.getHours()).padStart(2, '0')
      const mins = String(now.getMinutes()).padStart(2, '0')
      setClock(`${hrs}:${mins}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 10000)
    return () => clearInterval(timer)
  }, [])

  const handleKeyClick = (key: string) => {
    nokiaSound.playKeyClick()
    onKeypadPress?.(key)

    if (key === '*') {
      const newMute = !nokiaSound.isMuted()
      nokiaSound.setMuted(newMute)
      setSoundOn(!newMute)
    }
  }

  // Key continuous hold handlers for directional movement
  const bindDirection = (dir: 'left' | 'right' | 'up' | 'down') => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault()
        setActiveKey(dir)
        nokiaSound.playKeyClick()
        onDirectionPress?.(dir, true)
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault()
        setActiveKey(null)
        onDirectionPress?.(dir, false)
      },
      onPointerLeave: () => {
        if (activeKey === dir) {
          setActiveKey(null)
          onDirectionPress?.(dir, false)
        }
      },
      onPointerCancel: () => {
        if (activeKey === dir) {
          setActiveKey(null)
          onDirectionPress?.(dir, false)
        }
      },
    }
  }

  const bindAction = () => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault()
        setActiveKey('action')
        nokiaSound.playKeyClick()
        onActionPress?.(true)
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault()
        setActiveKey(null)
        onActionPress?.(false)
      },
      onPointerLeave: () => {
        if (activeKey === 'action') {
          setActiveKey(null)
          onActionPress?.(false)
        }
      },
      onPointerCancel: () => {
        if (activeKey === 'action') {
          setActiveKey(null)
          onActionPress?.(false)
        }
      },
    }
  }

  return (
    <div className="relative mx-auto select-none font-sans" style={{ width: '100%', maxWidth: 360 }}>
      {/* Nokia Mobile Outer Chassis */}
      <div className="relative rounded-[44px] bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#090d16] p-4 pt-5 pb-6 border-[3px] border-slate-600/70 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_20px_rgba(30,41,59,0.5),inset_0_2px_4px_rgba(255,255,255,0.25)]">
        
        {/* Subtle Side Grips & Bevel Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent rounded-t-[42px]" />
        
        {/* Earpiece / Top Speaker Slits */}
        <div className="flex justify-center items-center gap-1.5 mb-2.5">
          <div className="w-1.5 h-1 bg-black/80 rounded-full border-t border-white/15" />
          <div className="w-8 h-1.5 bg-black/90 rounded-full border-t border-white/20 shadow-inner" />
          <div className="w-1.5 h-1 bg-black/80 rounded-full border-t border-white/15" />
        </div>

        {/* Embossed Metallic NOKIA Logo */}
        <div className="text-center mb-2">
          <span className="text-sm font-black tracking-[0.28em] text-slate-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
            NOKIA
          </span>
        </div>

        {/* Color LCD Screen Frame with Bezel */}
        <div className="relative rounded-2xl bg-[#090c12] p-2 border-2 border-slate-700/80 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_2px_4px_rgba(255,255,255,0.06)]">
          
          {/* LCD Status Bar (Signal, Operator, Time, Battery) */}
          <div className="flex items-center justify-between px-2 py-1 bg-[#4a7a96] text-[#051119] text-[10px] font-mono font-bold tracking-tight rounded-t-lg select-none border-b border-[#365f77]">
            {/* Signal Bars */}
            <div className="flex items-end gap-[1.5px] h-2.5" title="Signal Strength">
              <span className="w-1 h-1 bg-[#051119] rounded-[0.5px]" />
              <span className="w-1 h-1.5 bg-[#051119] rounded-[0.5px]" />
              <span className="w-1 h-2 bg-[#051119] rounded-[0.5px]" />
              <span className="w-1 h-2.5 bg-[#051119] rounded-[0.5px]" />
            </div>

            {/* Operator / Brand */}
            <div className="flex items-center gap-1 font-black text-[10px] tracking-wider">
              <span>NOKIA</span>
              {cheatActive && (
                <span className="inline-flex items-center gap-0.5 text-[8px] bg-amber-400 text-black px-1 rounded font-black animate-pulse">
                  <Sparkles size={8} /> GOD
                </span>
              )}
            </div>

            {/* Time & Battery */}
            <div className="flex items-center gap-1.5">
              <span>{clock}</span>
              {/* Battery Meter */}
              <div className="w-3.5 h-2 border border-[#051119] rounded-[1px] p-[1px] flex gap-[1px]">
                <div className="flex-1 bg-[#051119]" />
                <div className="flex-1 bg-[#051119]" />
                <div className="flex-1 bg-[#051119]" />
              </div>
            </div>
          </div>

          {/* In-Game Retro HUD Bar */}
          <div className="flex items-center justify-between px-2 py-0.5 bg-[#3c6b84] text-white text-[10px] font-mono font-bold select-none border-b border-[#2b5065]">
            {/* Lives */}
            <div className="flex items-center gap-1">
              <span className="text-[#fecaca]">LIVES:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      i < lives
                        ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-[0_0_4px_rgba(239,68,68,0.8)]'
                        : 'bg-black/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Rings Remaining */}
            <div className="flex items-center gap-1">
              <span className="text-amber-300 font-bold">⭕</span>
              <span className="text-amber-200">
                {ringsTotal - ringsLeft}/{ringsTotal}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-1 font-black">
              <span className="text-cyan-200">{score.toString().padStart(5, '0')}</span>
            </div>
          </div>

          {/* The LCD Touchscreen Game Area */}
          <div className="relative overflow-hidden bg-[#5da5db] aspect-square w-full">
            {/* Glass Glare Overlay */}
            <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/5 to-white/15" />
            
            {/* CRT/LCD Pixel Texture Lines */}
            <div
              className="pointer-events-none absolute inset-0 z-20 opacity-15"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
                backgroundSize: '100% 2px'
              }}
            />

            {/* Active Content: Touch Canvas */}
            {children}
          </div>

          {/* LCD Softkey Labels Bar */}
          <div className="flex items-center justify-between px-3 py-1 bg-[#4a7a96] text-[#051119] text-[11px] font-mono font-black uppercase rounded-b-lg border-t border-[#365f77] shadow-inner select-none">
            <span className="tracking-wide">◄ {leftSoftLabel}</span>
            <span className="text-[9px] text-[#1c3848] font-bold">{levelName}</span>
            <span className="tracking-wide">{rightSoftLabel} ►</span>
          </div>
        </div>

        {/* Subtle Touch Screen Notice */}
        <div className="text-center mt-1 text-[10px] text-slate-400 font-medium">
          <span>📱 Touch screen & keypad both work</span>
        </div>

        {/* NOKIA KEYPAD CONTROLS */}
        <div className="mt-3 px-1 space-y-2.5">
          
          {/* Top Row: Left Softkey, D-Pad, Right Softkey */}
          <div className="grid grid-cols-5 items-center gap-2">
            
            {/* Left Softkey & Call Button */}
            <div className="col-span-1 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  nokiaSound.playKeyClick()
                  onLeftSoft?.()
                }}
                className="w-full h-8 rounded-lg bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 text-slate-200 text-xs font-black shadow-[0_3px_5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] active:translate-y-0.5 active:shadow-inner border border-slate-500/40 flex items-center justify-center hover:brightness-110"
                aria-label="Left softkey"
              >
                —
              </button>
              <button
                type="button"
                onClick={() => {
                  nokiaSound.playKeyClick()
                  onCallPress?.()
                }}
                className="w-full h-8 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-800 text-white shadow-[0_3px_5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] active:translate-y-0.5 active:shadow-inner border border-emerald-500/50 flex items-center justify-center hover:brightness-110"
                aria-label="Call / Start"
              >
                <Phone size={14} className="fill-current" />
              </button>
            </div>

            {/* Center: 4-Way D-Pad with Chrome Center Button */}
            <div className="col-span-3 flex justify-center">
              <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-900 p-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.2)] border border-slate-600/50">
                
                {/* D-Pad Up */}
                <button
                  type="button"
                  {...bindDirection('up')}
                  className="absolute top-1 left-8 right-8 h-8 rounded-t-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center border-t border-slate-500/40 active:bg-cyan-950 active:text-cyan-300"
                  aria-label="D-pad Up (Jump)"
                >
                  ▲
                </button>

                {/* D-Pad Left */}
                <button
                  type="button"
                  {...bindDirection('left')}
                  className="absolute top-8 bottom-8 left-1 w-8 rounded-l-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center border-l border-slate-500/40 active:bg-cyan-950 active:text-cyan-300"
                  aria-label="D-pad Left"
                >
                  ◄
                </button>

                {/* Center OK / Jump Button */}
                <button
                  type="button"
                  {...bindAction()}
                  className="absolute inset-8 rounded-full bg-gradient-to-b from-slate-400 via-slate-500 to-slate-700 text-slate-950 font-black text-xs shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.6)] flex items-center justify-center border border-slate-300/60 active:scale-95 active:shadow-inner hover:brightness-110"
                  aria-label="Center OK / Action"
                >
                  OK
                </button>

                {/* D-Pad Right */}
                <button
                  type="button"
                  {...bindDirection('right')}
                  className="absolute top-8 bottom-8 right-1 w-8 rounded-r-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center border-r border-slate-500/40 active:bg-cyan-950 active:text-cyan-300"
                  aria-label="D-pad Right"
                >
                  ►
                </button>

                {/* D-Pad Down */}
                <button
                  type="button"
                  {...bindDirection('down')}
                  className="absolute bottom-1 left-8 right-8 h-8 rounded-b-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center border-b border-slate-500/40 active:bg-cyan-950 active:text-cyan-300"
                  aria-label="D-pad Down"
                >
                  ▼
                </button>
              </div>
            </div>

            {/* Right Softkey & End Call Button */}
            <div className="col-span-1 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  nokiaSound.playKeyClick()
                  onRightSoft?.()
                }}
                className="w-full h-8 rounded-lg bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 text-slate-200 text-xs font-black shadow-[0_3px_5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] active:translate-y-0.5 active:shadow-inner border border-slate-500/40 flex items-center justify-center hover:brightness-110"
                aria-label="Right softkey"
              >
                —
              </button>
              <button
                type="button"
                onClick={() => {
                  nokiaSound.playKeyClick()
                  onEndPress?.()
                }}
                className="w-full h-8 rounded-lg bg-gradient-to-b from-rose-700 to-rose-900 text-white shadow-[0_3px_5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] active:translate-y-0.5 active:shadow-inner border border-rose-500/50 flex items-center justify-center hover:brightness-110"
                aria-label="End / Pause"
              >
                <PhoneOff size={14} className="fill-current" />
              </button>
            </div>
          </div>

          {/* 3x4 Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            
            {/* Key 1 */}
            <button
              type="button"
              onClick={() => handleKeyClick('1')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-white">1</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">.</span>
            </button>

            {/* Key 2 (▲ JUMP) */}
            <button
              type="button"
              {...bindDirection('up')}
              onClick={() => handleKeyClick('2')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-cyan-300">2 ▲</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">abc · JUMP</span>
            </button>

            {/* Key 3 */}
            <button
              type="button"
              onClick={() => handleKeyClick('3')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-white">3</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">def</span>
            </button>

            {/* Key 4 (◄ LEFT) */}
            <button
              type="button"
              {...bindDirection('left')}
              onClick={() => handleKeyClick('4')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-cyan-300">4 ◄</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">ghi · LEFT</span>
            </button>

            {/* Key 5 (ACTION / JUMP) */}
            <button
              type="button"
              {...bindAction()}
              onClick={() => handleKeyClick('5')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-cyan-500/40 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-cyan-300">5 ⦿</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">jkl · JUMP</span>
            </button>

            {/* Key 6 (► RIGHT) */}
            <button
              type="button"
              {...bindDirection('right')}
              onClick={() => handleKeyClick('6')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-cyan-300">6 ►</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">mno · RIGHT</span>
            </button>

            {/* Key 7 (Cheat 787898) */}
            <button
              type="button"
              onClick={() => handleKeyClick('7')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-white">7</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">pqrs</span>
            </button>

            {/* Key 8 (▼ DOWN) */}
            <button
              type="button"
              {...bindDirection('down')}
              onClick={() => handleKeyClick('8')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-white">8 ▼</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">tuv</span>
            </button>

            {/* Key 9 */}
            <button
              type="button"
              onClick={() => handleKeyClick('9')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-white">9</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">wxyz</span>
            </button>

            {/* Key * (Sound Toggle) */}
            <button
              type="button"
              onClick={() => handleKeyClick('*')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
              title="Toggle Sound (*)"
            >
              <span className="text-sm font-black leading-none text-amber-300 flex items-center gap-1">
                * {soundOn ? <Volume2 size={10} /> : <VolumeX size={10} />}
              </span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">SOUND</span>
            </button>

            {/* Key 0 */}
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
            >
              <span className="text-sm font-black leading-none text-white">0</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">␣</span>
            </button>

            {/* Key # (Cheat Toggle / Info) */}
            <button
              type="button"
              onClick={() => handleKeyClick('#')}
              className="h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center active:scale-95 active:bg-cyan-950 text-slate-200 hover:brightness-110"
              title="Cheat Code (#787898#)"
            >
              <span className="text-sm font-black leading-none text-amber-300"># ⇧</span>
              <span className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">CHEAT</span>
            </button>

          </div>
        </div>

        {/* Nokia Microphone Hole at Bottom */}
        <div className="flex justify-center mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-black/90 shadow-inner border border-white/10" />
        </div>

      </div>
    </div>
  )
}
