'use client'
import { useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInspectionPriorityFields } from '@/lib/schema-registry'
import { saveInspectionNotes } from '@/lib/actions/inspection.actions'
import type { AssetType } from '@/lib/schema-registry/types'

interface InspectionNotesSectionProps {
  assetId: string
  assetType: AssetType
  initialNotes: string | null
}

// Placeholder text per field key — field-specific hints
const FIELD_PLACEHOLDERS: Record<string, string> = {
  odometer: 'e.g. 187,450',
  hourmeter: 'e.g. 4,200',
  hours: 'e.g. 4,200',
  registration_number: 'e.g. 123ABC',
  registration_expiry: 'e.g. 30/06/2025',
  registration: 'e.g. 123ABC',
  service_history: 'e.g. Full log books',
  tare: 'e.g. 5,200',
  atm: 'e.g. 12,500',
  hubometer: 'e.g. 340,000',
  pin: 'e.g. CAT0320BXYZ',
  serial: 'e.g. 1234567',
  vin: 'e.g. 1HGCM82633A123456',
  max_lift_capacity: 'e.g. 3,000 kg',
  suspension: 'Select suspension type',
  truck_weight: 'e.g. 4,500 kg',
  max_lift_height: 'e.g. 4,500 mm',
  trailer_length: 'e.g. 20 ft',
}

export function InspectionNotesSection({
  assetId,
  assetType,
  initialNotes,
}: InspectionNotesSectionProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notesRef = useRef<string>(initialNotes ?? '')
  const structuredValuesRef = useRef<Record<string, string>>({})

  const priorityFields = getInspectionPriorityFields(assetType)

  const persistNotes = useCallback(() => {
    // Combine structured field values and freeform notes into a single inspection_notes string
    const structuredLines = Object.entries(structuredValuesRef.current)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
    const combined = [
      ...structuredLines,
      notesRef.current.trim() ? `Notes: ${notesRef.current}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    saveInspectionNotes(assetId, combined)
  }, [assetId])

  const scheduleAutosave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(persistNotes, 500)
  }, [persistNotes])

  const handleStructuredChange = (key: string, value: string) => {
    structuredValuesRef.current = { ...structuredValuesRef.current, [key]: value }
    scheduleAutosave()
  }

  const handleNotesChange = (value: string) => {
    notesRef.current = value
    scheduleAutosave()
  }

  return (
    <Card className="bg-[var(--card)] border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white">Inspection Notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {priorityFields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <Label
              htmlFor={`field-${field.key}`}
              className="text-xs text-white/65"
            >
              {field.label}
            </Label>
            {field.inputType === 'select' ? (
              <Select onValueChange={(value: string | null) => handleStructuredChange(field.key, value ?? '')}>
                <SelectTrigger
                  id={`field-${field.key}`}
                  className="h-9 text-sm bg-white/5 border-white/15 text-white focus:ring-[oklch(0.29_0.07_248)]"
                >
                  <SelectValue placeholder={FIELD_PLACEHOLDERS[field.key] ?? `Select ${field.label}`} className="placeholder:text-white/30" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`field-${field.key}`}
                className="h-9 text-sm bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:ring-[oklch(0.29_0.07_248)]"
                placeholder={FIELD_PLACEHOLDERS[field.key] ?? ''}
                onChange={(e) => handleStructuredChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <Label htmlFor="other-notes" className="text-xs text-white/65">
            Other notes
          </Label>
          <textarea
            id="other-notes"
            className="w-full min-h-[80px] rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[oklch(0.29_0.07_248)] resize-y"
            placeholder="VIN, rego, dimensions, body builder, service history, number of keys, condition notes…"
            defaultValue={initialNotes ?? ''}
            onChange={(e) => handleNotesChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
