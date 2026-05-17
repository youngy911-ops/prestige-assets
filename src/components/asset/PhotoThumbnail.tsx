'use client'
import { forwardRef } from 'react'
import type { CSSProperties } from 'react'
import { X, GripVertical, TriangleAlert } from 'lucide-react'
import { CoverPhotoBadge } from './CoverPhotoBadge'
import { UploadProgressIndicator } from './UploadProgressIndicator'

export interface PhotoThumbnailProps {
  id: string
  signedUrl: string
  isCover: boolean
  isUploading?: boolean
  uploadError?: string | null
  onRemove: (id: string) => void
  isDeleting?: boolean
  qualityWarnings?: string[]
  // dnd-kit passthrough props (provided by PhotoThumbnailGrid via useSortable)
  dragHandleProps?: Record<string, unknown>
  style?: CSSProperties
  isDragging?: boolean
}

export const PhotoThumbnail = forwardRef<HTMLDivElement, PhotoThumbnailProps>(
  function PhotoThumbnail(
    { id, signedUrl, isCover, isUploading, uploadError, onRemove, isDeleting, qualityWarnings, dragHandleProps, style, isDragging },
    ref
  ) {
    return (
      <div
        ref={ref}
        style={style}
        className={`relative aspect-square min-w-[80px] min-h-[80px] rounded-md overflow-hidden bg-[oklch(0.34_0.1_148)] ${
          isDragging ? 'opacity-90' : 'opacity-100'
        }`}
        data-photo-id={id}
      >
        {/* Photo image */}
        <img
          src={signedUrl}
          alt=""
          role="presentation"
          loading={isCover ? 'eager' : 'lazy'}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Cover badge (position-0 only) */}
        {isCover && <CoverPhotoBadge />}

        {/* Quality warning badge — shown when photo is blurry or too dark */}
        {qualityWarnings && qualityWarnings.length > 0 && (
          <div
            title={qualityWarnings.join(', ')}
            className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-lg bg-amber-500/80 backdrop-blur-sm shadow-sm px-1 py-0.5 pointer-events-none"
            aria-label={`Photo quality warning: ${qualityWarnings.join(', ')}`}
          >
            <TriangleAlert className="w-3 h-3 text-white" />
            <span className="text-[10px] font-medium text-white leading-none">
              {qualityWarnings[0]}
            </span>
          </div>
        )}

        {/* Upload overlay (during upload or on error) */}
        <UploadProgressIndicator isUploading={!!isUploading} error={uploadError} />

        {/* Remove button — top-right, 32×32px touch area */}
        <button
          type="button"
          aria-label="Remove photo"
          onClick={() => onRemove(id)}
          disabled={isDeleting}
          className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center rounded text-white/65 hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Drag handle — bottom-left, visible at all times */}
        <button
          type="button"
          aria-label="Drag to reorder"
          className="absolute bottom-1 left-1 w-8 h-8 flex items-center justify-center rounded text-white/65 hover:text-white transition-colors cursor-grab active:cursor-grabbing touch-none"
          {...(dragHandleProps ?? {})}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
    )
  }
)
