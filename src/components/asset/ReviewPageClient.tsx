'use client'
import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
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
  const router = useRouter()
  const fields = getFieldsSortedBySfOrder(assetType)
  const schema = buildFormSchema(fields)

  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(initialExtractionResult)
  const [checklistState, setChecklistState] = useState<Record<string, string>>(savedChecklistState)
  const [isExtracting, setIsExtracting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflictFields, setConflictFields] = useState<Array<{ key: string, aiValue: string, staffValue: string }>>([])
  const [pendingExtraction, setPendingExtraction] = useState<ExtractionResult | null>(null)
  const [reExtractionError, setReExtractionError] = useState(false)

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
    defaultValues: buildDefaultValues(fields, initialExtractionResult, savedFields, assetType),
  })

  // AI field input state
  const [aiInput, setAiInput] = useState('')
  const [aiSending, setAiSending] = useState(false)
  const [aiResult, setAiResult] = useState<{ count: number; error?: boolean } | null>(null)
  const aiInputRef = useRef<HTMLInputElement>(null)

  async function handleAiFields() {
    const msg = aiInput.trim()
    if (!msg || aiSending) return
    setAiSending(true)
    setAiResult(null)
    try {
      const res = await fetch('/api/ai-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, message: msg, assetType }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const updates: { key: string; value: string }[] = data.fields ?? []
      updates.forEach(({ key, value }) => setValue(key as keyof ReviewFormValues, value, { shouldDirty: true }))
      setAiInput('')
      setAiResult({ count: updates.length })
      setTimeout(() => setAiResult(null), 3000)
    } catch {
      setAiResult({ count: 0, error: true })
      setTimeout(() => setAiResult(null), 3000)
    } finally {
      setAiSending(false)
    }
  }

  // Only watch fields the checklist cares about — avoids re-rendering on every keystroke
  const checklistFieldKeys = fields
    .filter(f => f.required || f.inspectionPriority)
    .map(f => f.key)
  const watchedValues = watch(checklistFieldKeys)
  const watchedRecord = Object.fromEntries(checklistFieldKeys.map((k, i) => [k, watchedValues[i] ?? '']))

  // Recompute checklist from current form values
  const checklist: ChecklistEntry[] = buildChecklist(
    fields,
    extractionResult,
    watchedRecord,
    checklistState
  )

  const isSaveAllowed = canSave(checklist)
  const [isSaving, setIsSaving] = useState(false)

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
      setReExtractionError(true)
      setTimeout(() => setReExtractionError(false), 4000)
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

  // Build checklist state snapshot for saving
  function buildFinalChecklistState() {
    const state: Record<string, string> = {}
    for (const entry of checklist) {
      state[entry.field.key] = entry.status
    }
    return state
  }

  // Shared helper: fire saveReview, navigate optimistically, handle errors
  const executeSave = async (values: Record<string, string>) => {
    setSaveError(null)
    setIsSaving(true)
    // Navigate immediately — don't wait for the server round-trip
    router.push(`/assets/${assetId}/output`)
    const result = await saveReview(assetId, values, buildFinalChecklistState())
    if (result && 'error' in result) {
      // Navigation already fired — push back so the user sees the error
      router.back()
      const msg = result.error === 'Not authenticated'
        ? 'Session expired. Refresh the page and try again.'
        : 'Save failed. Check your connection and try again.'
      setSaveError(msg)
      setIsSaving(false)
    }
    // On success, server returned { redirectTo } and we already navigated — done.
  }

  // Full validated save (called by react-hook-form handleSubmit)
  const onSubmit = async (values: ReviewFormValues) => {
    await executeSave(values as Record<string, string>)
  }

  // Partial save — bypasses field validation, saves whatever is filled in
  const handleProceed = async () => {
    if (isSaving) return  // Guard against double-tap
    if (isSaveAllowed) {
      // All required fields present — use validated submit path
      handleSubmit(onSubmit)().catch(() => {})
      return
    }
    // Partial proceed — save whatever's filled in, staff can complete later
    const values = getValues() as Record<string, string>
    await executeSave(values)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleProceed() }} className="flex flex-col gap-0">
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
            Extraction found {conflictFields.length} field{conflictFields.length !== 1 ? 's' : ''} that differ from your edits.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-amber-500/40 text-amber-300 hover:bg-amber-900/30"
              onClick={() => applyExtraction(pendingExtraction, true)}
            >
              Use Extracted Values
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

      {/* AI field fill — type anything in plain English to fill fields instantly */}
      <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <p className="text-xs text-white/40 flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3 h-3 text-emerald-400/70 flex-shrink-0" />
          Tell the AI — it fills the fields below automatically
        </p>
        <div className="flex gap-2">
          <input
            ref={aiInputRef}
            type="text"
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAiFields() } }}
            placeholder="e.g. no keys, purple, 80000km, runs well"
            className="flex-1 h-9 rounded-xl border border-white/[0.12] bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
          />
          <button
            type="button"
            onClick={handleAiFields}
            disabled={aiSending || !aiInput.trim()}
            className="h-9 px-4 rounded-xl text-xs font-semibold text-emerald-200 bg-emerald-600/70 hover:bg-emerald-500/80 border border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            {aiSending ? '…' : 'Fill Fields'}
          </button>
        </div>
        {aiResult && (
          <p className={`text-xs mt-1.5 ${aiResult.error ? 'text-red-400' : aiResult.count === 0 ? 'text-white/40' : 'text-emerald-400'}`}>
            {aiResult.error ? 'Could not parse — try rephrasing' : aiResult.count === 0 ? 'Nothing matched — check the phrasing' : `✓ Updated ${aiResult.count} field${aiResult.count !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Field form — shown first so inputs are immediately visible */}
      <DynamicFieldForm
        fields={fields}
        extractionResult={extractionResult}
        control={control as any}
        errors={Object.fromEntries(
          Object.entries(errors).map(([k, v]) => [k, { message: v?.message }])
        )}
        assetType={assetType}
      />

      {/* Checklist — below the form as a guide for what still needs attention */}
      {checklist.length > 0 && <Separator className="my-6 bg-white/10" />}

      <MissingInfoChecklist
        checklist={checklist}
        onUpdate={handleChecklistUpdate}
      />

      {/* Sticky CTA — fixed bar so it's always visible regardless of scroll position */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-black/60 backdrop-blur-xl border-t border-white/[0.08]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 flex flex-col gap-2">
          {checklist.length > 0 && (() => {
            const done = checklist.filter(e => e.status !== 'flagged').length
            const total = checklist.length
            if (done >= total) return (
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400">All fields complete</span>
              </div>
            )
            return (
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500/60 transition-all duration-500"
                    style={{ width: `${(done / total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white/40 tabular-nums flex-shrink-0">{done}/{total}</span>
              </div>
            )
          })()}
          {saveError && (
            <p role="alert" className="text-sm text-red-400 text-center">{saveError}</p>
          )}
          {reExtractionError && (
            <p className="text-sm text-amber-400 text-center">Re-extraction failed — check your connection and try again.</p>
          )}
          {!isSaveAllowed && (
            <p className="text-xs text-amber-400/80 text-center">Some fields incomplete — you can still proceed and fill them in later</p>
          )}
          <Button
            type="button"
            onClick={handleProceed}
            disabled={isSaving}
            className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40"
          >
            {isSaving ? 'Saving…' : 'Save & Continue →'}
          </Button>
          <button
            type="button"
            className="text-xs text-white/60 hover:text-white border border-white/15 hover:border-white/30 rounded-lg text-center w-full py-2 transition-colors"
            onClick={triggerReExtraction}
            disabled={isExtracting}
          >
            {isExtracting ? 'Extracting…' : 'Re-run Extraction'}
          </button>
        </div>
      </div>
      {/* Spacer so form content isn't hidden behind the fixed bar */}
      <div className="h-32" />
    </form>
  )
}
