'use client'
import { useEffect, useState, useRef } from 'react'

const STEPS = [
  { text: 'Reading build plates…', icon: '🔍' },
  { text: 'Analysing photos…', icon: '📷' },
  { text: 'Identifying make and model…', icon: '🏭' },
  { text: 'Extracting field data…', icon: '📋' },
  { text: 'Checking confidence levels…', icon: '✅' },
  { text: 'Finalising results…', icon: '🎯' },
]

const STEP_INTERVAL = 3500 // 3.5s per step
const FADE_DURATION = 250

export function ExtractionLoadingState() {
  const [stepIndex, setStepIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  // Cycle status messages with fade
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setStepIndex(i => (i + 1) % STEPS.length)
        setVisible(true)
      }, FADE_DURATION)
    }, STEP_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Elapsed time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const step = STEPS[stepIndex]

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      {/* Spinner with layered rings */}
      <div className="relative w-16 h-16">
        {/* Outer pulsing glow */}
        <div className="absolute -inset-2 rounded-full bg-emerald-500/10 animate-pulse" />
        {/* Static outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
        {/* Spinning ring — primary */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-400/40"
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
        {/* Counter-spinning inner ring */}
        <div
          className="absolute inset-[6px] rounded-full border border-transparent border-b-emerald-300/50"
          style={{ animation: 'spin 1.8s linear infinite reverse' }}
        />
        {/* Centre dot */}
        <div className="absolute inset-[10px] rounded-full bg-emerald-500/10 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Cycling status message */}
      <div className="min-h-[56px] flex flex-col items-center justify-center gap-1.5">
        <p
          className="text-white font-medium text-[15px] leading-snug"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(4px)',
            transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease`,
          }}
        >
          {step.text}
        </p>
        <p className="text-sm text-white/40">
          Usually 10–20 seconds
        </p>
      </div>

      {/* Progress bar + elapsed */}
      <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
        {/* Segmented progress bar */}
        <div className="flex gap-1 w-full">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full overflow-hidden"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: i < stepIndex ? '100%' : i === stepIndex ? '100%' : '0%',
                  backgroundColor:
                    i < stepIndex
                      ? 'rgb(52 211 153)'
                      : i === stepIndex
                        ? 'rgb(52 211 153)'
                        : 'transparent',
                  opacity: i === stepIndex ? 0.6 : 1,
                  transition: 'width 0.5s ease, opacity 0.3s ease',
                  animation: i === stepIndex ? 'pulse 2s ease-in-out infinite' : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Elapsed timer */}
        <p className="text-xs text-white/30 tabular-nums tracking-wide">
          {elapsed}s elapsed
        </p>
      </div>
    </div>
  )
}
