'use client'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PhotoThumbnail } from './PhotoThumbnail'
import { updatePhotoOrder, removePhoto } from '@/lib/actions/photo.actions'
import type { PhotoItem } from './PhotoUploadZone'

interface SortablePhotoProps {
  photo: PhotoItem
  isCover: boolean
  onRemove: (id: string) => void
  isDeleting: boolean
}

function SortablePhoto({ photo, isCover, onRemove, isDeleting }: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <PhotoThumbnail
      ref={setNodeRef}
      id={photo.id}
      signedUrl={photo.signedUrl}
      isCover={isCover}
      onRemove={onRemove}
      dragHandleProps={{ ...attributes, ...listeners }}
      style={style}
      isDragging={isDragging}
      isDeleting={isDeleting}
    />
  )
}

export interface PhotoThumbnailGridProps {
  photos: PhotoItem[]
  onPhotosChange: (photos: PhotoItem[]) => void
  isUploading?: boolean
}

export function PhotoThumbnailGrid({
  photos,
  onPhotosChange,
  isUploading = false,
}: PhotoThumbnailGridProps) {
  const [orderError, setOrderError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // activationConstraint: 8px threshold prevents tap-to-remove triggering drag on mobile
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = photos.findIndex((p) => p.id === active.id)
    const newIndex = photos.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(photos, oldIndex, newIndex)

    // Optimistic update — cover badge moves immediately
    onPhotosChange(reordered)

    // Persist new sort_order values
    setOrderError(null)
    const result = await updatePhotoOrder(
      reordered.map((p, i) => ({ id: p.id, sortOrder: i }))
    )
    if ('error' in result) {
      setOrderError('Failed to save photo order. Reload the page and try again.')
      // Revert optimistic update on failure
      onPhotosChange(photos)
    }
  }

  async function handleRemove(photoId: string) {
    if (deletingIds.has(photoId)) return
    setDeletingIds((prev) => new Set([...prev, photoId]))
    const result = await removePhoto(photoId)
    setDeletingIds((prev) => { const next = new Set(prev); next.delete(photoId); return next })
    if ('error' in result) {
      setOrderError(result.error)
      return
    }
    const updated = photos.filter((p) => p.id !== photoId)
    onPhotosChange(updated)
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={isUploading ? undefined : handleDragEnd}
      >
        <SortableContext
          items={photos.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {photos.map((photo, index) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                isCover={index === 0}
                onRemove={handleRemove}
                isDeleting={deletingIds.has(photo.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {orderError && (
        <p className="text-sm text-destructive mt-2">{orderError}</p>
      )}
    </div>
  )
}
