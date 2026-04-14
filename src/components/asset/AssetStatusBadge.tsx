import { cn } from '@/lib/utils'

interface AssetStatusBadgeProps {
  status: 'draft' | 'confirmed'
}

export function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  return (
    <span
      className={cn(
        'text-[11px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide',
        status === 'draft'
          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
      )}
    >
      {status === 'draft' ? 'Draft' : 'Confirmed'}
    </span>
  )
}
