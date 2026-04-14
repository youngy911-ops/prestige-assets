import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'
import { isBlocking } from './blocking-fields'

export type ChecklistStatus = 'flagged' | 'dismissed-na' | 'confirmed' | 'unknown'

export type ChecklistEntry = {
  field: FieldDefinition
  isBlocking: boolean
  status: ChecklistStatus
}

export function buildChecklist(
  fields: FieldDefinition[],
  extractionResult: ExtractionResult | null,
  currentValues: Record<string, string>,
  savedState: Record<string, string> = {}
): ChecklistEntry[] {
  return fields
    .filter(field => {
      // Only surface fields worth drawing attention to — required fields or
      // ones the inspector specifically needs to check (inspectionPriority).
      // Non-required, non-priority fields can be filled in the form below
      // but shouldn't clutter the checklist.
      if (!field.required && !field.inspectionPriority) return false

      const extracted = extractionResult?.[field.key]
      const hasConfidentValue =
        extracted?.value != null &&
        extracted.confidence !== 'low' &&
        extracted.confidence !== null
      const hasCurrentValue = (currentValues[field.key] ?? '').trim() !== ''
      return !hasConfidentValue && !hasCurrentValue
    })
    .map(field => ({
      field,
      isBlocking: isBlocking(field.key),
      status: (savedState[field.key] as ChecklistStatus) ?? 'flagged',
    }))
}

export function canSave(checklist: ChecklistEntry[]): boolean {
  return checklist
    .filter(e => e.isBlocking)
    .every(e => e.status !== 'flagged')
}
