import React, { useCallback, useRef, useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

export interface BasicControllerProps {
  /** Called when a D-Pad direction is pressed (true) or released (false) */
  onDirectionPress?: (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => void

  /** Called when primary Action (A) is pressed (true) or released (false) */
  onActionPress?: (pressed: boolean) => void
  actionLabel?: string
  actionSublabel?: string
  actionColor?: 'amber' | 'emerald' | 'red' | 'cyan'

  /** Optional secondary Action (B) for games like Space Impact */
  showSecondaryAction?: boolean
  onSecondaryActionPress?: (pressed: boolean) => void
  secondaryActionLabel?: string
  secondaryActionSublabel?: string
  secondaryColor?: 'cyan' | 'purple' | 'blue' | 'amber'

  /** Center utility buttons */
  onSelect?: () => void
  selectLabel?: string
  onStartPause?: () => void
  startPauseLabel?: string
  isPaused?: boolean

  /** Optional slot for game-specific toggles (cheats, theme switcher) */
  extraSlot?: React.ReactNode

  /** Optional audio click sound callback */
  onKeyClickSound?: () => void

  /** Custom container class */
  className?: string
}

export function BasicController({
  onDirectionPress,
  onActionPress,
  actionLabel = 'A',
  actionSublabel = 'ACTION',
  actionColor = 'amber',
  showSecondaryAction = false,
  onSecondaryActionPress,
  secondaryActionLabel = 'B',
  secondaryActionSublabel = 'SPECIAL',
  secondaryColor = 'cyan',
  onSelect,
  selectLabel = 'SELECT',
  onStartPause,
  startPauseLabel = 'PAUSE',
  isPaused = false,
  extraSlot,
  onKeyClickSound,
  className = '',
}: BasicControllerProps) {
  // Map of active pointer IDs to button keys for robust multi-touch
  const activePointersRef = useRef<Map<number, string>>(new Map())
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({})

  const markKey = useCallback((key: string, active: boolean) => {
    setActiveKeys(prev => {
      if (prev[key] === active) return prev
      return { ...prev, [key]: active }
    })
  }, [])

  // Universal text selection suppression while controller is mounted
  useEffect(() => {
    const preventSelection = (e: Event) => e.preventDefault()
    document.addEventListener('selectstart', preventSelection)
    return () => document.removeEventListener('selectstart', preventSelection)
  }, [])

  // Pointer event binder for D-Pad directions
  const bindDirection = (dir: 'up' | 'down' | 'left' | 'right') => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, dir)
        } catch {}
        markKey(dir, true)
        onKeyClickSound?.()
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
        markKey(dir, false)
        onDirectionPress?.(dir, false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKey(dir, false)
        onDirectionPress?.(dir, false)
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) return
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKey(dir, false)
        onDirectionPress?.(dir, false)
      },
      onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // Pointer event binder for Action buttons (A and B)
  const bindAction = (keyId: string, actionFn?: (pressed: boolean) => void) => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, keyId)
        } catch {}
        markKey(keyId, true)
        onKeyClickSound?.()
        actionFn?.(true)
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
        markKey(keyId, false)
        actionFn?.(false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKey(keyId, false)
        actionFn?.(false)
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) return
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKey(keyId, false)
        actionFn?.(false)
      },
      onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // Pointer event binder for utility buttons (Select, Start/Pause)
  const bindUtility = (keyId: string, onClickFn?: () => void) => {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
          activePointersRef.current.set(e.pointerId, keyId)
        } catch {}
        markKey(keyId, true)
        onKeyClickSound?.()
        onClickFn?.()
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
        markKey(keyId, false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        } catch {}
        activePointersRef.current.delete(e.pointerId)
        markKey(keyId, false)
      },
      onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }

  // Styling helper for Action A button
  const getActionStyles = () => {
    const isActive = activeKeys['action_a']
    switch (actionColor) {
      case 'emerald':
        return isActive
          ? 'bg-emerald-400 text-slate-950 border-white shadow-[0_0_22px_rgba(52,211,153,0.9)] scale-[0.95] translate-y-1'
          : 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-300 text-slate-950 shadow-[0_5px_0_#065f46,0_8px_16px_rgba(16,185,129,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#065f46]'
      case 'red':
        return isActive
          ? 'bg-rose-400 text-slate-950 border-white shadow-[0_0_22px_rgba(251,113,133,0.9)] scale-[0.95] translate-y-1'
          : 'bg-gradient-to-b from-rose-500 to-rose-700 border-rose-300 text-white shadow-[0_5px_0_#881337,0_8px_16px_rgba(244,63,94,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#881337]'
      case 'cyan':
        return isActive
          ? 'bg-cyan-300 text-slate-950 border-white shadow-[0_0_22px_rgba(103,232,249,0.9)] scale-[0.95] translate-y-1'
          : 'bg-gradient-to-b from-cyan-400 to-cyan-600 border-cyan-200 text-slate-950 shadow-[0_5px_0_#155e75,0_8px_16px_rgba(6,182,212,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#155e75]'
      case 'amber':
      default:
        return isActive
          ? 'bg-amber-300 text-slate-950 border-white shadow-[0_0_24px_rgba(253,224,71,0.9)] scale-[0.95] translate-y-1'
          : 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 text-slate-950 shadow-[0_5px_0_#92400e,0_8px_18px_rgba(245,158,11,0.4)] active:translate-y-1 active:shadow-[0_1px_0_#92400e]'
    }
  }

  // Styling helper for Action B button
  const getSecondaryStyles = () => {
    const isActive = activeKeys['action_b']
    switch (secondaryColor) {
      case 'purple':
        return isActive
          ? 'bg-purple-300 text-slate-950 border-white shadow-[0_0_20px_rgba(216,180,254,0.9)] scale-[0.95] translate-y-1'
          : 'bg-gradient-to-b from-purple-400 to-purple-600 border-purple-300 text-white shadow-[0_4px_0_#581c87,0_6px_14px_rgba(168,85,247,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#581c87]'
      case 'blue':
        return isActive
          ? 'bg-sky-300 text-slate-950 border-white shadow-[0_0_20px_rgba(125,211,252,0.9)] scale-[0.95] translate-y-1'
          : 'bg-gradient-to-b from-sky-400 to-sky-600 border-sky-300 text-slate-950 shadow-[0_4px_0_#075985,0_6px_14px_rgba(14,165,233,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#075985]'
      case 'cyan':
      default:
        return isActive
          ? 'bg-cyan-300 text-slate-950 border-white shadow-[0_0_20px_rgba(103,232,249,0.9)] scale-[0.95] translate-y-1'
          : 'bg-gradient-to-b from-cyan-400 to-cyan-600 border-cyan-200 text-slate-950 shadow-[0_4px_0_#155e75,0_6px_14px_rgba(6,182,212,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#155e75]'
    }
  }

  return (
    <div
      className={`retro-controller-root w-full max-w-[420px] mx-auto select-none touch-none ${className}`}
      style={{
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        .retro-controller-root, .retro-controller-root * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
      `}</style>

      {/* Controller Chassis Card */}
      <div className="relative w-full bg-gradient-to-b from-[#151c2e] via-[#0f1523] to-[#090d16] rounded-3xl p-3 sm:p-4 border-2 border-slate-700/80 shadow-[0_12px_32px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)]">
        
        {/* Top Control Bar: Select, Start/Pause, and Extra Slot */}
        <div className="flex items-center justify-between w-full mb-3 px-1">
          {/* Left/Center Utilities */}
          <div className="flex items-center gap-2">
            {onSelect && (
              <button
                type="button"
                aria-label={selectLabel}
                {...bindUtility('select', onSelect)}
                className={`h-7 px-3 rounded-full border text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 transition-all select-none touch-none ${
                  activeKeys['select']
                    ? 'bg-slate-300 text-slate-950 border-white shadow-[0_0_10px_rgba(255,255,255,0.7)] translate-y-0.5'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 shadow-[0_2px_0_#0f172a] active:translate-y-0.5'
                }`}
              >
                <span>◒</span>
                <span>{selectLabel}</span>
              </button>
            )}

            {onStartPause && (
              <button
                type="button"
                aria-label={startPauseLabel}
                {...bindUtility('start_pause', onStartPause)}
                className={`h-7 px-3 rounded-full border text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 transition-all select-none touch-none ${
                  isPaused || activeKeys['start_pause']
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)] translate-y-0.5'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 shadow-[0_2px_0_#0f172a] active:translate-y-0.5'
                }`}
              >
                <span>{isPaused ? '▶' : '⏸'}</span>
                <span>{startPauseLabel}</span>
              </button>
            )}
          </div>

          {/* Right Extra Slot (e.g. cheats, theme toggle) */}
          {extraSlot && <div className="flex items-center">{extraSlot}</div>}
        </div>

        {/* Main Controls Deck: Left D-Pad + Right Action Buttons */}
        <div className="flex items-center justify-between w-full px-1 pt-1 pb-1">
          
          {/* LEFT: Classic 4-Way D-Pad Cross */}
          <div className="relative w-[130px] h-[130px] sm:w-[140px] sm:h-[140px] flex items-center justify-center shrink-0">
            {/* Cross Background Well */}
            <div className="absolute inset-0 m-auto w-[124px] h-[124px] sm:w-[134px] sm:h-[134px] bg-[#0b0f19] rounded-2xl border border-slate-800 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] pointer-events-none" />

            {/* UP BUTTON */}
            <button
              type="button"
              aria-label="D-Pad Up"
              {...bindDirection('up')}
              className={`absolute top-0 inset-x-0 mx-auto w-11 h-11 sm:w-12 sm:h-12 rounded-t-xl border flex items-center justify-center select-none touch-none transition-all ${
                activeKeys['up']
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.8)] scale-[0.96] translate-y-0.5'
                  : 'bg-gradient-to-b from-slate-700 to-slate-800 border-slate-600 text-slate-200 shadow-[0_3px_0_#1e293b] active:translate-y-0.5'
              }`}
            >
              <ChevronUp size={22} strokeWidth={3} />
            </button>

            {/* LEFT BUTTON */}
            <button
              type="button"
              aria-label="D-Pad Left"
              {...bindDirection('left')}
              className={`absolute left-0 inset-y-0 my-auto w-11 h-11 sm:w-12 sm:h-12 rounded-l-xl border flex items-center justify-center select-none touch-none transition-all ${
                activeKeys['left']
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.8)] scale-[0.96] translate-x-0.5'
                  : 'bg-gradient-to-r from-slate-700 to-slate-800 border-slate-600 text-slate-200 shadow-[0_3px_0_#1e293b] active:translate-x-0.5'
              }`}
            >
              <ChevronLeft size={22} strokeWidth={3} />
            </button>

            {/* CENTER PIVOT DOT */}
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center pointer-events-none z-10 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700/70" />
            </div>

            {/* RIGHT BUTTON */}
            <button
              type="button"
              aria-label="D-Pad Right"
              {...bindDirection('right')}
              className={`absolute right-0 inset-y-0 my-auto w-11 h-11 sm:w-12 sm:h-12 rounded-r-xl border flex items-center justify-center select-none touch-none transition-all ${
                activeKeys['right']
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.8)] scale-[0.96] -translate-x-0.5'
                  : 'bg-gradient-to-l from-slate-700 to-slate-800 border-slate-600 text-slate-200 shadow-[0_3px_0_#1e293b] active:-translate-x-0.5'
              }`}
            >
              <ChevronRight size={22} strokeWidth={3} />
            </button>

            {/* DOWN BUTTON */}
            <button
              type="button"
              aria-label="D-Pad Down"
              {...bindDirection('down')}
              className={`absolute bottom-0 inset-x-0 mx-auto w-11 h-11 sm:w-12 sm:h-12 rounded-b-xl border flex items-center justify-center select-none touch-none transition-all ${
                activeKeys['down']
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.8)] scale-[0.96] -translate-y-0.5'
                  : 'bg-gradient-to-t from-slate-700 to-slate-800 border-slate-600 text-slate-200 shadow-[0_3px_0_#1e293b] active:-translate-y-0.5'
              }`}
            >
              <ChevronDown size={22} strokeWidth={3} />
            </button>
          </div>

          {/* RIGHT: Ergonomic Arcade Action Buttons Deck */}
          <div className="flex items-center gap-3 sm:gap-4 pl-2">
            
            {/* Optional B (Secondary Action) Button */}
            {showSecondaryAction && (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  aria-label={`Button ${secondaryActionLabel} (${secondaryActionSublabel})`}
                  {...bindAction('action_b', onSecondaryActionPress)}
                  className={`w-14 h-14 sm:w-15 sm:h-15 rounded-full border-2 flex flex-col items-center justify-center select-none touch-none transition-all ${getSecondaryStyles()}`}
                >
                  <span className="text-base font-black leading-none font-mono tracking-tight">{secondaryActionLabel}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none mt-0.5 opacity-90">{secondaryActionSublabel}</span>
                </button>
              </div>
            )}

            {/* Primary A Action Button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                aria-label={`Button ${actionLabel} (${actionSublabel})`}
                {...bindAction('action_a', onActionPress)}
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full border-3 flex flex-col items-center justify-center select-none touch-none transition-all ${getActionStyles()}`}
              >
                <span className="text-xl sm:text-2xl font-black leading-none font-mono tracking-tight">{actionLabel}</span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider leading-none mt-0.5 opacity-95">{actionSublabel}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Desktop Helper Subtitle */}
        <div className="w-full text-center mt-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono hidden sm:block">
          D-Pad: <strong className="text-slate-400">Arrow Keys / WASD</strong> · Action: <strong className="text-slate-400">Space / Enter</strong>
        </div>
      </div>
    </div>
  )
}
