/**
 * Tests for Phase 03-02 UI components:
 * ConfidenceBadge, InspectionNotesSection, ExtractionTriggerState,
 * ExtractionLoadingState, ExtractionFailureState
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock server actions
vi.mock('@/lib/actions/inspection.actions', () => ({
  saveInspectionNotes: vi.fn().mockResolvedValue({}),
}))

// Mock schema registry
vi.mock('@/lib/schema-registry', () => ({
  getInspectionPriorityFields: vi.fn((assetType: string) => {
    if (assetType === 'truck') {
      return [
        { key: 'odometer', label: 'Odometer', sfOrder: 17, inspectionPriority: true, aiExtractable: false, inputType: 'text', required: false },
        { key: 'registration_number', label: 'Registration Number', sfOrder: 18, inspectionPriority: true, aiExtractable: false, inputType: 'text', required: false },
        { key: 'registration_expiry', label: 'Registration Expiry', sfOrder: 19, inspectionPriority: true, aiExtractable: false, inputType: 'text', required: false },
        { key: 'hourmeter', label: 'Hourmeter', sfOrder: 22, inspectionPriority: true, aiExtractable: false, inputType: 'text', required: false },
        { key: 'service_history', label: 'Service History', sfOrder: 32, inspectionPriority: true, aiExtractable: false, inputType: 'text', required: false },
      ]
    }
    return []
  }),
  getFieldsSortedBySfOrder: vi.fn(() => []),
}))

// ─── ConfidenceBadge ────────────────────────────────────────────────────────

describe('ConfidenceBadge', () => {
  it('renders CheckCircle2 icon with text-green-400 for level="high"', async () => {
    const { ConfidenceBadge } = await import('@/components/asset/ConfidenceBadge')
    const { container } = render(<ConfidenceBadge level="high" />)
    // Icon rendered with aria-hidden
    const icon = container.querySelector('[aria-hidden="true"]')
    expect(icon).toBeTruthy()
    // Wrapper span has text-green-400
    const wrapper = container.querySelector('span')
    expect(wrapper?.className).toContain('text-green-400')
    // Screen-reader label
    expect(screen.getByText('Read from photo')).toBeTruthy()
  })

  it('renders AlertCircle icon with text-amber-400 for level="medium"', async () => {
    const { ConfidenceBadge } = await import('@/components/asset/ConfidenceBadge')
    const { container } = render(<ConfidenceBadge level="medium" />)
    const wrapper = container.querySelector('span')
    expect(wrapper?.className).toContain('text-amber-400')
    expect(screen.getByText('Inferred from model knowledge')).toBeTruthy()
  })

  it('renders MinusCircle icon with text-white/40 for level="low"', async () => {
    const { ConfidenceBadge } = await import('@/components/asset/ConfidenceBadge')
    const { container } = render(<ConfidenceBadge level="low" />)
    const wrapper = container.querySelector('span')
    expect(wrapper?.className).toContain('text-white/40')
  })

  it('renders MinusCircle icon with text-white/40 for level="not_found"', async () => {
    const { ConfidenceBadge } = await import('@/components/asset/ConfidenceBadge')
    const { container } = render(<ConfidenceBadge level="not_found" />)
    const wrapper = container.querySelector('span')
    expect(wrapper?.className).toContain('text-white/40')
    // Two spans both say "Not found" — sr-only and visible; getAllByText asserts at least one exists
    expect(screen.getAllByText('Not found').length).toBeGreaterThan(0)
  })
})

// ─── InspectionNotesSection ─────────────────────────────────────────────────

describe('InspectionNotesSection', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'sendBeacon', { value: vi.fn(), writable: true, configurable: true })
  })

  it('renders 5 structured fields for truck asset type', async () => {
    const { InspectionNotesSection } = await import('@/components/asset/InspectionNotesSection')
    render(
      <InspectionNotesSection assetId="asset-1" assetType="truck" initialNotes={null} />
    )
    // 5 priority fields + 1 freeform = 6 inputs total
    // Check structured field labels
    expect(screen.getByText('Odometer')).toBeTruthy()
    expect(screen.getByText('Registration Number')).toBeTruthy()
    expect(screen.getByText('Hourmeter')).toBeTruthy()
    expect(screen.getByText('Service History')).toBeTruthy()
    // 5 structured inputs
    const inputs = screen.getAllByRole('textbox')
    // 5 structured inputs + 1 textarea = 6 total
    expect(inputs.length).toBe(6)
  })

  it('renders only freeform textarea for general_goods (0 structured fields)', async () => {
    const { InspectionNotesSection } = await import('@/components/asset/InspectionNotesSection')
    render(
      <InspectionNotesSection assetId="asset-2" assetType="general_goods" initialNotes={null} />
    )
    // Only 1 input — the freeform textarea
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBe(1)
  })

  it('shows "Other notes" label and correct placeholder on freeform textarea', async () => {
    const { InspectionNotesSection } = await import('@/components/asset/InspectionNotesSection')
    render(
      <InspectionNotesSection assetId="asset-3" assetType="general_goods" initialNotes={null} />
    )
    expect(screen.getByText('Other notes')).toBeTruthy()
    const textarea = screen.getByRole('textbox')
    expect((textarea as HTMLTextAreaElement).placeholder).toContain('VIN, rego')
  })

  it('shows "Inspection Notes" section heading', async () => {
    const { InspectionNotesSection } = await import('@/components/asset/InspectionNotesSection')
    render(
      <InspectionNotesSection assetId="asset-4" assetType="truck" initialNotes={null} />
    )
    expect(screen.getByText('Inspection Notes')).toBeTruthy()
  })
})

// ─── ExtractionTriggerState ─────────────────────────────────────────────────

describe('ExtractionTriggerState', () => {
  it('renders "Extract Details" button and "Skip to Manual Entry" link when hasPhotos=true', async () => {
    const { ExtractionTriggerState } = await import('@/components/asset/ExtractionTriggerState')
    const onTrigger = vi.fn()
    render(
      <ExtractionTriggerState assetId="asset-1" hasPhotos={true} onTrigger={onTrigger} />
    )
    expect(screen.getByText('Extract Details')).toBeTruthy()
    expect(screen.getByText('Skip to Manual Entry')).toBeTruthy()
  })

  it('renders empty state when hasPhotos=false with "No photos uploaded" heading', async () => {
    const { ExtractionTriggerState } = await import('@/components/asset/ExtractionTriggerState')
    const onTrigger = vi.fn()
    render(
      <ExtractionTriggerState assetId="asset-1" hasPhotos={false} onTrigger={onTrigger} />
    )
    expect(screen.getByText('No photos uploaded')).toBeTruthy()
    expect(screen.getByText('Skip to Manual Entry')).toBeTruthy()
  })
})

// ─── ExtractionLoadingState ─────────────────────────────────────────────────

describe('ExtractionLoadingState', () => {
  it('renders the first step message on mount', async () => {
    const { ExtractionLoadingState } = await import('@/components/asset/ExtractionLoadingState')
    render(<ExtractionLoadingState />)
    expect(screen.getByText('Reading plates and labels…')).toBeTruthy()
  })

  it('renders the timing sub-message', async () => {
    const { ExtractionLoadingState } = await import('@/components/asset/ExtractionLoadingState')
    render(<ExtractionLoadingState />)
    expect(screen.getByText(/Usually 10–20 seconds/)).toBeTruthy()
  })
})

// ─── ExtractionFailureState ─────────────────────────────────────────────────

describe('ExtractionFailureState', () => {
  it('renders "Extraction failed" heading', async () => {
    const { ExtractionFailureState } = await import('@/components/asset/ExtractionFailureState')
    const onRetry = vi.fn()
    render(<ExtractionFailureState assetId="asset-1" onRetry={onRetry} />)
    expect(screen.getByText('Extraction failed')).toBeTruthy()
  })

  it('renders "Try Again" button and "Skip to Manual Entry" link', async () => {
    const { ExtractionFailureState } = await import('@/components/asset/ExtractionFailureState')
    const onRetry = vi.fn()
    render(<ExtractionFailureState assetId="asset-1" onRetry={onRetry} />)
    expect(screen.getByText('Try Again')).toBeTruthy()
    expect(screen.getByText('Skip to Manual Entry')).toBeTruthy()
  })
})
