import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'photos', label: 'Photos' },
  { key: 'extract', label: 'AI Extract' },
  { key: 'review', label: 'Review' },
  { key: 'output', label: 'Output' },
]

interface StepIndicatorProps {
  current: 'photos' | 'extract' | 'review' | 'output'
}

export function StepIndicator({ current }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.key === current)

  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex
        const isActive = i === currentIndex

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all',
                isDone  && 'bg-emerald-500 text-white',
                isActive && 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-400',
                !isDone && !isActive && 'bg-white/[0.06] text-white/30'
              )}>
                {isDone ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              </div>
              <span className={cn(
                'text-[10px] font-medium whitespace-nowrap',
                isActive ? 'text-emerald-400' : isDone ? 'text-white/50' : 'text-white/25'
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-1.5 mb-4',
                isDone ? 'bg-emerald-500/40' : 'bg-white/[0.08]'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
