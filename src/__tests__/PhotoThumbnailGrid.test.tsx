import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('@/lib/actions/photo.actions', () => ({
  updatePhotoOrder: vi.fn().mockResolvedValue({ success: true }),
  removePhoto: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock dnd-kit to avoid jsdom pointer event issues
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  useSensor: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  rectSortingStrategy: vi.fn(),
  arrayMove: vi.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr]
    result.splice(to, 0, result.splice(from, 1)[0])
    return result
  }),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}))

const { PhotoThumbnailGrid } = await import('@/components/asset/PhotoThumbnailGrid')

const mockPhotos = [
  { id: 'p1', storagePath: 'u/a/1.jpg', signedUrl: 'https://example.com/1.jpg', sortOrder: 0 },
  { id: 'p2', storagePath: 'u/a/2.jpg', signedUrl: 'https://example.com/2.jpg', sortOrder: 1 },
  { id: 'p3', storagePath: 'u/a/3.jpg', signedUrl: 'https://example.com/3.jpg', sortOrder: 2 },
]

describe('PhotoThumbnailGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the correct number of thumbnails', () => {
    const { container } = render(
      <PhotoThumbnailGrid
        photos={mockPhotos}
        onPhotosChange={vi.fn()}
      />
    )
    // Each PhotoThumbnail renders an img element (alt="" makes role=presentation, use querySelectorAll)
    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(3)
  })

  it('cover badge "Cover" renders on index-0 thumbnail only', () => {
    render(
      <PhotoThumbnailGrid
        photos={mockPhotos}
        onPhotosChange={vi.fn()}
      />
    )
    const coverBadges = screen.getAllByText('Cover')
    expect(coverBadges).toHaveLength(1)
  })

  it('renders with empty photos array without crashing', () => {
    render(
      <PhotoThumbnailGrid
        photos={[]}
        onPhotosChange={vi.fn()}
      />
    )
    expect(screen.queryByText('Cover')).toBeNull()
  })
})
