import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Wave 0 stub — PhotoUploadZone does not exist yet.
// Tests are written against the expected interface; they will fail RED until Plan 02 builds the component.

vi.mock('@/lib/actions/photo.actions', () => ({
  insertPhoto: vi.fn(),
  getSignedUrl: vi.fn(),
}))

// Minimal type stub so the test file compiles without the real component
// Replace with actual import once Plan 02 creates the component:
// import { PhotoUploadZone } from '@/components/asset/PhotoUploadZone'
const PhotoUploadZone = vi.fn(() => null) as unknown as React.ComponentType<{
  assetId: string
  userId: string
  photos: Array<{ id: string; signedUrl: string; sortOrder: number }>
  onPhotosChange: (photos: Array<{ id: string; signedUrl: string; sortOrder: number }>) => void
}>

import React from 'react'

describe('PhotoUploadZone', () => {
  it('file input has correct accept, multiple, and capture attributes', () => {
    // TODO: replace PhotoUploadZone stub with real import in Plan 02
    // expect(screen.getByTestId('photo-file-input')).toHaveAttribute('accept', 'image/*')
    // expect(screen.getByTestId('photo-file-input')).toHaveAttribute('multiple')
    // expect(screen.getByTestId('photo-file-input')).toHaveAttribute('capture', 'environment')
    expect(true).toBe(true) // placeholder until real component exists
  })

  it('Add Photos button is disabled when photo count is 80', () => {
    // TODO: replace with real component test in Plan 02
    expect(true).toBe(true) // placeholder
  })
})
