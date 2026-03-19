'use client'
import { CheckCircle2, MinusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ChecklistEntry, ChecklistStatus } from '@/lib/review/build-checklist'

interface ChecklistItemProps {
  entry: ChecklistEntry
  onUpdate: (fieldKey: string, status: ChecklistStatus) => void
}

export function ChecklistItem({ entry, onUpdate }: ChecklistItemProps) {
  const { field, isBlocking, status } = entry

  if (status === 'confirmed') {
    return (
      <div className="flex items-center gap-2 py-3">
        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
        <span className="text-sm text-white/65">{field.label}</span>
        <span className="text-xs text-green-400 ml-auto">Confirmed</span>
      </div>
    )
  }

  if (status === 'unknown') {
    return (
      <div className="flex items-center gap-2 py-3">
        <MinusCircle className="w-4 h-4 text-white/40 flex-shrink-0" />
        <span className="text-sm text-white/65">{field.label}</span>
        <span className="text-xs text-white/40 ml-auto">Unknown / not available</span>
      </div>
    )
  }

  if (status === 'dismissed-na') {
    return (
      <div className="flex items-center gap-2 py-3">
        <MinusCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
        <span className="text-sm text-white/30">{field.label}</span>
        <span className="text-xs text-white/30 ml-auto">Not applicable</span>
      </div>
    )
  }

  // flagged state
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center gap-2">
        {isBlocking ? (
          <Badge className="bg-red-900/40 text-red-300 border-red-700/40 text-xs">Required</Badge>
        ) : (
          <span className="text-xs text-white/50">Optional</span>
        )}
        <span className="text-sm text-white">{field.label}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {!isBlocking && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px] text-xs border-white/15 text-white/65 hover:text-white"
            onClick={() => onUpdate(field.key, 'dismissed-na')}
          >
            Not applicable
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-[44px] text-xs border-white/15 text-white/65 hover:text-white"
          onClick={() => onUpdate(field.key, 'unknown')}
        >
          Unknown / not available
        </Button>
      </div>
    </div>
  )
}
