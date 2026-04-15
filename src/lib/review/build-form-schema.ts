import { z } from 'zod'
import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { AssetType } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

export type ReviewFormValues = Record<string, string>

/** Smart defaults for vehicle fields — used when no extraction or saved value exists */
const VEHICLE_SMART_DEFAULTS: Record<string, string> = {
  driveable: 'Yes',
  master_key: 'Yes',
  spare_key: 'No',
  owners_manual: 'No',
}

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
  savedFields: Record<string, string> = {},
  assetType?: AssetType
): Record<string, string> {
  const smartDefaults = assetType === 'vehicle' ? VEHICLE_SMART_DEFAULTS : {}
  const defaults: Record<string, string> = {}
  for (const field of fields) {
    defaults[field.key] =
      savedFields[field.key] ??
      extractionResult?.[field.key]?.value ??
      smartDefaults[field.key] ??
      ''
  }
  return defaults
}
