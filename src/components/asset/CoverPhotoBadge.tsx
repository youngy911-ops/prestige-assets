// UI element — no 'use client' needed (purely presentational, used inside client component)
import { Badge } from '@/components/ui/badge'

export function CoverPhotoBadge() {
  return (
    <Badge
      variant="secondary"
      className="absolute top-1 left-1 text-xs px-1.5 py-0 h-5 border border-emerald-500/40 bg-emerald-600/80 text-white"
    >
      Cover
    </Badge>
  )
}
