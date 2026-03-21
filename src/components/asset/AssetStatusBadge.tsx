import { cn } from '@/lib/utils'

interface AssetStatusBadgeProps {
  status: 'draft' | 'confirmed'
}

export function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 rounded-full',
        status === 'draft'
          ? 'bg-[#1E3A5F] text-white'
          : 'bg-white/15 text-white/65'
      )}
    >
      {status === 'draft' ? 'Draft' : 'Confirmed'}
    </span>
  )
}
