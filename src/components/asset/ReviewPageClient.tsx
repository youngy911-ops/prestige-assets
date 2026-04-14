'use client'
import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { DynamicFieldForm } from '@/components/asset/DynamicFieldForm'
import { MissingInfoChecklist } from '@/components/asset/MissingInfoChecklist'
import { InspectionNotesSection } from '@/components/asset/InspectionNotesSection'
import { saveReview } from '@/lib/actions/review.actions'
import { getFieldsSortedBySfOrder } from '@/lib/schema-registry'
import { buildFormSchema, buildDefaultValues, type ReviewFormValues } from '@/lib/review/build-form-schema'
import { buildChecklist, canSave, type ChecklistEntry, type ChecklistStatus } from '@/lib/review/build-checklist'
import type { AssetType } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

interface ReviewPageClientProps {
  assetId: string
  assetType: AssetType
  extractionResult: ExtractionResult | null
  savedFields: Record<string, string>
  savedChecklistState: Record<string, string>
  inspectionNotes: string | null
  duplicateWarning?: { id: string; asset_type: string; asset_subtype: string | null } | null
}

export function ReviewPageClient({
  assetId,
  assetType,
  extractionResult: initialExtractionResult,
  savedFields,
  savedChecklistState,
  inspectionNotes,
  duplicateWarning,
}: ReviewPageClientProps) {
  const fields = getFieldsSortedBySfOrder(assetType)
  const schema = buildFormSchema(fields)

  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(initialExtractionResult)
  const [checklistState, setChecklistState] = useState<Record<string, string>>(savedChecklistState)
  const [isExtracting, setIsExtracting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflictFields, setConflictFields] = useState<Array<{ key: string, aiValue: string, staffValue: string }>>([])
  const [pendingExtraction, setPendingExtraction] = useState<ExtractionResult | null>(null)

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ReviewFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: buildDefaultValues(fields, initialExtractionResult, savedFields),
  })

  const watchedValues = watch()

  // Recompute checklist from current form values
  const checklist: ChecklistEntry[] = buildChecklist(
    fields,
    extractionResult,
    watchedValues,
    checklistState
  )

  const isSaveAllowed = canSave(checklist)

  // Update a checklist item's status
  const handleChecklistUpdate = useCallback((fieldKey: string, status: ChecklistStatus) => {
    setChecklistState(prev => ({ ...prev, [fieldKey]: status }))
  }, [])

  // Re-extraction
  const triggerReExtraction = useCallback(async () => {
    setIsExtracting(true)
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json()
      const newResult: ExtractionResult = data.extraction_result

      // Find conflicts between AI values and dirty (staff-edited) fields
      const conflicts = fields
        .filter(field => {
          const isDirty = dirtyFields[field.key]
          const aiValue = newResult[field.key]?.value ?? ''
          const staffValue = getValues(field.key)
          return isDirty && aiValue !== '' && aiValue !== staffValue
        })
        .map(field => ({
          key: field.key,
          aiValue: newResult[field.key]?.value ?? '',
          staffValue: getValues(field.key),
        }))

      if (conflicts.length > 0) {
        setConflictFields(conflicts)
        setPendingExtraction(newResult)
      } else {
        // No conflicts — apply new extraction to clean fields
        applyExtraction(newResult, false)
      }
    } catch {
      // Extraction failed silently — staff can retry
    } finally {
      setIsExtracting(false)
    }
  }, [assetId, fields, dirtyFields, getValues])

  function applyExtraction(result: ExtractionResult, acceptAIForDirty: boolean) {
    for (const field of fields) {
      const aiValue = result[field.key]?.value
      if (aiValue == null) continue
      const isDirty = dirtyFields[field.key]
      if (!isDirty || acceptAIForDirty) {
        setValue(field.key, aiValue, { shouldDirty: false })
      }
    }
    setExtractionResult(result)
    setPendingExtraction(null)
    setConflictFields([])
  }

  // Save
  const onSubmit = async (values: ReviewFormValues) => {
    setSaveError(null)
    // Build final checklist state: merge current computed checklist with saved state
    const finalChecklistState: Record<string, string> = {}
    for (const entry of checklist) {
      finalChecklistState[entry.field.key] = entry.status
    }

    const result = await saveReview(assetId, values, finalChecklistState)
    if (result && 'error' in result) {
      const msg = result.error === 'Not authenticated'
        ? 'Session expired. Refresh the page and try again.'
        : `Save failed: ${result.error}. Check your connection and try again.`
      setSaveError(msg)
    }
    // On success, saveReview calls redirect() internally — no further action needed
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">
      {/* Duplicate detection banner */}
      {duplicateWarning && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 flex items-start gap-3">
          <span className="text-red-400 text-lg leading-none mt-0.5">⚠</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300">Possible duplicate detected</p>
            <p className="text-xs text-red-300/70 mt-0.5">
              Another asset with this VIN / serial number already exists.{' '}
              <a
                href={`/assets/${duplicateWarning.id}/review`}
                className="underline hover:text-red-300 transition-colors"
              >
                View existing record →
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Re-extraction notes section */}
      <div className="mb-6">
        <InspectionNotesSection
          assetId={assetId}
          assetType={assetType}
          initialNotes={inspectionNotes}
        />
      </div>

      {/* Conflict banner */}
      {conflictFields.length > 0 && pendingExtraction && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-900/20 p-4 flex flex-col gap-3">
          <p className="text-sm text-amber-300">
            Extraction found new values — {conflictFields.length} field(s) differ from your edits.
            Accept all AI values or keep your edits.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-amber-500/40 text-amber-300 hover:bg-amber-900/30"
              onClick={() => applyExtraction(pendingExtraction, true)}
            >
              Use AI Values
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/15 text-white/65 hover:text-white"
              onClick={() => { setPendingExtraction(null); setConflictFields([]) }}
            >
              Keep My Edits
            </Button>
          </div>
        </div>
      )}

      {/* Field form */}
      {!initialExtractionResult && !extractionResult && (
        <p className="text-sm text-white/50 mb-4">
          No extraction data available. You can still fill in fields manually.
        </p>
      )}

      {/* Checklist — shown first so user sees what needs attention before scrolling through fields */}
      <MissingInfoChecklist
        checklist={checklist}
        onUpdate={handleChecklistUpdate}
      />

      {checklist.length > 0 && <Separator className="my-6 bg-white/10" />}

      <DynamicFieldForm
        fields={fields}
        extractionResult={extractionResult}
        control={control as any}
        errors={Object.fromEntries(
          Object.entries(errors).map(([k, v]) => [k, { message: v?.message }])
        )}
      />

      {/* Sticky CTA */}
      <div className="sticky bottom-0 bg-[var(--background)] pt-3 pb-2 flex flex-col gap-2">
        {saveError && (
          <p className="text-sm text-red-400 text-center">{saveError}</p>
        )}
        {!isSaveAllowed && (
          <p className="text-xs text-white/50 text-center">Resolve required fields before saving.</p>
        )}
        <Button
          type="submit"
          className="w-full h-11"
          disabled={!isSaveAllowed}
        >
          Save & Continue
        </Button>
        <button
          type="button"
          className="text-sm text-white/50 hover:text-white text-center w-full py-1 transition-colors"
          onClick={triggerReExtraction}
          disabled={isExtracting}
        >
          {isExtracting ? 'Extracting…' : 'Re-run Extraction'}
        </button>
      </div>
    </form>
  )
}
