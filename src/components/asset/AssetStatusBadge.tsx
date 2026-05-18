import { cn } from '@/lib/utils'
import type { AssetStatus } from '@/lib/actions/asset.actions'

const BADGE_CONFIG: Record<AssetStatus, { label: string; className: string; dot?: boolean; title?: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    title: 'Awaiting extraction',
  },
  reviewed: {
    label: 'Reviewed',
    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    title: 'Fields reviewed and saved',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold shadow-[0_0_8px_rgba(52,211,153,0.2)]',
    dot: true,
    title: 'Copied to clipboard',
  },
}

interface AssetStatusBadgeProps {
  status: AssetStatus
}

export function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  const config = BADGE_CONFIG[status]
  return (
    <span
      title={config.title}
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide',
        config.className
      )}
    >
      {config.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />}
      {config.label}
    </span>
  )
}
