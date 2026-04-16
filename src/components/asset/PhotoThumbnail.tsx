'use client'
import { forwardRef } from 'react'
import type { CSSProperties } from 'react'
import { X, GripVertical } from 'lucide-react'
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
  // dnd-kit passthrough props (provided by PhotoThumbnailGrid via useSortable)
  dragHandleProps?: Record<string, unknown>
  style?: CSSProperties
  isDragging?: boolean
}

export const PhotoThumbnail = forwardRef<HTMLDivElement, PhotoThumbnailProps>(
  function PhotoThumbnail(
    { id, signedUrl, isCover, isUploading, uploadError, onRemove, isDeleting, dragHandleProps, style, isDragging },
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
          loading="lazy"
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Cover badge (position-0 only) */}
        {isCover && <CoverPhotoBadge />}

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
