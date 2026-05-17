'use client'
import { useEffect, useState, useRef } from 'react'
import { ScanLine, Search, Car, ClipboardList, FileCheck, CheckCircle2, Gauge, BookOpen, Wrench, Anchor, Tractor } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Delay before showing the "continue in background" options (ms)
const BACKGROUND_OPTIONS_DELAY = 2000

const VEHICLE_STEPS: { text: string; Icon: LucideIcon }[] = [
  { text: 'Reading compliance plate…', Icon: ScanLine },
  { text: 'Identifying make and model…', Icon: Car },
  { text: 'Reading odometer…', Icon: Gauge },
  { text: 'Scanning for damage…', Icon: Search },
  { text: 'Looking up specifications…', Icon: BookOpen },
  { text: 'Generating description…', Icon: FileCheck },
]

const TRUCK_STEPS: { text: string; Icon: LucideIcon }[] = [
  { text: 'Reading compliance plate…', Icon: ScanLine },
  { text: 'Identifying make and model…', Icon: Car },
  { text: 'Reading odometer and hourmeter…', Icon: Gauge },
  { text: 'Scanning for damage…', Icon: Search },
  { text: 'Looking up specifications…', Icon: BookOpen },
  { text: 'Generating description…', Icon: FileCheck },
]

const EARTHMOVING_STEPS: { text: string; Icon: LucideIcon }[] = [
  { text: 'Reading make and model plate…', Icon: ScanLine },
  { text: 'Identifying machine type…', Icon: Wrench },
  { text: 'Reading hourmeter…', Icon: Gauge },
  { text: 'Scanning for wear and damage…', Icon: Search },
  { text: 'Looking up specifications…', Icon: BookOpen },
  { text: 'Generating description…', Icon: FileCheck },
]

const MARINE_STEPS: { text: string; Icon: LucideIcon }[] = [
  { text: 'Reading hull identification…', Icon: ScanLine },
  { text: 'Identifying make and model…', Icon: Anchor },
  { text: 'Checking engine details…', Icon: Wrench },
  { text: 'Scanning for damage…', Icon: Search },
  { text: 'Looking up specifications…', Icon: BookOpen },
  { text: 'Generating description…', Icon: FileCheck },
]

const AGRICULTURE_STEPS: { text: string; Icon: LucideIcon }[] = [
  { text: 'Reading make and model plate…', Icon: ScanLine },
  { text: 'Identifying machine type…', Icon: Tractor },
  { text: 'Reading hourmeter…', Icon: Gauge },
  { text: 'Scanning for wear and damage…', Icon: Search },
  { text: 'Looking up specifications…', Icon: BookOpen },
  { text: 'Generating description…', Icon: FileCheck },
]

const GENERAL_STEPS: { text: string; Icon: LucideIcon }[] = [
  { text: 'Reading labels and markings…', Icon: ScanLine },
  { text: 'Identifying type and model…', Icon: Car },
  { text: 'Scanning for damage…', Icon: Search },
  { text: 'Assessing overall condition…', Icon: ClipboardList },
  { text: 'Looking up specifications…', Icon: BookOpen },
  { text: 'Generating description…', Icon: FileCheck },
]

const STEP_INTERVAL = 3000 // 3s per step — 6 steps × 3s = 18s, within the 15–20s window
const FADE_DURATION = 250

interface ExtractionLoadingStateProps {
  assetType?: string
  onNavigateToAssets?: () => void
  onNavigateToNew?: () => void
}

function getStepsForAssetType(assetType: string | undefined) {
  switch (assetType) {
    case 'vehicle': return VEHICLE_STEPS
    case 'truck': return TRUCK_STEPS
    case 'earthmoving': return EARTHMOVING_STEPS
    case 'marine': return MARINE_STEPS
    case 'agriculture': return AGRICULTURE_STEPS
    default: return GENERAL_STEPS
  }
}

export function ExtractionLoadingState({ assetType, onNavigateToAssets, onNavigateToNew }: ExtractionLoadingStateProps) {
  const STEPS = getStepsForAssetType(assetType)
  const [stepIndex, setStepIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [showBackgroundOptions, setShowBackgroundOptions] = useState(false)
  const startRef = useRef(Date.now())

  // Cycle status messages with fade
  const stepIndexRef = useRef(0)
  useEffect(() => {
    const interval = setInterval(() => {
      if (stepIndexRef.current >= STEPS.length - 1) return  // stay on last step
      setVisible(false)
      setTimeout(() => {
        stepIndexRef.current += 1
        setStepIndex(stepIndexRef.current)
        setVisible(true)
      }, FADE_DURATION)
    }, STEP_INTERVAL)
    return () => clearInterval(interval)
  }, [STEPS.length])

  // Elapsed time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Show background navigation options after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setShowBackgroundOptions(true), BACKGROUND_OPTIONS_DELAY)
    return () => clearTimeout(timer)
  }, [])

  const { text: stepText, Icon: StepIcon } = STEPS[stepIndex]

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
          style={{ animation: 'spin 1.0s linear infinite' }}
        />
        {/* Counter-spinning inner ring */}
        <div
          className="absolute inset-[6px] rounded-full border border-transparent border-b-emerald-300/50"
          style={{ animation: 'spin 1.6s linear infinite reverse' }}
        />
        {/* Centre dot */}
        <div className="absolute inset-[10px] rounded-full bg-emerald-500/10 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Cycling status message */}
      <div className="min-h-[56px] flex flex-col items-center justify-center gap-1.5">
        <div
          className="flex items-center gap-2"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(4px)',
            transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease`,
          }}
        >
          <StepIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-white font-medium text-[15px] leading-snug">
            {stepText}
          </p>
        </div>
        <p className="text-sm text-white/40">
          Usually 15–20 seconds
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

      {/* Continue in background options */}
      {(onNavigateToAssets || onNavigateToNew) && (
        <div
          style={{
            opacity: showBackgroundOptions ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
          className="flex flex-col items-center gap-1.5"
          aria-hidden={!showBackgroundOptions}
        >
          <p className="text-xs text-white/30">Continue in background:</p>
          <div className="flex items-center gap-1 text-xs text-white/45">
            {onNavigateToAssets && (
              <button
                type="button"
                onClick={onNavigateToAssets}
                className="hover:text-white/70 transition-colors underline underline-offset-2"
              >
                Back to assets
              </button>
            )}
            {onNavigateToAssets && onNavigateToNew && (
              <span className="text-white/20">·</span>
            )}
            {onNavigateToNew && (
              <button
                type="button"
                onClick={onNavigateToNew}
                className="hover:text-white/70 transition-colors underline underline-offset-2"
              >
                Book in another asset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
