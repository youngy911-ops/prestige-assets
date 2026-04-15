'use client'
import { useState, useRef } from 'react'
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { saveDescription } from '@/lib/actions/review.actions'

interface DescriptionBlockProps {
  assetId: string
  descriptionText: string
  onRegenerate: (currentText: string, hasEdited: boolean) => void
  isRegenerating: boolean
}

export function DescriptionBlock({ assetId, descriptionText, onRegenerate, isRegenerating }: DescriptionBlockProps) {
  const [copied, setCopied] = useState(false)
  const [localText, setLocalText] = useState(descriptionText)
  const [hasEdited, setHasEdited] = useState(false)
  const [savedIndicator, setSavedIndicator] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync when parent updates descriptionText (e.g. after regeneration)
  // Only update if not currently edited — avoids overwriting user's in-progress edits
  if (!hasEdited && localText !== descriptionText) {
    setLocalText(descriptionText)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(localText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setLocalText(value)
    setHasEdited(true)
    // Debounced auto-save — 1.5s after last keystroke
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      await saveDescription(assetId, value)
      setSavedIndicator(true)
      setTimeout(() => setSavedIndicator(false), 2000)
    }, 1500)
  }

  function handleRegenerate() {
    onRegenerate(localText, hasEdited)
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-semibold text-white">Description</span>
        <div className="flex items-center gap-2">
          {savedIndicator && (
            <span className="text-xs text-white/35 animate-in fade-in duration-200">Saved</span>
          )}
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors disabled:opacity-40 px-2 py-1"
          >
            {isRegenerating
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <RefreshCw className="h-3 w-3" />}
            {isRegenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 font-medium"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <Textarea
        value={localText}
        onChange={handleChange}
        readOnly={isRegenerating}
        placeholder="Description will appear here once generated."
        className="min-h-48 text-sm leading-relaxed font-mono resize-y border-0 rounded-none bg-transparent focus-visible:ring-0 px-4 py-3"
        rows={10}
      />
    </div>
  )
}
