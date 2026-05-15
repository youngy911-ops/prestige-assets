import { cn } from '@/lib/utils'
import type { AssetStatus } from '@/lib/actions/asset.actions'

const BADGE_CONFIG: Record<AssetStatus, { label: string; className: string; dot?: boolean }> = {
  draft: {
    label: 'Draft',
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  },
  reviewed: {
    label: 'Reviewed',
    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 font-bold',
    dot: true,
  },
}

interface AssetStatusBadgeProps {
  status: AssetStatus
}

export function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  const config = BADGE_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide',
        config.className
      )}
    >
      {config.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
      {config.label}
    </span>
  )
}
