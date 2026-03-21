'use client'
import { useState } from 'react'
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface DescriptionBlockProps {
  descriptionText: string
  onRegenerate: (currentText: string, hasEdited: boolean) => void
  isRegenerating: boolean
}

export function DescriptionBlock({ descriptionText, onRegenerate, isRegenerating }: DescriptionBlockProps) {
  const [copied, setCopied] = useState(false)
  const [localText, setLocalText] = useState(descriptionText)
  const [hasEdited, setHasEdited] = useState(false)

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
    setLocalText(e.target.value)
    setHasEdited(true)
  }

  function handleRegenerate() {
    onRegenerate(localText, hasEdited)
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white/65">Description</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="gap-1.5"
            >
              {isRegenerating
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              {isRegenerating ? 'Regenerating\u2026' : 'Regenerate'}
            </Button>
            <Button
              size="sm"
              onClick={handleCopy}
              disabled={isRegenerating}
              className="gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy Description'}
            </Button>
          </div>
        </div>
        <Textarea
          value={localText}
          onChange={handleChange}
          readOnly={isRegenerating}
          placeholder="Description will appear here once generated."
          className="min-h-48 text-sm leading-relaxed font-mono resize-y"
          rows={10}
        />
      </CardContent>
    </Card>
  )
}
