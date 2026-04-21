import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MissingInfoChecklist } from '@/components/asset/MissingInfoChecklist'
import type { ChecklistEntry } from '@/lib/review/build-checklist'
import type { FieldDefinition } from '@/lib/schema-registry/types'

const vinField: FieldDefinition = {
  key: 'vin', label: 'VIN', sfOrder: 2, inputType: 'text',
  aiExtractable: true, required: false,
}
const extrasField: FieldDefinition = {
  key: 'extras', label: 'Extras', sfOrder: 33, inputType: 'textarea',
  aiExtractable: false, required: false,
}

const blockingEntry: ChecklistEntry = {
  field: vinField, isBlocking: true, status: 'flagged',
}
const dismissibleEntry: ChecklistEntry = {
  field: extrasField, isBlocking: false, status: 'flagged',
}
const confirmedEntry: ChecklistEntry = {
  field: vinField, isBlocking: true, status: 'confirmed',
}
const unknownEntry: ChecklistEntry = {
  field: vinField, isBlocking: true, status: 'unknown',
}

describe('MissingInfoChecklist', () => {
  it('renders heading "Fields Still Needed"', () => {
    const { getByText } = render(
      <MissingInfoChecklist checklist={[blockingEntry]} onUpdate={vi.fn()} />
    )
    expect(getByText('Fields Still Needed')).toBeTruthy()
  })

  it('renders intro copy', () => {
    const { getByText } = render(
      <MissingInfoChecklist checklist={[blockingEntry]} onUpdate={vi.fn()} />
    )
    expect(getByText(/Fill in above, or mark N\/A to proceed/)).toBeTruthy()
  })

  it('renders "Required" for blocking flagged item', () => {
    const { getByText } = render(
      <MissingInfoChecklist checklist={[blockingEntry]} onUpdate={vi.fn()} />
    )
    expect(getByText('Required')).toBeTruthy()
  })

  it('renders "Optional" for dismissible flagged item', () => {
    const { getByText } = render(
      <MissingInfoChecklist checklist={[dismissibleEntry]} onUpdate={vi.fn()} />
    )
    expect(getByText('Optional')).toBeTruthy()
  })

  it('shows "Not applicable" button only for dismissible item', () => {
    const { queryByText } = render(
      <MissingInfoChecklist checklist={[blockingEntry]} onUpdate={vi.fn()} />
    )
    expect(queryByText('Not applicable')).toBeNull()
  })

  it('shows "Not applicable" button for dismissible flagged item', () => {
    const { getByText } = render(
      <MissingInfoChecklist checklist={[dismissibleEntry]} onUpdate={vi.fn()} />
    )
    expect(getByText('Not applicable')).toBeTruthy()
  })

  it('calls onUpdate with dismissed-na when Not applicable clicked', () => {
    const onUpdate = vi.fn()
    const { getByText } = render(
      <MissingInfoChecklist checklist={[dismissibleEntry]} onUpdate={onUpdate} />
    )
    fireEvent.click(getByText('Not applicable'))
    expect(onUpdate).toHaveBeenCalledWith('extras', 'dismissed-na')
  })

  it('calls onUpdate with unknown when Unknown/not available clicked', () => {
    const onUpdate = vi.fn()
    const { getByText } = render(
      <MissingInfoChecklist checklist={[blockingEntry]} onUpdate={onUpdate} />
    )
    fireEvent.click(getByText('Unknown / not available'))
    expect(onUpdate).toHaveBeenCalledWith('vin', 'unknown')
  })

  it('does not show action buttons for confirmed item', () => {
    const { queryByText } = render(
      <MissingInfoChecklist checklist={[confirmedEntry]} onUpdate={vi.fn()} />
    )
    expect(queryByText('Unknown / not available')).toBeNull()
    expect(queryByText('Not applicable')).toBeNull()
  })

  it('renders nothing when checklist is empty', () => {
    const { container } = render(
      <MissingInfoChecklist checklist={[]} onUpdate={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })
})
