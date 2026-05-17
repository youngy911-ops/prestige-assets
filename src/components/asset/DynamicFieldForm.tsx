'use client'
import type { Control } from 'react-hook-form'
import { FieldRow } from '@/components/asset/FieldRow'
import type { FieldDefinition, AssetType } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'
import type { ConfidenceLevel } from '@/components/asset/ConfidenceBadge'

const SECTION_MAP: Partial<Record<string, { maxOrder: number; label: string }[]>> = {
  vehicle: [
    { maxOrder: 9,  label: 'Asset Information' },
    { maxOrder: 19, label: 'Vehicle Specifications' },
    { maxOrder: 27, label: 'Technical & Identification' },
    { maxOrder: 30, label: 'Operational & Logistics' },
    { maxOrder: 39, label: 'Damage & Condition' },
  ],
  truck: [
    { maxOrder: 5,  label: 'Identification' },
    { maxOrder: 14, label: 'Engine & Drivetrain' },
    { maxOrder: 21, label: 'Registration & Body' },
    { maxOrder: 28, label: 'Technical Specs' },
    { maxOrder: 99, label: 'Weights & Extras' },
  ],
  earthmoving: [
    { maxOrder: 8,  label: 'Identification' },
    { maxOrder: 15, label: 'Engine & Performance' },
    { maxOrder: 20, label: 'Drivetrain' },
    { maxOrder: 28, label: 'Configuration' },
    { maxOrder: 99, label: 'Weights & Specs' },
  ],
  forklift: [
    { maxOrder: 5,  label: 'Identification & Powertrain' },
    { maxOrder: 12, label: 'Capacity & Details' },
    { maxOrder: 19, label: 'Specifications' },
    { maxOrder: 99, label: 'Mast & Type' },
  ],
}

function getSection(assetType: string, sfOrder: number): string | undefined {
  const sections = SECTION_MAP[assetType]
  if (!sections) return undefined
  for (const s of sections) {
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
  const showSections = assetType != null && assetType in SECTION_MAP
  let lastSection: string | undefined

  return (
    <div className="flex flex-col divide-y divide-white/10">
      {fields.map(field => {
        let sectionHeader: React.ReactNode = null
        if (showSections && assetType) {
          const section = getSection(assetType, field.sfOrder)
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
