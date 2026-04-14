'use client'
import { useEffect, useState } from 'react'

const STEPS = [
  'Scanning photos…',
  'Reading build plate…',
  'Identifying make & model…',
  'Extracting specifications…',
  'Applying asset details…',
  'Finalising data…',
]

export function ExtractionLoadingState() {
  const [stepIndex, setStepIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setStepIndex(i => (i + 1) % STEPS.length)
        setVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center gap-5 py-12 text-center">
      {/* Pulsing ring */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
        <div className="absolute inset-[6px] rounded-full bg-emerald-500/10 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Cycling status message */}
      <div className="min-h-[48px] flex flex-col items-center justify-center gap-1">
        <p
          className="text-white font-medium text-[15px] transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {STEPS[stepIndex]}
        </p>
        <p className="text-sm text-white/40">
          Usually 10–20 seconds
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i === stepIndex ? 'rgb(52 211 153)' : 'rgba(255,255,255,0.12)',
              transform: i === stepIndex ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
