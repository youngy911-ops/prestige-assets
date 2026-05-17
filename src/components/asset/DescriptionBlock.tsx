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
  onTextChange?: (text: string) => void
}

export function DescriptionBlock({ assetId, descriptionText, onRegenerate, isRegenerating, onTextChange }: DescriptionBlockProps) {
  const [copied, setCopied] = useState(false)
  const [localText, setLocalText] = useState(descriptionText)
  const [hasEdited, setHasEdited] = useState(false)
  const [savedIndicator, setSavedIndicator] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync when parent updates descriptionText (e.g. after regeneration)
  // Only update if not currently edited — avoids overwriting user's in-progress edits
  if (!hasEdited && localText !== descriptionText) {
    setLocalText(descriptionText)
    onTextChange?.(descriptionText)
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
    onTextChange?.(value)
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
    <div className="rounded-2xl border border-white/[0.10] bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <span className="text-sm font-bold text-white tracking-tight">Auction Description</span>
        <div className="flex items-center gap-2">
          {savedIndicator && (
            <span className="text-xs text-white/35 animate-in fade-in duration-200">Saved</span>
          )}
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 border border-transparent hover:border-white/[0.10] hover:bg-white/[0.04] rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-40"
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
            className="inline-flex items-center gap-1.5 text-xs bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-400/50 text-white px-3 py-1.5 rounded-lg transition-all font-semibold disabled:opacity-40"
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
        className="min-h-52 text-[14px] leading-[1.8] font-sans resize-y border-0 rounded-none bg-transparent focus-visible:ring-0 px-4 py-4 text-white/90 placeholder:text-white/30"
        rows={10}
      />
    </div>
  )
}
