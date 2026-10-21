import { type ReactNode, useState } from 'react'
import { nokiaSound } from './sound'

interface NokiaPhoneProps {
  children: ReactNode // The LCD screen content (canvas)
  onLeftSoft?: () => void
  onRightSoft?: () => void
  onDirectionPress?: (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => void
  onActionPress?: (pressed: boolean) => void
  onKeypadPress?: (key: string) => void
  onEndPress?: () => void
  cheatActive?: boolean
}

export function NokiaPhone({
  children,
  onLeftSoft,
  onRightSoft,
  onDirectionPress,
  onActionPress,
  onKeypadPress,
  onEndPress,
  cheatActive = false,
}: NokiaPhoneProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const handleKeyClick = (key: string) => {
    nokiaSound.playKeyClick()
    onKeypadPress?.(key)

    if (key === '*') {
      const newMute = !nokiaSound.isMuted()
      nokiaSound.setMuted(newMute)
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
    <div className="relative mx-auto select-none font-sans" style={{ width: '100%', maxWidth: 350 }}>
      {/* 
        NOKIA 3510i Outer Handset Body
        Champagne / Metallic Grey curved ergonomic chassis
      */}
      <div className="relative rounded-[46px] bg-gradient-to-b from-[#d2d7e0] via-[#abb1bd] to-[#8a919e] p-3.5 pt-4 pb-6 border-[2px] border-[#787e8a] shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.5)]">
        
        {/* Subtle Top Metallic Highlight */}
        <div className="pointer-events-none absolute inset-x-6 top-1 h-12 bg-gradient-to-b from-white/40 to-transparent rounded-t-[40px]" />

        {/* Top Earpiece Speaker Slit (Nokia 3510i style) */}
        <div className="flex justify-center mb-2.5">
          <div className="w-16 h-2 bg-[#12141a] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.4)] border-t border-black/60 flex items-center justify-center">
            <div className="w-8 h-0.5 bg-[#252833] rounded-full" />
          </div>
        </div>

        {/* 
          Inner Midnight Navy / Indigo Faceplate Insert
          Enclosing NOKIA logo, Screen, and Keypad
        */}
        <div className="relative rounded-[32px] bg-gradient-to-b from-[#242948] via-[#1c203b] to-[#14172c] px-3 pt-2 pb-5 border border-[#3b4372]/60 shadow-[inset_0_2px_6px_rgba(0,0,0,0.7),0_1px_2px_rgba(255,255,255,0.25)]">
          
          {/* White/Silver NOKIA Branding */}
          <div className="text-center py-1">
            <span className="text-[17px] font-black tracking-[0.24em] text-[#d6dae2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              NOKIA
            </span>
            {cheatActive && (
              <span className="ml-2 inline-block text-[8px] bg-amber-400 text-black px-1 rounded font-black animate-pulse">
                GOD
              </span>
            )}
          </div>

          {/* 
            Chrome Metallic LCD Screen Bezel Frame
            Surrounds the LCD display with rounded corners
          */}
          <div className="relative mt-0.5 rounded-[10px] bg-gradient-to-b from-[#e5e9f2] via-[#b8bcc8] to-[#8d93a0] p-[3px] shadow-[0_2px_5px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.9)]">
            
            {/* Inner Dark Screen Recess */}
            <div className="relative rounded-[7px] bg-[#000000] p-[1.5px] overflow-hidden">
              
              {/* LCD Screen Container (Touches and clicks work directly here!) */}
              <div className="relative overflow-hidden w-full aspect-[4/3] bg-[#004ecc] rounded-[5px]">
                {/* Subtle LCD Glare and Scanlines */}
                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
                <div
                  className="pointer-events-none absolute inset-0 z-20 opacity-10"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 2px)',
                    backgroundSize: '100% 2px'
                  }}
                />

                {/* Game Canvas */}
                {children}
              </div>
            </div>
          </div>

          {/* Touch Screen Notice */}
          <div className="text-center mt-1.5 text-[9px] text-slate-300 font-semibold tracking-wide">
            <span>📱 Screen touch & keypad both active</span>
          </div>

          {/* 
            NOKIA 3510i CONTROLS SECTION
          */}
          <div className="mt-2 space-y-2">
            
            {/* Top Soft / Navi-Bar Key (Curved pill with cyan line in center) */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  nokiaSound.playKeyClick()
                  onActionPress?.(true)
                  setTimeout(() => onActionPress?.(false), 100)
                  onLeftSoft?.()
                }}
                className="w-28 h-6 rounded-full bg-gradient-to-b from-[#3a4168] via-[#292e4e] to-[#1c203b] border border-[#4d568c]/60 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] active:translate-y-0.5 active:brightness-125 flex items-center justify-center hover:brightness-110"
                aria-label="Navi-Key / Jump / Select"
                title="Navi-Key (Select / Jump)"
              >
                {/* Cyan Blue Horizontal Accent Bar */}
                <div className="w-8 h-[3px] bg-[#00bcd4] rounded-full shadow-[0_0_4px_rgba(0,188,212,0.8)]" />
              </button>
            </div>

            {/* 
              Middle Row:
              [C (Clear)]  [4-Way Rocker: ⌢, ⌣, (, )]  [⏻ (Red Power / End)]
            */}
            <div className="grid grid-cols-4 items-center gap-2">
              
              {/* Left Button: Silver 'C' (Clear / Back) */}
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    nokiaSound.playKeyClick()
                    onRightSoft?.()
                  }}
                  className="w-12 h-10 rounded-2xl bg-gradient-to-b from-[#3a4168] via-[#282d4c] to-[#191c34] text-[#d6dae2] text-sm font-black border border-[#4d568c]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] active:translate-y-0.5 active:brightness-125 flex items-center justify-center hover:brightness-110"
                  aria-label="C / Clear / Back"
                  title="C / Clear"
                >
                  C
                </button>
              </div>

              {/* Center: The Iconic Nokia 3510i 4-Way Directional Rocker */}
              <div className="col-span-2 flex justify-center">
                <div className="relative w-28 h-20 rounded-[20px] bg-gradient-to-b from-[#353b62] via-[#262a47] to-[#181b30] p-1 border border-[#4d568c]/60 shadow-[0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center">
                  
                  {/* Rocker Up: ⌢ */}
                  <button
                    type="button"
                    {...bindDirection('up')}
                    className="absolute top-0.5 inset-x-4 h-6 text-[#d6dae2] text-xs font-black flex items-center justify-center active:text-cyan-300"
                    aria-label="Up (Jump)"
                  >
                    ⌢
                  </button>

                  {/* Rocker Left: ( */}
                  <button
                    type="button"
                    {...bindDirection('left')}
                    className="absolute left-0.5 inset-y-3 w-6 text-[#d6dae2] text-sm font-black flex items-center justify-center active:text-cyan-300"
                    aria-label="Left"
                  >
                    (
                  </button>

                  {/* Center OK button */}
                  <button
                    type="button"
                    {...bindAction()}
                    className="w-10 h-7 rounded-full bg-gradient-to-b from-[#414873] via-[#2d3255] to-[#1a1d35] text-[#d6dae2] text-[10px] font-black border border-[#5a649f]/40 shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 flex items-center justify-center hover:brightness-110"
                    aria-label="OK / Jump"
                  >
                    OK
                  </button>

                  {/* Rocker Right: ) */}
                  <button
                    type="button"
                    {...bindDirection('right')}
                    className="absolute right-0.5 inset-y-3 w-6 text-[#d6dae2] text-sm font-black flex items-center justify-center active:text-cyan-300"
                    aria-label="Right"
                  >
                    )
                  </button>

                  {/* Rocker Down: ⌣ */}
                  <button
                    type="button"
                    {...bindDirection('down')}
                    className="absolute bottom-0.5 inset-x-4 h-6 text-[#d6dae2] text-xs font-black flex items-center justify-center active:text-cyan-300"
                    aria-label="Down"
                  >
                    ⌣
                  </button>
                </div>
              </div>

              {/* Right Button: Red Power / End Symbol ⏻ */}
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    nokiaSound.playKeyClick()
                    onEndPress?.()
                  }}
                  className="w-12 h-10 rounded-2xl bg-gradient-to-b from-[#3a4168] via-[#282d4c] to-[#191c34] text-[#f87171] text-sm font-black border border-[#4d568c]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] active:translate-y-0.5 active:brightness-125 flex items-center justify-center hover:brightness-110"
                  aria-label="Power / End / Pause"
                  title="Power / End"
                >
                  <span className="w-5 h-5 rounded-full border-2 border-[#ef4444] text-[#ef4444] flex items-center justify-center text-[10px] font-black">
                    ⏻
                  </span>
                </button>
              </div>
            </div>

            {/* 
              Nokia 3510i Split Wave / Butterfly Keypad
              Row 1: [1 oo]  [2 abc]  [3 def]
              Row 2: [4 ghi] [5 jkl • •] [6 mno]
              Row 3: [7 pqrs] [8 tuv] [9 wxyz]
              Row 4: [* +]   [0 _]    [# ⇧]
            */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              
              {/* Key 1: 1 oo */}
              <button
                type="button"
                onClick={() => handleKeyClick('1')}
                className="h-10 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <span className="text-[15px] font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">1</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5 tracking-tighter">oo</span>
              </button>

              {/* Key 2: 2 abc ▲ (Jump) */}
              <button
                type="button"
                {...bindDirection('up')}
                onClick={() => handleKeyClick('2')}
                className="h-10 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <span className="text-[15px] font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">2</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">abc</span>
              </button>

              {/* Key 3: 3 def */}
              <button
                type="button"
                onClick={() => handleKeyClick('3')}
                className="h-10 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <span className="text-[15px] font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">3</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">def</span>
              </button>

              {/* Key 4: 4 ghi ◄ (Left) */}
              <button
                type="button"
                {...bindDirection('left')}
                onClick={() => handleKeyClick('4')}
                className="h-10 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <span className="text-[15px] font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">4</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">ghi</span>
              </button>

              {/* Key 5: 5 jkl with raised dots • • */}
              <button
                type="button"
                {...bindAction()}
                onClick={() => handleKeyClick('5')}
                className="h-10 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-cyan-400/40 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  <span className="text-[15px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">5</span>
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                </div>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">jkl</span>
              </button>

              {/* Key 6: 6 mno ► (Right) */}
              <button
                type="button"
                {...bindDirection('right')}
                onClick={() => handleKeyClick('6')}
                className="h-10 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <span className="text-[15px] font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">6</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">mno</span>
              </button>

              {/* Key 7: 7 pqrs */}
              <button
                type="button"
                onClick={() => handleKeyClick('7')}
                className="h-10 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <span className="text-[15px] font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">7</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">pqrs</span>
              </button>

              {/* Key 8: 8 tuv ▼ (Down) */}
              <button
                type="button"
                {...bindDirection('down')}
                onClick={() => handleKeyClick('8')}
                className="h-10 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <span className="text-[15px] font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">8</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">tuv</span>
              </button>

              {/* Key 9: 9 wxyz */}
              <button
                type="button"
                onClick={() => handleKeyClick('9')}
                className="h-10 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <span className="text-[15px] font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">9</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">wxyz</span>
              </button>

              {/* Key *: * + */}
              <button
                type="button"
                onClick={() => handleKeyClick('*')}
                className="h-9 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
                title="Toggle Sound (*)"
              >
                <span className="text-sm font-black leading-none text-amber-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">*</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">+</span>
              </button>

              {/* Key 0: 0 _ */}
              <button
                type="button"
                onClick={() => handleKeyClick('0')}
                className="h-9 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
              >
                <span className="text-sm font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">0</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">_</span>
              </button>

              {/* Key #: # ⇧ */}
              <button
                type="button"
                onClick={() => handleKeyClick('#')}
                className="h-9 rounded-2xl bg-gradient-to-b from-[#343a60] via-[#242845] to-[#181a30] border border-[#454d7e]/50 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center active:scale-95 active:brightness-125 hover:brightness-110"
                title="God Mode Cheat (787898 or #)"
              >
                <span className="text-sm font-black leading-none text-amber-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">#</span>
                <span className="text-[8px] text-slate-300 font-bold leading-none mt-0.5">⇧</span>
              </button>

            </div>
          </div>
        </div>

        {/* Nokia 3510i Microphone Hole at Bottom */}
        <div className="flex justify-center mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#12141a] shadow-inner border border-white/20" />
        </div>

      </div>
    </div>
  )
}
