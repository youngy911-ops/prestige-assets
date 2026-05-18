'use client'
import { useState } from 'react'
import { Copy, Check, ClipboardList } from 'lucide-react'

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
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
      copied
        ? 'border-emerald-500/50 bg-emerald-950/30 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]'
        : 'border-white/[0.10] bg-white/[0.02]'
    }`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="h-4 w-4 text-emerald-400 opacity-90 flex-shrink-0" />
          <div>
            <span className="text-sm font-semibold text-white">Salesforce Fields</span>
            <span className="ml-2 text-[11px] font-medium text-emerald-300/60 uppercase tracking-wide">ready to paste</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${
            copied
              ? 'bg-emerald-500 text-white scale-[0.97] shadow-[0_0_12px_rgba(52,211,153,0.4)]'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="text-[12.5px] whitespace-pre-wrap font-sans leading-[1.85] px-4 py-3 text-white/80">{fieldsText}</div>
    </div>
  )
}
