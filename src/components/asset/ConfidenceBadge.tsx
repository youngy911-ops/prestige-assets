'use client'
import { CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react'

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
}

const config: Record<ConfidenceLevel, { icon: React.ElementType; className: string; srLabel: string; label: string }> = {
  high: {
    icon: CheckCircle2,
    className: 'text-green-400',
    srLabel: 'Read from photo',
    label: 'From photo',
  },
  medium: {
    icon: AlertCircle,
    className: 'text-amber-400',
    srLabel: 'Inferred from model knowledge',
    label: 'Inferred',
  },
  low: {
    icon: MinusCircle,
    className: 'text-white/40',
    srLabel: 'Uncertain — verify before saving',
    label: 'Uncertain',
  },
  not_found: {
    icon: MinusCircle,
    className: 'text-white/40',
    srLabel: 'Not found in photos',
    label: 'Not found',
  },
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const { icon: Icon, className, srLabel, label } = config[level]
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${className}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      <span className="sr-only">{srLabel}</span>
      <span aria-hidden="true">{label}</span>
    </span>
  )
}
