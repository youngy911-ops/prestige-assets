import { z } from 'zod'
import type { AssetType } from '@/lib/schema-registry/types'
import { getAIExtractableFields } from '@/lib/schema-registry'

const confidenceEnum = z.enum(['high', 'medium', 'low']).nullable()

export type ExtractedField = {
  value: string | null
  confidence: 'high' | 'medium' | 'low' | null
}

export type ExtractionResult = Record<string, ExtractedField>

export function buildExtractionSchema(assetType: AssetType) {
  const extractableFields = getAIExtractableFields(assetType)
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const fieldKey of extractableFields) {
    shape[fieldKey] = z.object({
      value: z.string().nullable().describe(
        `Extracted value for ${fieldKey}. Return null if not determinable from photos or notes.`
      ),
      confidence: confidenceEnum.describe(
        'high: clearly visible/readable. medium: inferred with uncertainty. low: uncertain guess. null: not found.'
      ),
    })
  }
  return z.object(shape)
}

export function buildSystemPrompt(assetType: string, subtype: string): string {
  return `You are an industrial asset identification AI for an Australian auction house.
Analyse the provided photos of a ${assetType} (${subtype}) and extract the requested fields.

Step 1 — Read everything visible:
- Read build plates, compliance plates, weight rating plates, cab cards, instrument clusters, VIN plates, and any other visible markings
- Extract odometer/hourmeter readings from instrument clusters
- Extract registration numbers from number plates
- Extract colour from the exterior photos

Step 2 — Use your knowledge to fill gaps:
- Once you have identified the Make, Model, and Year from photos, use your training knowledge to fill in fields that are standard for that specific vehicle
- For example: a 2011 MACK Granite has known engine options, GVM/GCM ratings, axle configurations, and transmission types — provide these as confidence "medium"
- For well-known vehicle models, infer: engine manufacturer, engine series, fuel type, drive type, gearbox make, axle configuration, suspension type, brake type, GVM, GCM
- Australian compliance dates can often be inferred from the build year for vehicles sold new in Australia

Rules:
- If a field value is not visible AND cannot be reasonably inferred from the identified vehicle, return null
- Do NOT fabricate specific serial numbers, VINs, or odometer readings — only infer standard manufacturer specs
- Return values exactly as they appear for directly-read fields
- For numeric fields (odometer, hourmeter), extract the number only, no units
- Confidence: "high" = directly read from photo, "medium" = inferred from vehicle knowledge, "low" = uncertain guess`
}

export function buildUserPrompt(
  inspectionNotes: string | null,
  structuredFields: Record<string, string>
): string {
  const parts: string[] = ['Please extract the requested fields from the photos.']

  const structuredEntries = Object.entries(structuredFields).filter(([, v]) => v.trim())
  if (structuredEntries.length > 0) {
    parts.push('\nStaff-provided field values (use these directly):')
    for (const [key, value] of structuredEntries) {
      parts.push(`  ${key}: ${value}`)
    }
  }

  if (inspectionNotes?.trim()) {
    parts.push(`\nAdditional inspection notes:\n${inspectionNotes.trim()}`)
  }

  return parts.join('\n')
}
