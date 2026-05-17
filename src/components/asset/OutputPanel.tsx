'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Copy, Check, AlertTriangle, Sparkles } from 'lucide-react'
import { FieldsBlock } from '@/components/asset/FieldsBlock'
import { DescriptionBlock } from '@/components/asset/DescriptionBlock'
import { markAssetConfirmed } from '@/lib/actions/asset.actions'

type Tone = 'standard' | 'quick'

/** Colour-coded badge class for condition rating values (exported for tests) */
export function conditionBadgeClass(value: string): string {
  const v = value.toLowerCase()
  if (v === 'excellent') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
  if (v === 'good')      return 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
  if (v === 'fair')      return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
  if (v === 'poor')      return 'bg-red-500/20 text-red-300 border border-red-500/30'
  // Rust-specific values
  if (v === 'nil')       return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
  if (v === 'surface')   return 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
  if (v === 'minor')     return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
  if (v === 'major')     return 'bg-red-500/20 text-red-300 border border-red-500/30'
  return 'bg-white/10 text-white/70 border border-white/10'
}

/** Parse a single damage_notes line ("Panel - Description") into parts (exported for tests) */
export function parseDamageLine(line: string): { panel: string; desc: string } {
  const dashIdx = line.indexOf(' - ')
  if (dashIdx === -1) return { panel: line.trim(), desc: '' }
  return { panel: line.slice(0, dashIdx).trim(), desc: line.slice(dashIdx + 3).trim() }
}

interface OutputPanelProps {
  assetId: string
  assetType: string
  fields: Record<string, string>
  fieldsText: string           // Pre-computed by server page — always available immediately
  initialDescription: string | null  // null = generate; non-null = cached from DB
  photoUrls: string[]
  extractionResult?: Record<string, { value: string | null; confidence: 'high' | 'medium' | 'low' | null }> | null
}

type DescriptionState = 'loading' | 'ready' | 'error'

/** Derive stats from extraction_result and fields for the stats strip */
function deriveStats(
  fields: Record<string, string>,
  extractionResult: Record<string, { value: string | null; confidence: 'high' | 'medium' | 'low' | null }> | null | undefined
): { fieldCount: number; confidenceLabel: string; confidenceColor: string } {
  const fieldCount = Object.keys(fields).filter(k => fields[k]).length

  if (!extractionResult) {
    return { fieldCount, confidenceLabel: 'Ready to paste', confidenceColor: 'text-emerald-400' }
  }

  const entries = Object.values(extractionResult).filter(v => v?.value != null)
  const highCount = entries.filter(v => v.confidence === 'high').length
  const mediumCount = entries.filter(v => v.confidence === 'medium').length
  const total = entries.length

  if (total === 0) {
    return { fieldCount, confidenceLabel: 'Ready to paste', confidenceColor: 'text-emerald-400' }
  }

  const highRatio = highCount / total
  if (highRatio >= 0.7) {
    return { fieldCount, confidenceLabel: 'High confidence', confidenceColor: 'text-emerald-400' }
  } else if ((highCount + mediumCount) / total >= 0.5) {
    return { fieldCount, confidenceLabel: 'Medium confidence', confidenceColor: 'text-amber-400' }
  } else {
    return { fieldCount, confidenceLabel: 'Low confidence', confidenceColor: 'text-red-400' }
  }
}

export function OutputPanel({ assetId, assetType, fields, fieldsText, initialDescription, photoUrls, extractionResult }: OutputPanelProps) {
  const [heroIndex, setHeroIndex] = useState(0)
  const [descState, setDescState] = useState<DescriptionState>(
    initialDescription ? 'ready' : 'loading'
  )
  const [descText, setDescText] = useState<string>(initialDescription ?? '')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [tone, setTone] = useState<Tone>('standard')
  // Increment to force DescriptionBlock remount after regeneration — resets edit state
  const [descKey, setDescKey] = useState(0)
  // Track the latest description text (including user edits) for Copy All
  const currentDescRef = useRef<string>(initialDescription ?? '')
  const [allCopied, setAllCopied] = useState(false)
  const [slowWarning, setSlowWarning] = useState(false)
  const [showRetryButton, setShowRetryButton] = useState(false)
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => { return () => { isMountedRef.current = false } }, [])

  const handleDescTextChange = useCallback((text: string) => {
    currentDescRef.current = text
  }, [])

  async function handleCopyAll() {
    // fieldsText already includes all Salesforce fields (condition + damage via sfOrder)
    const combined = `${fieldsText}\n\n${currentDescRef.current}`
    await navigator.clipboard.writeText(combined)
    setAllCopied(true)
    setTimeout(() => setAllCopied(false), 2000)
    markAssetConfirmed(assetId).catch(() => {})
  }

  // Start/clear the slow-warning and retry-button timers whenever loading begins or ends
  useEffect(() => {
    if (descState === 'loading') {
      setSlowWarning(false)
      setShowRetryButton(false)
      slowTimerRef.current = setTimeout(() => setSlowWarning(true), 20_000)
      retryTimerRef.current = setTimeout(() => setShowRetryButton(true), 35_000)
    } else {
      if (slowTimerRef.current) { clearTimeout(slowTimerRef.current); slowTimerRef.current = null }
      if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null }
      setSlowWarning(false)
      setShowRetryButton(false)
    }
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [descState])

  // Auto-generate on mount; also silently fix stale cached descriptions
  useEffect(() => {
    if (!initialDescription) {
      generateDescription(false, tone)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function generateDescription(isRetry: boolean, currentTone: Tone) {
    try {
      const res = await fetch('/api/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, tone: currentTone }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (!isMountedRef.current) return
      setDescText(data.description)
      currentDescRef.current = data.description
      setDescState('ready')
    } catch {
      if (!isMountedRef.current) return
      if (!isRetry) {
        await generateDescription(true, currentTone)
      } else {
        setDescState('error')
      }
    }
  }

  const [confirmingRegen, setConfirmingRegen] = useState(false)

  async function handleRegenerate(currentText: string, hasEdited: boolean) {
    if (hasEdited && !confirmingRegen) {
      setConfirmingRegen(true)
      return
    }
    setConfirmingRegen(false)
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, tone }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setDescText(data.description)
      currentDescRef.current = data.description
      setDescKey(k => k + 1)  // Force DescriptionBlock remount — resets hasEdited
    } catch {
      // Regeneration failed — keep existing text, don't show error
    } finally {
      setIsRegenerating(false)
    }
  }

  async function handleToneChange(newTone: Tone) {
    if (newTone === tone) return
    setTone(newTone)
    setDescState('loading')
    setDescText('')
    setDescKey(k => k + 1)
    await generateDescription(false, newTone)
  }

  const stats = deriveStats(fields, extractionResult)

  return (
    <div className="flex flex-col gap-6">
      {/* Photo gallery */}
      {photoUrls.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Hero photo */}
          <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
            <div className="aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrls[heroIndex]}
                alt={`Asset photo ${heroIndex + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Photo count badge */}
            {photoUrls.length > 1 && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                <Camera className="h-3 w-3" />
                {heroIndex + 1} of {photoUrls.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {photoUrls.length > 1 && (
            <div className="flex items-center gap-2 px-1">
              {photoUrls.slice(0, 5).map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setHeroIndex(i)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                    i === heroIndex
                      ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-background'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Thumbnail ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {photoUrls.length > 5 && (
                <span className="text-xs text-white/40 ml-1">+{photoUrls.length - 5} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats strip — key extraction numbers at a glance */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-white tabular-nums">{stats.fieldCount}</span>
          <span className="text-xs text-white/40">fields extracted</span>
        </div>
        <div className="w-px h-4 bg-white/[0.08]" />
        <span className={`text-xs font-medium ${stats.confidenceColor}`}>{stats.confidenceLabel}</span>
      </div>

      {/* Copy All — one-click copy of fields + description for Salesforce */}
      {descState === 'ready' && (
        <button
          type="button"
          onClick={handleCopyAll}
          className={`w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 ${
            allCopied
              ? 'bg-emerald-500 scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/30 ring-offset-1 ring-offset-background'
              : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]'
          }`}
        >
          {allCopied ? <Check className="h-5 w-5" /> : <Copy className="h-4 w-4" />}
          {allCopied ? 'Copied to Clipboard!' : 'Copy All to Clipboard'}
        </button>
      )}

      {/* Fields block — always visible immediately */}
      <FieldsBlock fieldsText={fieldsText} />

      {/* Tone selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40 mr-1">Description style:</span>
        <div className="flex rounded-lg border border-white/[0.10] bg-white/[0.03] p-0.5">
          {(['standard', 'quick'] as Tone[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleToneChange(t)}
              disabled={isRegenerating || descState === 'loading'}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize disabled:opacity-40 ${
                tone === t
                  ? 'bg-emerald-600 text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t === 'standard' ? 'Standard' : 'Quick'}
            </button>
          ))}
        </div>
        {tone === 'quick' && (
          <span className="text-xs text-white/30">Shorter, plain-English summary</span>
        )}
      </div>

      {/* Description block — loading/ready/error states */}
      {descState === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
          </div>
          <p className="text-sm text-white/50">Writing description…</p>
          {slowWarning && (
            <p className="text-sm text-amber-400/80">Taking longer than expected…</p>
          )}
          {showRetryButton && (
            <button
              type="button"
              onClick={() => {
                setDescState('loading')
                generateDescription(false, tone)
              }}
              className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {descState === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-400">
            Description generation timed out — tap Try Again to retry.
          </p>
          <button
            type="button"
            onClick={() => {
              setDescState('loading')
              generateDescription(false, tone)
            }}
            className="self-start px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
          <DescriptionBlock
            key={descKey}
            assetId={assetId}
            descriptionText={descText}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            onTextChange={handleDescTextChange}
          />
        </div>
      )}

      {descState === 'ready' && (
        <>
          {confirmingRegen && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-900/15 px-4 py-3">
              <p className="text-sm text-amber-300 flex-1">Your edits will be lost. Regenerate?</p>
              <button
                type="button"
                onClick={() => handleRegenerate('', true)}
                className="text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRegen(false)}
                className="text-sm text-white/50 hover:text-white/80 px-2 py-1.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          <DescriptionBlock
            key={descKey}
            assetId={assetId}
            descriptionText={descText}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            onTextChange={handleDescTextChange}
          />
        </>
      )}

      {/* Condition Report — vehicles only, merges condition ratings + damage into one card */}
      {assetType === 'vehicle' && (() => {
        const conditionFields = [
          { label: 'Body',    value: fields.body_condition },
          { label: 'Paint',   value: fields.paint_condition },
          { label: 'Tyres',   value: fields.tyre_condition },
          { label: 'Rust',    value: fields.rust_condition },
          { label: 'Seats',   value: fields.seat_condition },
          { label: 'Carpet',  value: fields.carpet_condition },
        ].filter(f => f.value)

        const damageNotes = fields.damage_notes ?? ''
        const noteLines = damageNotes.split('\n').filter((l: string) => l.trim())
        // Prefer the explicit one-line summary; if absent but panel notes exist, derive a summary
        const damageSummary = fields.damage
          ? fields.damage
          : noteLines.length > 0
            ? `Damage noted to ${noteLines.length} panel${noteLines.length > 1 ? 's' : ''} — see breakdown below`
            : null
        const hasDamage = noteLines.length > 0 || !!fields.damage

        if (conditionFields.length === 0 && !hasDamage) return null

        return (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <AlertTriangle className={`w-4 h-4 ${hasDamage ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className="text-sm font-semibold text-white">Condition Report</span>
              {hasDamage ? (
                <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Damage Recorded
                </span>
              ) : conditionFields.length > 0 ? (
                <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  No Damage
                </span>
              ) : null}
            </div>

            <div className="flex flex-col divide-y divide-white/[0.06]">
              {/* Condition ratings — 2-column grid for compact display */}
              {conditionFields.length > 0 && (
                <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {conditionFields.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-xs font-medium text-white/50 shrink-0">{label}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${conditionBadgeClass(value)}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Damage summary + panel breakdown */}
              <div className="px-4 py-3 flex flex-col gap-3">
                {damageSummary ? (
                  /* Prominent amber box for damage summary */
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/[0.08] px-3 py-2.5 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-amber-100 leading-snug">{damageSummary}</p>
                  </div>
                ) : (
                  /* Green "no damage" badge */
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      No visible damage
                    </span>
                  </div>
                )}

                {/* Panel-by-panel breakdown */}
                {noteLines.length > 0 && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] overflow-hidden">
                    {noteLines.map((line: string, i: number) => {
                      const { panel, desc } = parseDamageLine(line)
                      return (
                        <div key={i} className={`flex items-baseline gap-2 px-3 py-2.5 ${i > 0 ? 'border-t border-white/[0.05]' : ''}`}>
                          <span className="text-xs font-semibold text-white/90 whitespace-nowrap shrink-0">{panel}</span>
                          {desc && (
                            <>
                              <span className="text-white/25 text-xs shrink-0">—</span>
                              <span className="text-xs text-white/55">{desc}</span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
