'use client'
import type { Control } from 'react-hook-form'
import { FieldRow } from '@/components/asset/FieldRow'
import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'
import type { ConfidenceLevel } from '@/components/asset/ConfidenceBadge'

interface DynamicFieldFormProps {
  fields: FieldDefinition[]
  extractionResult: ExtractionResult | null
  control: Control<Record<string, string>>
  errors?: Record<string, { message?: string }>
}

function getConfidenceLevel(
  fieldKey: string,
  extractionResult: ExtractionResult | null
): ConfidenceLevel {
  if (!extractionResult) return 'not_found'
  const extracted = extractionResult[fieldKey]
  if (!extracted || extracted.value === null) return 'not_found'
  if (extracted.confidence === null) return 'not_found'
  return extracted.confidence as ConfidenceLevel
}

export function DynamicFieldForm({
  fields,
  extractionResult,
  control,
  errors = {},
}: DynamicFieldFormProps) {
  return (
    <div className="flex flex-col divide-y divide-white/10">
      {fields.map(field => (
        <FieldRow
          key={field.key}
          field={field}
          confidence={getConfidenceLevel(field.key, extractionResult)}
          control={control}
          error={errors[field.key]?.message}
        />
      ))}
    </div>
  )
}
