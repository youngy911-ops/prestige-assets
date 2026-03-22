import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { InspectionNotesSection } from '@/components/asset/InspectionNotesSection'

vi.mock('server-only', () => ({}))

const mockSaveInspectionNotes = vi.fn()
vi.mock('@/lib/actions/inspection.actions', () => ({
  saveInspectionNotes: (...args: unknown[]) => mockSaveInspectionNotes(...args),
}))

vi.mock('@/lib/schema-registry', () => ({
  getInspectionPriorityFields: () => [
    { key: 'vin', label: 'VIN', inputType: 'text' },
    { key: 'odometer', label: 'Odometer', inputType: 'number' },
  ],
}))

const DEFAULT_PROPS = {
  assetId: 'asset-123',
  assetType: 'truck' as const,
}

describe('InspectionNotesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders input fields with defaultValue from parsed initialNotes', () => {
    render(
      <InspectionNotesSection
        {...DEFAULT_PROPS}
        initialNotes="vin: 1HGCM82633A123456\nodometer: 187450\nNotes: runs well"
      />
    )
    const vinInput = screen.getByDisplayValue('1HGCM82633A123456')
    expect(vinInput).toBeTruthy()
    const odometerInput = screen.getByDisplayValue('187450')
    expect(odometerInput).toBeTruthy()
  })

  it('first autosave after reload preserves all structured fields, not just the changed one', async () => {
    vi.useFakeTimers()
    render(
      <InspectionNotesSection
        {...DEFAULT_PROPS}
        initialNotes="vin: 1HGCM82633A123456\nodometer: 187450"
      />
    )
    const odometerInput = screen.getByDisplayValue('187450')
    fireEvent.change(odometerInput, { target: { value: '200000' } })
    await act(async () => { vi.advanceTimersByTime(600) })
    expect(mockSaveInspectionNotes).toHaveBeenCalledTimes(1)
    const savedNotes: string = mockSaveInspectionNotes.mock.calls[0][1]
    expect(savedNotes).toContain('vin: 1HGCM82633A123456')
    expect(savedNotes).toContain('odometer: 200000')
  })

  it('textarea defaultValue shows only freeform notes, not the full serialised blob', () => {
    render(
      <InspectionNotesSection
        {...DEFAULT_PROPS}
        initialNotes="vin: ABC123\nNotes: runs well"
      />
    )
    const textarea = screen.getByRole('textbox', { name: /other notes/i })
    expect((textarea as HTMLTextAreaElement).defaultValue).toBe('runs well')
  })

  it('textarea defaultValue is empty when no Notes line is present', () => {
    render(
      <InspectionNotesSection
        {...DEFAULT_PROPS}
        initialNotes="vin: ABC123"
      />
    )
    const textarea = screen.getByRole('textbox', { name: /other notes/i })
    expect((textarea as HTMLTextAreaElement).defaultValue).toBe('')
  })

  it('persistNotes is called synchronously on unmount even if debounce has not fired', () => {
    vi.useFakeTimers()
    const { unmount } = render(
      <InspectionNotesSection
        {...DEFAULT_PROPS}
        initialNotes="vin: ABC123\nodometer: 50000"
      />
    )
    const vinInput = screen.getByDisplayValue('ABC123')
    fireEvent.change(vinInput, { target: { value: 'XYZ999' } })
    // Do NOT advance timers — debounce has not fired yet
    expect(mockSaveInspectionNotes).not.toHaveBeenCalled()
    unmount()
    // Flush happens synchronously on unmount
    expect(mockSaveInspectionNotes).toHaveBeenCalledTimes(1)
  })
})
