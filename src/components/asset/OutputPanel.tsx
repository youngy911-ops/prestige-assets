'use client'
import { useEffect, useState } from 'react'
import { FieldsBlock } from '@/components/asset/FieldsBlock'
import { DescriptionBlock } from '@/components/asset/DescriptionBlock'

type Tone = 'standard' | 'quick'

interface OutputPanelProps {
  assetId: string
  fieldsText: string           // Pre-computed by server page — always available immediately
  initialDescription: string | null  // null = generate; non-null = cached from DB
}

type DescriptionState = 'loading' | 'ready' | 'error'

export function OutputPanel({ assetId, fieldsText, initialDescription }: OutputPanelProps) {
  const [descState, setDescState] = useState<DescriptionState>(
    initialDescription ? 'ready' : 'loading'
  )
  const [descText, setDescText] = useState<string>(initialDescription ?? '')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [tone, setTone] = useState<Tone>('standard')
  // Increment to force DescriptionBlock remount after regeneration — resets edit state
  const [descKey, setDescKey] = useState(0)

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
          <DescriptionBlock
            key={descKey}
            assetId={assetId}
            descriptionText={descText}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
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
          />
        </>
      )}
    </div>
  )
}
