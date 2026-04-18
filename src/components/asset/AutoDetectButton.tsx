'use client'
import { useState, useRef } from 'react'
import { Loader2, Sparkles, Images } from 'lucide-react'
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

async function compressToDataUrl(file: File): Promise<string> {
  const imageCompression = (await import('browser-image-compression')).default
  const compressed = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1024, useWebWorker: true })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(compressed)
  })
}

export function AutoDetectButton({ onDetected }: AutoDetectButtonProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'detecting' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<AutoDetectResult | null>(null)
  const [photoCount, setPhotoCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: File[]) {
    if (files.length === 0) return
    const capped = files.slice(0, 4)
    setPhotoCount(capped.length)
    setStatus('processing')
    setResult(null)
    try {
      const dataUrls = await Promise.all(capped.map(compressToDataUrl))
      setStatus('detecting')
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: dataUrls }),
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
            <p className="text-xs text-emerald-400/70 mb-0.5">Detected from {photoCount} photo{photoCount !== 1 ? 's' : ''}</p>
            <p className="text-white font-semibold">
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

  const busy = status === 'processing' || status === 'detecting'

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length) handleFiles(files)
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 hover:bg-emerald-500/12 text-emerald-300 hover:text-emerald-200 text-sm py-3.5 font-medium transition-all disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {status === 'detecting'
              ? `Detecting from ${photoCount} photo${photoCount !== 1 ? 's' : ''}…`
              : 'Compressing…'}
          </>
        ) : (
          <>
            <Images className="w-4 h-4" />
            Upload photos to detect type
          </>
        )}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-400 text-center -mt-2">Detection failed — select type manually below</p>
      )}
    </>
  )
}
