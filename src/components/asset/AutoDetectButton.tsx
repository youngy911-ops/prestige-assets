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
  // files: compressed File objects so caller can upload them without re-processing
  onDetected: (type: AssetType, subtype: string | null, files: File[]) => void
}

async function compressFile(file: File): Promise<{ compressed: File; dataUrl: string }> {
  const imageCompression = (await import('browser-image-compression')).default
  const compressed = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1024, useWebWorker: true })
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(compressed)
  })
  return { compressed, dataUrl }
}

export function AutoDetectButton({ onDetected }: AutoDetectButtonProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'detecting' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<AutoDetectResult | null>(null)
  const [photoCount, setPhotoCount] = useState(0)
  const compressedFilesRef = useRef<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: File[]) {
    if (files.length === 0) return
    const capped = files.slice(0, 4)
    setPhotoCount(capped.length)
    setStatus('processing')
    setResult(null)
    compressedFilesRef.current = []
    try {
      const results = await Promise.all(capped.map(compressFile))
      compressedFilesRef.current = results.map(r => r.compressed)
      setStatus('detecting')
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: results.map(r => r.dataUrl) }),
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
            <p className={`text-xs mt-0.5 capitalize ${result.confidence === 'low' ? 'text-amber-400' : 'text-white/40'}`}>
              {result.confidence} confidence{result.confidence === 'low' ? ' — verify below' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDetected(result.asset_type, result.asset_subtype, compressedFilesRef.current)}
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
            {status === 'detecting' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                {`Detecting from ${photoCount} photo${photoCount !== 1 ? 's' : ''}…`}
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {'Compressing…'}
              </>
            )}
          </>
        ) : (
          <>
            <Images className="w-4 h-4" />
            Upload photos to detect type
          </>
        )}
      </button>
      {status === 'error' && (
        <div className="flex items-center justify-between -mt-2 px-1">
          <p className="text-xs text-red-400">Couldn't detect — select type below or try again</p>
          <button
            type="button"
            onClick={() => { setStatus('idle'); setResult(null) }}
            className="text-xs text-white/50 hover:text-white/80 underline transition-colors ml-3 shrink-0"
          >
            Try again
          </button>
        </div>
      )}
    </>
  )
}
