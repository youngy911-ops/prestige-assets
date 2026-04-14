'use client'
import { useEffect, useState } from 'react'
import { FieldsBlock } from '@/components/asset/FieldsBlock'
import { DescriptionBlock } from '@/components/asset/DescriptionBlock'

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

  // Auto-generate on mount if no cached description
  useEffect(() => {
    if (initialDescription) return  // Cached — skip API call
    generateDescription(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function generateDescription(isRetry: boolean) {
    try {
      const res = await fetch('/api/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setDescText(data.description)
      setDescState('ready')
    } catch {
      if (!isRetry) {
        // Auto-retry once
        await generateDescription(true)
      } else {
        setDescState('error')
      }
    }
  }

  async function handleRegenerate(currentText: string, hasEdited: boolean) {
    if (hasEdited) {
      const confirmed = window.confirm('Your edits will be lost. Regenerate description?')
      if (!confirmed) return
    }
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setDescText(data.description)
    } catch {
      // Regeneration failed — keep existing text, don't show error
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Fields block — always visible immediately */}
      <FieldsBlock fieldsText={fieldsText} />

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
            descriptionText={descText}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
        </div>
      )}

      {descState === 'ready' && (
        <DescriptionBlock
          descriptionText={descText}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
        />
      )}
    </div>
  )
}
