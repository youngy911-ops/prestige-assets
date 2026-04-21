import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock next/navigation (component now uses useRouter)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// Mock all external dependencies before importing the component
vi.mock('@/lib/actions/photo.actions', () => ({
  insertPhoto: vi.fn().mockResolvedValue({ id: 'photo-123' }),
  getSignedUrl: vi.fn().mockResolvedValue({ signedUrl: 'https://example.com/photo.jpg' }),
  removePhoto: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/utils/image', () => ({
  processImageForUpload: vi.fn().mockResolvedValue(new File([''], 'test.jpg', { type: 'image/jpeg' })),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'u/a/1-test.jpg' }, error: null }),
      }),
    },
  }),
}))

// Import after mocks are set up
const { PhotoUploadZone } = await import('@/components/asset/PhotoUploadZone')

const defaultProps = {
  assetId: 'asset-123',
  userId: 'user-456',
  initialPhotos: [],
}

describe('PhotoUploadZone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state with "No photos yet" heading when no photos', () => {
    render(<PhotoUploadZone {...defaultProps} />)
    expect(screen.getByText('No photos yet')).toBeTruthy()
  })

  it('file input has accept="image/*" and multiple attributes', () => {
    render(<PhotoUploadZone {...defaultProps} />)
    const input = screen.getByTestId('photo-file-input')
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('multiple')
    expect(input).not.toHaveAttribute('capture')
  })

  it('Add Photos button is disabled when photo count is 80', () => {
    const photos80 = Array.from({ length: 80 }, (_, i) => ({
      id: `photo-${i}`,
      storagePath: `u/a/photo-${i}.jpg`,
      signedUrl: `https://example.com/photo-${i}.jpg`,
      sortOrder: i,
    }))
    render(<PhotoUploadZone {...defaultProps} initialPhotos={photos80} />)
    // In photos-present state, find the Add Photos button
    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Add Photos')
    )
    expect(addButton).toBeTruthy()
    expect(addButton).toBeDisabled()
  })

  it('renders "Photos" heading and photo count when photos exist', () => {
    const onePhoto = [{
      id: 'photo-1',
      storagePath: 'u/a/1.jpg',
      signedUrl: 'https://example.com/1.jpg',
      sortOrder: 0,
    }]
    render(<PhotoUploadZone {...defaultProps} initialPhotos={onePhoto} />)
    expect(screen.getByText('Photos')).toBeTruthy()
    expect(screen.getByText(/1 photo/)).toBeTruthy()
  })
})
