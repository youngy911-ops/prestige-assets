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

Rules:
- Read build plates, compliance plates, weight rating plates, cab cards, instrument clusters, and any other visible markings
- When make/model/year are clearly identified, you may use your training knowledge to infer manufacturer specifications (weight ratings, engine specs) — mark these as confidence "medium"
- If a field value is not visible or determinable from the photos and notes, return null for both value and confidence
- Do NOT guess or fabricate values — accuracy is more important than completeness
- Return values exactly as they appear (do not reformat serials, VINs, etc.)
- For numeric fields (odometer, hourmeter), extract the number only, no units`
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
