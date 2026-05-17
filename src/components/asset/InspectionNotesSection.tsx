'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInspectionPriorityFields } from '@/lib/schema-registry'
import { saveInspectionNotes } from '@/lib/actions/inspection.actions'
import type { AssetType } from '@/lib/schema-registry/types'
import { parseStructuredFields, extractFreeformNotes } from '@/lib/utils/parseStructuredFields'

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
  const notesRef = useRef<string>(extractFreeformNotes(initialNotes))
  const structuredValuesRef = useRef<Record<string, string>>(parseStructuredFields(initialNotes))

  const [aiInput, setAiInput] = useState('')
  const [aiSending, setAiSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const priorityFields = getInspectionPriorityFields(assetType)

  const buildCombinedNotes = useCallback((): string => {
    const structuredLines = Object.entries(structuredValuesRef.current)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
    return [
      ...structuredLines,
      notesRef.current.trim() ? `Notes: ${notesRef.current}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }, [])
  // No deps — reads only from stable refs

  const persistNotes = useCallback(() => {
    saveInspectionNotes(assetId, buildCombinedNotes())
  }, [assetId, buildCombinedNotes])

  const scheduleAutosave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(persistNotes, 500)
  }, [persistNotes])

  // Unmount flush — sendBeacon guarantees delivery even after page teardown (iOS back-button)
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      navigator.sendBeacon(
        '/api/inspection-notes',
        new Blob(
          [JSON.stringify({ assetId, notes: buildCombinedNotes() })],
          { type: 'application/json' }
        )
      )
    }
  }, [assetId, buildCombinedNotes])

  const handleStructuredChange = (key: string, value: string) => {
    structuredValuesRef.current = { ...structuredValuesRef.current, [key]: value }
    scheduleAutosave()
  }

  const handleNotesChange = (value: string) => {
    notesRef.current = value
    scheduleAutosave()
  }

  const handleAiSubmit = useCallback(async () => {
    const msg = aiInput.trim()
    if (!msg || aiSending) return
    setAiSending(true)
    try {
      const res = await fetch('/api/ai-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, message: msg, assetType }),
      })
      if (!res.ok) throw new Error('AI notes failed')
      const data = await res.json()
      // Update the textarea display with the updated notes from the server
      const newFreeform = extractFreeformNotes(data.notes)
      notesRef.current = newFreeform
      if (textareaRef.current) textareaRef.current.value = newFreeform
      setAiInput('')
    } catch {
      // silently fail — user can type notes manually
    } finally {
      setAiSending(false)
    }
  }, [aiInput, aiSending, assetId, assetType])

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
              <Select
                defaultValue={structuredValuesRef.current[field.key] ?? undefined}
                onValueChange={(value: string | null) => handleStructuredChange(field.key, value ?? '')}
              >
                <SelectTrigger
                  id={`field-${field.key}`}
                  className="h-9 text-sm bg-white/5 border-white/15 text-white focus:ring-emerald-500/50"
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
                defaultValue={structuredValuesRef.current[field.key] ?? ''}
                className="h-9 text-sm bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:ring-emerald-500/50"
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
            ref={textareaRef}
            className="w-full min-h-[80px] rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-y"
            placeholder="e.g. Bull bar, tow bar, alloy wheels, roof rack, canopy, snorkel, UHF, damage details, service history…"
            defaultValue={notesRef.current}
            onChange={(e) => handleNotesChange(e.target.value)}
          />
        </div>

        {/* Ask AI input */}
        <p className="text-xs text-white/30 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
          Tell the AI anything about this asset
        </p>
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAiSubmit() } }}
            placeholder="Describe this asset in plain English…"
            className="flex-1 h-8 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          />
          <button
            type="button"
            onClick={handleAiSubmit}
            disabled={aiSending || !aiInput.trim()}
            className="h-8 px-3 rounded-md text-xs font-medium text-white/70 hover:text-white border border-white/10 bg-emerald-600/20 hover:bg-emerald-600/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            {aiSending ? '…' : <><span className="text-emerald-400">AI</span><span className="text-white/50">→</span></>}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
