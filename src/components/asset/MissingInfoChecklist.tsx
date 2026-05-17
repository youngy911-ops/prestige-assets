'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChecklistItem } from '@/components/asset/ChecklistItem'
import type { ChecklistEntry, ChecklistStatus } from '@/lib/review/build-checklist'

interface MissingInfoChecklistProps {
  checklist: ChecklistEntry[]
  onUpdate: (fieldKey: string, status: ChecklistStatus) => void
}

export function MissingInfoChecklist({ checklist, onUpdate }: MissingInfoChecklistProps) {
  if (checklist.length === 0) return null

  return (
    <Card className="bg-white/[0.02] border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-bold tracking-tight text-white">Fields Still Needed</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        <p className="text-sm text-white/50 mb-4">
          Fill in above, or mark N/A to proceed.
        </p>
        <div className="flex flex-col divide-y divide-white/10">
          {checklist.map(entry => (
            <ChecklistItem
              key={entry.field.key}
              entry={entry}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
