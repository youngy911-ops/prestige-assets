'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface FieldsBlockProps {
  fieldsText: string
}

export function FieldsBlock({ fieldsText }: FieldsBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(fieldsText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white/65">Salesforce Fields</span>
          <Button
            size="sm"
            onClick={handleCopy}
            className="gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy Fields'}
          </Button>
        </div>
        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{fieldsText}</pre>
      </CardContent>
    </Card>
  )
}
