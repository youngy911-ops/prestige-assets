import { z } from 'zod'
import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

export type ReviewFormValues = Record<string, string>

export function buildFormSchema(fields: FieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    shape[field.key] = field.inputType === 'number'
      ? z.string().regex(/^\d*$/, 'Must be a number').or(z.literal(''))
      : z.string()
  }
  return z.object(shape)
}

export function buildDefaultValues(
  fields: FieldDefinition[],
  extractionResult: ExtractionResult | null,
  savedFields: Record<string, string> = {}
): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const field of fields) {
    defaults[field.key] =
      savedFields[field.key] ??
      extractionResult?.[field.key]?.value ??
      ''
  }
  return defaults
}
