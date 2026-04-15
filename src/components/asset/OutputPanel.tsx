'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Copy, Check, AlertTriangle } from 'lucide-react'
import { FieldsBlock } from '@/components/asset/FieldsBlock'
import { DescriptionBlock } from '@/components/asset/DescriptionBlock'

type Tone = 'standard' | 'quick'

interface OutputPanelProps {
  assetId: string
  assetType: string
  fields: Record<string, string>
  fieldsText: string           // Pre-computed by server page — always available immediately
  initialDescription: string | null  // null = generate; non-null = cached from DB
  photoUrls: string[]
}

type DescriptionState = 'loading' | 'ready' | 'error'

export function OutputPanel({ assetId, assetType, fields, fieldsText, initialDescription, photoUrls }: OutputPanelProps) {
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

  const handleDescTextChange = useCallback((text: string) => {
    currentDescRef.current = text
  }, [])

  async function handleCopyAll() {
    const combined = `${fieldsText}\n\n${currentDescRef.current}`
    await navigator.clipboard.writeText(combined)
    setAllCopied(true)
    setTimeout(() => setAllCopied(false), 2000)
  }

  // Auto-generate on mount if no cached description
  useEffect(() => {
    if (initialDescription) return  // Cached — skip API call
    generateDescription(false, tone)
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
      setDescText(data.description)
      currentDescRef.current = data.description
      setDescState('ready')
    } catch {
      if (!isRetry) {
        // Auto-retry once
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
                      ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-[#0a1a0a]'
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

      {/* Copy All — one-click copy of fields + description for Salesforce */}
      {descState === 'ready' && (
        <button
          type="button"
          onClick={handleCopyAll}
          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
        >
          {allCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {allCopied ? 'Copied!' : 'Copy All to Clipboard'}
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
          <span className="text-xs text-white/30">Short summary for general goods</span>
        )}
      </div>

      {/* Description block — loading/ready/error states */}
      {descState === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
          </div>
          <p className="text-sm text-white/50">Writing description…</p>
        </div>
      )}

      {descState === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-400">
            Description generation failed. You can type your description manually, or try again.
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

      {/* Condition Report — vehicles only, shown when condition/damage data exists */}
      {assetType === 'vehicle' && (() => {
        const conditionFields = [
          { key: 'body_condition', label: 'Body' },
          { key: 'interior_condition', label: 'Interior' },
          { key: 'paint_condition', label: 'Paint' },
          { key: 'rust_condition', label: 'Rust' },
          { key: 'seat_condition', label: 'Seats' },
          { key: 'carpet_condition', label: 'Carpet' },
          { key: 'brake_condition', label: 'Brakes' },
        ]
        const tyreFields = [
          { key: 'tyre_driver_front', label: 'Driver Front' },
          { key: 'tyre_driver_rear', label: 'Driver Rear' },
          { key: 'tyre_passenger_front', label: 'Pass. Front' },
          { key: 'tyre_passenger_rear', label: 'Pass. Rear' },
          { key: 'tyre_spare', label: 'Spare' },
        ]
        const damage = fields.damage ?? ''
        const damageNotes = fields.damage_notes ?? ''
        const hasCondition = conditionFields.some(f => fields[f.key])
        const hasTyres = tyreFields.some(f => fields[f.key])
        const hasDamage = damage || damageNotes
        if (!hasCondition && !hasTyres && !hasDamage) return null

        const conditionColor = (val: string) => {
          const v = val.toLowerCase()
          if (v === 'excellent' || v === 'new' || v === 'none') return 'text-emerald-400'
          if (v === 'good') return 'text-emerald-400/70'
          if (v === 'average') return 'text-amber-400'
          if (v === 'fair' || v === 'minor') return 'text-amber-400'
          if (v === 'poor' || v === 'moderate') return 'text-red-400'
          if (v === 'damaged' || v === 'severe' || v === 'bald') return 'text-red-400'
          return 'text-white/60'
        }
        const dotColor = (val: string) => {
          const v = val.toLowerCase()
          if (v === 'excellent' || v === 'new' || v === 'none' || v === 'good') return 'bg-emerald-400'
          if (v === 'average' || v === 'fair' || v === 'minor') return 'bg-amber-400'
          if (v === 'poor' || v === 'moderate' || v === 'damaged' || v === 'severe' || v === 'bald') return 'bg-red-400'
          return 'bg-white/30'
        }

        return (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Condition Report</span>
            </div>

            <div className="px-4 py-3 flex flex-col gap-4">
              {/* Damage summary */}
              {hasDamage && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">Damage</p>
                  {damage && (
                    <p className="text-sm text-red-300 bg-red-900/15 border border-red-500/20 rounded-lg px-3 py-2">
                      {damage}
                    </p>
                  )}
                  {damageNotes && (
                    <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
                      {damageNotes.split('\n').filter(l => l.trim()).map((line, i) => {
                        const parts = line.split(' - ')
                        const panel = parts[0]?.trim()
                        const desc = parts.slice(1).join(' - ').trim()
                        return (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-2 gap-0.5 sm:gap-4">
                            <span className="text-xs font-medium text-white">{panel}</span>
                            {desc && <span className="text-xs text-white/60 sm:text-right">{desc}</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Condition grid */}
              {hasCondition && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">Condition</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {conditionFields.filter(f => fields[f.key]).map(f => (
                      <div key={f.key} className="flex items-center justify-between">
                        <span className="text-xs text-white/50">{f.label}</span>
                        <span className={`text-xs font-medium flex items-center gap-1.5 ${conditionColor(fields[f.key])}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor(fields[f.key])}`} />
                          {fields[f.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tyres */}
              {hasTyres && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">Tyres</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {tyreFields.filter(f => fields[f.key]).map(f => (
                      <div key={f.key} className="flex items-center justify-between">
                        <span className="text-xs text-white/50">{f.label}</span>
                        <span className={`text-xs font-medium flex items-center gap-1.5 ${conditionColor(fields[f.key])}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor(fields[f.key])}`} />
                          {fields[f.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Damage photos — show last few photos (likely exterior/damage shots) */}
              {hasDamage && photoUrls.length > 3 && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">Damage Photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {photoUrls.slice(Math.max(0, photoUrls.length - 6)).map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setHeroIndex(Math.max(0, photoUrls.length - 6) + i)}
                        className="aspect-square rounded-lg overflow-hidden border border-white/[0.08] hover:border-emerald-500/40 transition-colors"
                      >
                        <img src={url} alt={`Damage photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
