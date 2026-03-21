'use client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
        <div className="flex items-center gap-2 text-sm text-white/65 py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating description&hellip;
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
