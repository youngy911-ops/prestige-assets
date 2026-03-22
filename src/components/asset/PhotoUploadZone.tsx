'use client'
import { useRef, useState } from 'react'
import { Camera, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { processImageForUpload } from '@/lib/utils/image'
import { insertPhoto, getSignedUrl } from '@/lib/actions/photo.actions'
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
}: PhotoUploadZoneProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([])
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

    // Add all placeholders upfront so the user sees all photos queued immediately
    const tempIds = fileArray.map((_, i) => `uploading-${Date.now()}-${i}`)
    setUploadingIds((prev) => new Set([...prev, ...tempIds]))

    const baseOrder = photos.length

    const results = await Promise.allSettled(
      fileArray.map(async (file, i) => {
        try {
          // 1. EXIF correct + compress to max 2MP
          const processed = await processImageForUpload(file)

          // 2. Upload to Supabase Storage (direct BrowserClient — not via Server Action)
          const storagePath = `${userId}/${assetId}/${Date.now()}-${i}-${processed.name}`
          const { data, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(storagePath, processed, { contentType: 'image/jpeg', upsert: false })

          if (uploadError) throw new Error(uploadError.message)

          // 3. Persist to asset_photos table via Server Action
          const insertResult = await insertPhoto({
            assetId,
            storagePath: data.path,
            sortOrder: baseOrder + i,
          })
          if ('error' in insertResult) throw new Error(insertResult.error)

          // 4. Get presigned URL for immediate display (1 hour expiry)
          const urlResult = await getSignedUrl(data.path)
          if ('error' in urlResult) throw new Error(urlResult.error)

          return {
            id: insertResult.id,
            storagePath: data.path,
            signedUrl: urlResult.signedUrl,
            sortOrder: baseOrder + i,
          } satisfies PhotoItem
        } finally {
          setUploadingIds((prev) => {
            const next = new Set(prev)
            next.delete(tempIds[i])
            return next
          })
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
          className="w-full max-w-xs bg-[oklch(0.29_0.07_248)] hover:bg-[oklch(0.29_0.07_248)]/90 text-white h-11 disabled:opacity-40"
        >
          <Camera className="w-4 h-4 mr-2" />
          Add Photos
        </Button>

        {/* Upload errors */}
        {uploadErrors.length > 0 && (
          <div className="w-full max-w-xs space-y-1">
            {uploadErrors.map((err, i) => (
              <p key={i} className="text-sm text-[#F87171] flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Upload failed. Check your connection and try again.
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
            {photos.length} photo{photos.length !== 1 ? 's' : ''} — drag to reorder
          </p>
        </div>
        <Button
          onClick={handleAddPhotosClick}
          disabled={isUploading || atCap}
          size="sm"
          className="bg-[oklch(0.29_0.07_248)] hover:bg-[oklch(0.29_0.07_248)]/90 text-white h-9 disabled:opacity-40"
        >
          <Camera className="w-4 h-4 mr-1.5" />
          Add Photos
        </Button>
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
            <p key={i} className="text-sm text-[#F87171] flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Upload failed. Check your connection and try again.
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
