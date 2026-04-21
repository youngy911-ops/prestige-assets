/**
 * Tests for Phase 03-02 Task 2:
 * ExtractionResultPanel, ExtractionPageClient, PhotosPageCTA
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/navigation
const mockRouterPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

// Mock schema registry for ExtractionResultPanel
vi.mock('@/lib/schema-registry', () => ({
  getFieldsSortedBySfOrder: vi.fn((assetType: string) => {
    if (assetType === 'truck') {
      return [
        { key: 'make', label: 'Make', sfOrder: 1, aiExtractable: true, inputType: 'text', required: true },
        { key: 'model', label: 'Model', sfOrder: 2, aiExtractable: true, inputType: 'text', required: true },
        { key: 'year', label: 'Year', sfOrder: 3, aiExtractable: true, inputType: 'number', required: false },
      ]
    }
    return []
  }),
  getInspectionPriorityFields: vi.fn(() => []),
}))

// Mock inspection actions
vi.mock('@/lib/actions/inspection.actions', () => ({
  saveInspectionNotes: vi.fn().mockResolvedValue({}),
}))

// ─── ExtractionResultPanel ───────────────────────────────────────────────────

describe('ExtractionResultPanel', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
  })

  it('renders one row per field from getFieldsSortedBySfOrder', async () => {
    const { ExtractionResultPanel } = await import('@/components/asset/ExtractionResultPanel')
    const extractionResult = {
      make: { value: 'Kenworth', confidence: 'high' as const },
      model: { value: null, confidence: null },
      year: { value: '2019', confidence: 'medium' as const },
    }
    render(
      <ExtractionResultPanel
        assetId="asset-1"
        assetType="truck"
        extractionResult={extractionResult}
        onRerun={vi.fn()}
      />
    )
    // Found fields are visible immediately
    expect(screen.getByText('Make')).toBeTruthy()
    expect(screen.getByText('Year')).toBeTruthy()
    // Not-found fields are in a collapsed section — expand it first
    const toggleButton = screen.getByRole('button', { name: /not found/i })
    fireEvent.click(toggleButton)
    expect(screen.getByText('Model')).toBeTruthy()
  })

  it('shows extracted value in white bold when value is present', async () => {
    const { ExtractionResultPanel } = await import('@/components/asset/ExtractionResultPanel')
    const extractionResult = {
      make: { value: 'Kenworth', confidence: 'high' as const },
      model: { value: null, confidence: null },
      year: { value: null, confidence: null },
    }
    render(
      <ExtractionResultPanel
        assetId="asset-1"
        assetType="truck"
        extractionResult={extractionResult}
        onRerun={vi.fn()}
      />
    )
    expect(screen.getByText('Kenworth')).toBeTruthy()
  })

  it('shows "Not found" for fields with null value', async () => {
    const { ExtractionResultPanel } = await import('@/components/asset/ExtractionResultPanel')
    const extractionResult = {
      make: { value: null, confidence: null },
      model: { value: null, confidence: null },
      year: { value: null, confidence: null },
    }
    render(
      <ExtractionResultPanel
        assetId="asset-1"
        assetType="truck"
        extractionResult={extractionResult}
        onRerun={vi.fn()}
      />
    )
    // Not-found fields are collapsed by default — expand the section first
    const toggleButton = screen.getByRole('button', { name: /not found/i })
    fireEvent.click(toggleButton)
    const notFoundElements = screen.getAllByText('Not found')
    expect(notFoundElements.length).toBeGreaterThan(0)
  })

  it('renders "Proceed to Review" CTA button', async () => {
    const { ExtractionResultPanel } = await import('@/components/asset/ExtractionResultPanel')
    render(
      <ExtractionResultPanel
        assetId="asset-1"
        assetType="truck"
        extractionResult={{}}
        onRerun={vi.fn()}
      />
    )
    expect(screen.getByText('Proceed to Review')).toBeTruthy()
  })

  it('renders "Re-run Extraction" secondary button', async () => {
    const { ExtractionResultPanel } = await import('@/components/asset/ExtractionResultPanel')
    render(
      <ExtractionResultPanel
        assetId="asset-1"
        assetType="truck"
        extractionResult={{}}
        onRerun={vi.fn()}
      />
    )
    expect(screen.getByText('Re-run Extraction')).toBeTruthy()
  })

  it('"Proceed to Review" navigates to /assets/{assetId}/review on click', async () => {
    const { ExtractionResultPanel } = await import('@/components/asset/ExtractionResultPanel')
    render(
      <ExtractionResultPanel
        assetId="asset-1"
        assetType="truck"
        extractionResult={{}}
        onRerun={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('Proceed to Review'))
    expect(mockRouterPush).toHaveBeenCalledWith('/assets/asset-1/review')
  })
})

// ─── ExtractionPageClient ────────────────────────────────────────────────────

describe('ExtractionPageClient', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
    Object.defineProperty(navigator, 'sendBeacon', { value: vi.fn(), writable: true, configurable: true })
  })

  it('shows ExtractionTriggerState when initialExtractionResult is null', async () => {
    const { ExtractionPageClient } = await import('@/components/asset/ExtractionPageClient')
    render(
      <ExtractionPageClient
        assetId="asset-1"
        assetType="truck"
        initialExtractionResult={null}
        inspectionNotes={null}
        hasPhotos={true}
      />
    )
    expect(screen.getByText('Extract Details')).toBeTruthy()
  })

  it('shows ExtractionResultPanel when initialExtractionResult is provided', async () => {
    const { ExtractionPageClient } = await import('@/components/asset/ExtractionPageClient')
    render(
      <ExtractionPageClient
        assetId="asset-1"
        assetType="truck"
        initialExtractionResult={{ make: { value: 'Kenworth', confidence: 'high' } }}
        inspectionNotes={null}
        hasPhotos={true}
      />
    )
    expect(screen.getByText('Proceed to Review')).toBeTruthy()
  })
})

// ─── PhotosPageCTA ───────────────────────────────────────────────────────────

describe('PhotosPageCTA', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
  })

  it('renders "Extract & Review" button', async () => {
    const { PhotosPageCTA } = await import('@/components/asset/PhotosPageCTA')
    render(<PhotosPageCTA assetId="asset-1" />)
    expect(screen.getByText('Extract & Review')).toBeTruthy()
  })

  it('navigates to /extract?autostart=1 on click', async () => {
    const { PhotosPageCTA } = await import('@/components/asset/PhotosPageCTA')
    render(<PhotosPageCTA assetId="asset-1" />)
    fireEvent.click(screen.getByText('Extract & Review'))
    expect(mockRouterPush).toHaveBeenCalledWith('/assets/asset-1/extract?autostart=1')
  })
})
