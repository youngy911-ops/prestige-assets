'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { processImageForUpload } from '@/lib/utils/image'
import { insertPhoto, pickHeroShot, updatePhotoOrder } from '@/lib/actions/photo.actions'
import { PhotoThumbnailGrid } from './PhotoThumbnailGrid'
import { createClient } from '@/lib/supabase/client'

export interface PhotoItem {
  id: string
  storagePath: string
  signedUrl: string
  sortOrder: number
}

interface PhotoUploadZoneProps {
  assetId: string
  userId: string
  initialPhotos?: PhotoItem[]
  onPhotosChange?: (photos: PhotoItem[]) => void
  showCTA?: boolean
}

interface UploadError {
  filename: string
  message: string
}

export function PhotoUploadZone({
  assetId,
  userId,
  initialPhotos = [],
  onPhotosChange,
  showCTA = false,
}: PhotoUploadZoneProps) {
  const router = useRouter()
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [isPickingHero, setIsPickingHero] = useState(false)
  const [heroPickResult, setHeroPickResult] = useState<'updated' | 'already-best' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const atCap = photos.length >= 80

  function handleAddPhotosClick() {
    fileInputRef.current?.click()
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Snapshot files into array BEFORE resetting input (resetting clears the FileList reference)
    const remaining = 80 - photos.length
    const fileArray = Array.from(files).slice(0, remaining)

    // Reset input so same file can be re-selected
    e.target.value = ''

    if (fileArray.length === 0) return

    setIsUploading(true)
    setUploadErrors([])
    setUploadProgress({ done: 0, total: fileArray.length })

    // Add all placeholders upfront so the user sees all photos queued immediately
    const tempIds = fileArray.map((_, i) => `uploading-${Date.now()}-${i}`)
    setUploadingIds((prev) => new Set([...prev, ...tempIds]))

    const baseOrder = photos.length
    let doneCount = 0

    // Phase 1: Compress all files in batches of 3 (CPU-bound — prevents choking on HEIC decodes)
    const COMPRESS_BATCH = 3
    const processed: File[] = []
    for (let i = 0; i < fileArray.length; i += COMPRESS_BATCH) {
      const batch = await Promise.all(fileArray.slice(i, i + COMPRESS_BATCH).map(f => processImageForUpload(f)))
      processed.push(...batch)
    }

    // Phase 2: Upload all compressed files in parallel (network-bound — safe at 2MP)
    // then insert DB records in parallel. Each photo completes independently.
    const results = await Promise.allSettled(
      processed.map(async (file, i) => {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
          const storagePath = `${userId}/${assetId}/${Date.now()}-${i}-${safeName}`
          let uploadData: { path: string } | null = null
          let lastUploadError: string | null = null
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data, error: uploadError } = await supabase.storage
              .from('photos')
              .upload(storagePath, file, { contentType: 'image/jpeg', upsert: false })
            if (!uploadError && data) { uploadData = data; break }
            lastUploadError = uploadError?.message ?? 'Upload failed'
            if (uploadError?.message?.toLowerCase().includes('policy') ||
                uploadError?.message?.toLowerCase().includes('auth') ||
                uploadError?.message?.toLowerCase().includes('permission')) break
          }
          if (!uploadData) throw new Error(lastUploadError ?? 'Upload failed')

          const insertResult = await insertPhoto({
            assetId,
            storagePath: uploadData.path,
            sortOrder: baseOrder + i,
          })
          if ('error' in insertResult) throw new Error(insertResult.error)

          return {
            id: insertResult.id,
            storagePath: uploadData.path,
            signedUrl: insertResult.signedUrl,
            sortOrder: baseOrder + i,
          } satisfies PhotoItem
        } finally {
          setUploadingIds((prev) => {
            const next = new Set(prev)
            next.delete(tempIds[i])
            return next
          })
          doneCount++
          setUploadProgress({ done: doneCount, total: fileArray.length })
        }
      })
    )

    const newPhotos: PhotoItem[] = []
    const errors: { filename: string; message: string }[] = []

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        newPhotos.push(result.value)
      } else {
        errors.push({ filename: fileArray[i].name, message: String(result.reason) })
      }
    })

    if (newPhotos.length > 0) {
      setPhotos((prev) => {
        const updated = [...prev, ...newPhotos].sort((a, b) => a.sortOrder - b.sortOrder)
        onPhotosChange?.(updated)
        return updated
      })
    }
    if (errors.length > 0) setUploadErrors(errors)

    setIsUploading(false)
    setUploadProgress(null)
  }

  async function handlePickHero() {
    if (photos.length < 2 || isPickingHero) return
    setIsPickingHero(true)
    setHeroPickResult(null)
    const result = await pickHeroShot(assetId)
    if ('error' in result) { setIsPickingHero(false); return }

    const { heroIndex } = result
    if (heroIndex >= photos.length) { setIsPickingHero(false); return }
    if (heroIndex === 0) {
      setHeroPickResult('already-best')
    } else {
      // Move picked photo to front, shift others down
      const reordered = [
        photos[heroIndex],
        ...photos.slice(0, heroIndex),
        ...photos.slice(heroIndex + 1),
      ]
      setPhotos(reordered)
      onPhotosChange?.(reordered)
      await updatePhotoOrder(reordered.map((p, i) => ({ id: p.id, sortOrder: i })))
      setHeroPickResult('updated')
    }
    setIsPickingHero(false)
    // Clear result hint after 3 seconds
    setTimeout(() => setHeroPickResult(null), 3000)
  }

  // Empty state
  if (photos.length === 0 && uploadingIds.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          data-testid="photo-file-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
          disabled={isUploading || atCap}
        />

        <Camera className="w-12 h-12 text-white/40" />
        <div className="text-center">
          <p className="text-[28px] font-semibold text-white leading-tight">No photos yet</p>
          <p className="text-sm text-white/65 mt-1">
            Add photos from your camera roll or file system.
          </p>
        </div>
        <Button
          onClick={handleAddPhotosClick}
          disabled={isUploading || atCap}
          className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-600/90 text-white h-11 disabled:opacity-40"
        >
          <Camera className="w-4 h-4 mr-2" />
          Add Photos
        </Button>

        {/* Upload errors */}
        {uploadErrors.length > 0 && (
          <div className="w-full max-w-xs space-y-1">
            {uploadErrors.map((err, i) => (
              <p key={i} className="text-sm text-destructive flex items-start gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span><span className="font-medium">{err.filename}:</span> {err.message}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Photos present state
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Photos</h2>
          <p className="text-sm text-white/65">
            {uploadProgress
              ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…`
              : heroPickResult === 'updated'
              ? 'Cover photo updated'
              : heroPickResult === 'already-best'
              ? 'Already best cover photo'
              : `${photos.length} photo${photos.length !== 1 ? 's' : ''} — drag to reorder`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {photos.length >= 2 && !isUploading && (
            <button
              type="button"
              onClick={handlePickHero}
              disabled={isPickingHero}
              title="Auto-pick best cover photo"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isPickingHero ? 'animate-pulse' : ''}`} />
              {isPickingHero ? 'Picking…' : 'Best Cover'}
            </button>
          )}
          <Button
            onClick={handleAddPhotosClick}
            disabled={isUploading || atCap}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-600/90 text-white h-9 disabled:opacity-40"
          >
            <Camera className="w-4 h-4 mr-1.5" />
            {isUploading ? `${uploadProgress?.done ?? 0}/${uploadProgress?.total ?? '…'}` : 'Add Photos'}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        data-testid="photo-file-input"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
        disabled={isUploading || atCap}
      />

      {/* Uploading placeholders — shown above grid while uploads are in progress */}
      {uploadingIds.size > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {Array.from(uploadingIds).map((tempId) => (
            <div
              key={tempId}
              className="relative aspect-square min-w-[80px] min-h-[80px] rounded-md bg-[oklch(0.34_0.1_148)] flex items-center justify-center"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                <Camera className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Thumbnail grid with dnd-kit drag-to-reorder */}
      <PhotoThumbnailGrid
        photos={photos}
        onPhotosChange={(updated) => {
          setPhotos(updated)
          onPhotosChange?.(updated)
        }}
        isUploading={isUploading}
      />

      {/* Upload errors */}
      {uploadErrors.length > 0 && (
        <div className="space-y-1">
          {uploadErrors.map((err, i) => (
            <p key={i} className="text-sm text-destructive flex items-start gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span><span className="font-medium">{err.filename}:</span> {err.message}</span>
            </p>
          ))}
        </div>
      )}

      {/* Extract & Review CTA — always visible when photos exist */}
      {showCTA && photos.length > 0 && (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => router.push(`/assets/${assetId}/extract?autostart=1`)}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" />
          {isUploading ? 'Uploading…' : 'Extract & Review'}
        </button>
      )}
    </div>
  )
}
