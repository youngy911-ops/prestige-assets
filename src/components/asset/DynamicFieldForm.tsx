'use client'
import type { Control } from 'react-hook-form'
import { FieldRow } from '@/components/asset/FieldRow'
import type { FieldDefinition, AssetType } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'
import type { ConfidenceLevel } from '@/components/asset/ConfidenceBadge'

const VEHICLE_SECTIONS: { maxOrder: number; label: string }[] = [
  { maxOrder: 9, label: 'Asset Information' },
  { maxOrder: 19, label: 'Vehicle Specifications' },
  { maxOrder: 27, label: 'Technical & Identification' },
  { maxOrder: 30, label: 'Operational & Logistics' },
  { maxOrder: 33, label: 'Damage' },
]

function getVehicleSection(sfOrder: number): string | undefined {
  for (const s of VEHICLE_SECTIONS) {
    if (sfOrder <= s.maxOrder) return s.label
  }
  return undefined
}

interface DynamicFieldFormProps {
  fields: FieldDefinition[]
  extractionResult: ExtractionResult | null
  control: Control<Record<string, string>>
  errors?: Record<string, { message?: string }>
  assetType?: AssetType
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
  assetType,
}: DynamicFieldFormProps) {
  const showSections = assetType === 'vehicle'
  let lastSection: string | undefined

  return (
    <div className="flex flex-col divide-y divide-white/10">
      {fields.map(field => {
        let sectionHeader: React.ReactNode = null
        if (showSections) {
          const section = getVehicleSection(field.sfOrder)
          if (section && section !== lastSection) {
            lastSection = section
            sectionHeader = (
              <div key={`section-${section}`} className="text-xs text-white/40 uppercase tracking-widest font-semibold pt-6 pb-2">
                {section}
              </div>
            )
          }
        }

        return (
          <div key={field.key}>
            {sectionHeader}
            <FieldRow
              field={field}
              confidence={getConfidenceLevel(field.key, extractionResult)}
              control={control}
              error={errors[field.key]?.message}
            />
          </div>
        )
      })}
    </div>
  )
}
