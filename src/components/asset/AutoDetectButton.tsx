'use client'
import { useState, useRef } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import type { AssetType } from '@/lib/schema-registry/types'

interface AutoDetectResult {
  asset_type: AssetType
  asset_subtype: string | null
  type_label: string
  subtype_label: string | null
  confidence: 'high' | 'medium' | 'low'
}

interface AutoDetectButtonProps {
  onDetected: (type: AssetType, subtype: string | null) => void
}

export function AutoDetectButton({ onDetected }: AutoDetectButtonProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'detecting' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<AutoDetectResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setStatus('uploading')
    setResult(null)
    try {
      // Convert to base64 data URL for classification
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      setStatus('detecting')
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: dataUrl }),
      })
      if (!res.ok) throw new Error('Classification failed')
      const data: AutoDetectResult = await res.json()
      setResult(data)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done' && result) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Detected:</p>
            <p className="text-white font-semibold mt-0.5">
              {result.type_label}{result.subtype_label ? ` — ${result.subtype_label}` : ''}
            </p>
            <p className="text-xs text-white/40 mt-0.5 capitalize">{result.confidence} confidence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDetected(result.asset_type, result.asset_subtype)}
            className="flex-1 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-2 transition-colors"
          >
            Use this
          </button>
          <button
            type="button"
            onClick={() => { setStatus('idle'); setResult(null) }}
            className="text-sm text-white/45 hover:text-white/70 px-3 py-2 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading' || status === 'detecting'}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white text-sm py-3 transition-all disabled:opacity-50"
      >
        {status === 'uploading' || status === 'detecting'
          ? <><Loader2 className="w-4 h-4 animate-spin" />{status === 'detecting' ? 'Detecting…' : 'Loading…'}</>
          : <><Sparkles className="w-4 h-4 text-emerald-400" />Detect type from photo</>
        }
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-400 text-center mt-1">Detection failed — select manually below</p>
      )}
    </>
  )
}
