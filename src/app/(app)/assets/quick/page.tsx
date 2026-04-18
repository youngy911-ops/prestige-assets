'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, Loader2, ChevronLeft, Zap, FolderOpen, Images, Sparkles } from 'lucide-react'
import { BRANCHES, type BranchKey } from '@/lib/constants/branches'
import { createAsset, updateAssetType } from '@/lib/actions/asset.actions'
import { processImageForUpload } from '@/lib/utils/image'

import { LAST_BRANCH_KEY } from '@/lib/constants/storage-keys'

type QuickBookStatus = 'idle' | 'uploading' | 'creating' | 'done' | 'error'

interface BookedItem {
  id: string
  label: string
  thumbUrl: string
  photoCount: number
  dataUrls?: string[]
  detectStatus?: 'idle' | 'detecting' | 'done' | 'error'
  detectedLabel?: string
}

export default function QuickBookPage() {
  const router = useRouter()
  const cameraRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)
  const blobUrlsRef = useRef<string[]>([])

  // Revoke all blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => { blobUrlsRef.current.forEach(u => URL.revokeObjectURL(u)) }
  }, [])
  const [branch, setBranch] = useState<BranchKey | null>(null)
  const [status, setStatus] = useState<QuickBookStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [booked, setBooked] = useState<BookedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showBranchPicker, setShowBranchPicker] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(LAST_BRANCH_KEY) as BranchKey | null
    if (saved) setBranch(saved)
    else setShowBranchPicker(true)
  }, [])

  async function bookInFiles(files: File[]) {
    if (!branch) { setShowBranchPicker(true); return }
    if (files.length === 0) return
    setStatus('creating')
    setUploadProgress(null)
    setError(null)

    try {
      const result = await createAsset(branch, 'general_goods', 'general_goods')
      if ('error' in result) throw new Error(result.error)

      const assetId = result.assetId
      const thumbUrl = URL.createObjectURL(files[0])
      blobUrlsRef.current.push(thumbUrl)

      // Compress + EXIF-correct all photos in parallel before uploading
      setStatus('uploading')
      setUploadProgress(files.length > 1 ? `Uploading ${files.length} photos…` : 'Uploading…')
      const processedFiles = await Promise.all(files.map(f => processImageForUpload(f)))
      const uploadResults = await Promise.allSettled(
        processedFiles.map((file, i) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('assetId', assetId)
          formData.append('sortOrder', String(i))
          return fetch('/api/upload-photo', { method: 'POST', body: formData })
        })
      )
      const failed = uploadResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok))
      if (failed.length === files.length) throw new Error('All photos failed to upload')
      // Partial success is still a success — asset created with some photos

      // Build dataUrls from processed files for multi-image classify
      const dataUrls = await Promise.all(
        processedFiles.slice(0, 3).map(file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        }))
      )

      setBooked(prev => [...prev, {
        id: assetId,
        label: `Item ${prev.length + 1}`,
        thumbUrl,
        photoCount: files.length,
        dataUrls,
        detectStatus: 'detecting' as const,
      }])
      setStatus('idle')
      setUploadProgress(null)

      // Auto-detect type in background — don't block the UI
      detectType(assetId, dataUrls)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
      setUploadProgress(null)
    }
  }

  async function handlePhoto(file: File) {
    await bookInFiles([file])
  }

  async function detectType(itemId: string, dataUrlsOverride?: string[]) {
    setBooked(prev => prev.map(i => i.id === itemId ? { ...i, detectStatus: 'detecting' as const } : i))
    try {
      const imageUrls = dataUrlsOverride ?? booked.find(i => i.id === itemId)?.dataUrls
      if (!imageUrls?.length) return

      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls }),
      })
      if (!res.ok) throw new Error('Classification failed')
      const data = await res.json()

      if (data.confidence === 'low') {
        setBooked(prev => prev.map(i => i.id === itemId ? { ...i, detectStatus: 'error' as const } : i))
        return
      }

      // Update the asset in the database
      const result = await updateAssetType(itemId, data.asset_type, data.asset_subtype ?? data.asset_type)
      if ('error' in result) throw new Error(result.error)

      const label = data.subtype_label
        ? `${data.type_label} — ${data.subtype_label}`
        : data.type_label

      setBooked(prev => prev.map(i => i.id === itemId ? {
        ...i,
        detectStatus: 'done' as const,
        detectedLabel: label,
      } : i))
    } catch {
      setBooked(prev => prev.map(i => i.id === itemId ? { ...i, detectStatus: 'error' as const } : i))
    }
  }

  const branchLabel = BRANCHES.find(b => b.key === branch)?.label ?? 'No branch'

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.push('/')} className="text-white/65 hover:text-white p-1 -ml-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h1 className="text-xl font-semibold text-white">Quick Book</h1>
          </div>
          <p className="text-sm text-white/50">General goods — snap and go</p>
        </div>
      </div>

      {/* Branch picker */}
      {showBranchPicker ? (
        <div className="flex flex-col gap-3 mb-6">
          <p className="text-sm text-white/65">Select your branch to continue:</p>
          {BRANCHES.map(b => (
            <button
              key={b.key}
              type="button"
              onClick={() => {
                setBranch(b.key as BranchKey)
                localStorage.setItem(LAST_BRANCH_KEY, b.key)
                setShowBranchPicker(false)
              }}
              className="w-full text-left px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-white text-sm transition-all"
            >
              {b.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Branch chip */}
          <button
            type="button"
            onClick={() => setShowBranchPicker(true)}
            className="inline-flex items-center gap-1 text-sm text-white/65 hover:text-white border border-white/[0.12] rounded-lg px-3 py-1.5 mb-6 transition-colors"
          >
            {branchLabel}
            <span className="text-white/30 text-xs ml-1">change</span>
          </button>

          {/* Hidden inputs */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = '' }}
          />
          <input
            ref={filesRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files ?? [])
              if (files.length) bookInFiles(files)
              // Reset so same files can be re-selected
              e.target.value = ''
            }}
          />

          {/* Snap button */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={status === 'uploading' || status === 'creating'}
            className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-white min-h-[140px] transition-all disabled:opacity-50"
          >
            {status === 'uploading' || status === 'creating' ? (
              <>
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <span className="text-sm text-white/65">{uploadProgress ?? (status === 'creating' ? 'Creating record…' : 'Uploading…')}</span>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 text-emerald-400" />
                <span className="text-sm font-medium text-white">Snap a photo to book in</span>
                <span className="text-xs text-white/40">One photo → one new record</span>
              </>
            )}
          </button>

          {/* Upload from files */}
          <button
            type="button"
            onClick={() => filesRef.current?.click()}
            disabled={status === 'uploading' || status === 'creating'}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.10] bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white py-3.5 transition-all disabled:opacity-50"
          >
            <Images className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">Upload from files</span>
            <span className="text-xs text-white/35 ml-1">— plate, hours, body = 1 record</span>
          </button>

          {error && <p className="text-xs text-red-400 text-center mt-1">{error}</p>}

          {/* Booked items */}
          {booked.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">{booked.length} item{booked.length !== 1 ? 's' : ''} booked this session</p>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {[...booked].reverse().map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/assets/${item.id}/review`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                    >
                      <img src={item.thumbUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{item.detectedLabel ?? item.label}</p>
                        <p className="text-xs text-white/40">
                          {item.photoCount === 1 ? '1 photo · ' : `${item.photoCount} photos · `}Tap to fill in details
                        </p>
                      </div>
                    </button>
                    {item.detectStatus === 'done' ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : item.detectStatus === 'detecting' ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                    ) : item.detectStatus === 'error' ? (
                      <Check className="w-4 h-4 text-white/20 flex-shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => detectType(item.id)}
                        className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors flex-shrink-0"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Detect</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
