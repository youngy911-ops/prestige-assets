import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { FieldRow } from '@/components/asset/FieldRow'
import type { FieldDefinition } from '@/lib/schema-registry/types'

const textField: FieldDefinition = {
  key: 'make', label: 'Make', sfOrder: 3, inputType: 'text',
  aiExtractable: true, required: true,
}
const numberField: FieldDefinition = {
  key: 'year', label: 'Year', sfOrder: 5, inputType: 'number',
  aiExtractable: true, required: true,
}
const selectField: FieldDefinition = {
  key: 'fuel_type', label: 'Fuel Type', sfOrder: 14, inputType: 'select',
  options: ['Diesel', 'Petrol'], aiExtractable: true, required: false,
}
const textareaField: FieldDefinition = {
  key: 'extras', label: 'Extras', sfOrder: 33, inputType: 'textarea',
  aiExtractable: false, required: false,
}

// Wrapper to provide a real RHF control
function FieldRowWrapper({ field, confidence }: { field: FieldDefinition; confidence: 'high' | 'medium' | 'low' | 'not_found' }) {
  const { control } = useForm<Record<string, string>>({
    defaultValues: { [field.key]: '' },
  })
  return <FieldRow field={field} confidence={confidence} control={control} />
}

describe('FieldRow confidence highlighting', () => {
  it('applies no border-l class for high confidence', () => {
    const { container } = render(
      <FieldRowWrapper field={textField} confidence="high" />
    )
    const row = container.firstChild as HTMLElement
    expect(row.className).not.toMatch(/border-l-red/)
    expect(row.className).not.toMatch(/border-l-amber/)
  })

  it('applies amber border for medium confidence', () => {
    const { container } = render(
      <FieldRowWrapper field={textField} confidence="medium" />
    )
    const row = container.firstChild as HTMLElement
    expect(row.className).toMatch(/border-l-amber-400/)
  })

  it('applies red border for low confidence', () => {
    const { container } = render(
      <FieldRowWrapper field={textField} confidence="low" />
    )
    const row = container.firstChild as HTMLElement
    expect(row.className).toMatch(/border-l-red-500/)
  })

  it('applies red border for not_found confidence', () => {
    const { container } = render(
      <FieldRowWrapper field={textField} confidence="not_found" />
    )
    const row = container.firstChild as HTMLElement
    expect(row.className).toMatch(/border-l-red-500/)
  })
})

describe('FieldRow input widget by inputType', () => {
  it('renders input for text field', () => {
    const { container } = render(
      <FieldRowWrapper field={textField} confidence="high" />
    )
    expect(container.querySelector('input')).toBeTruthy()
  })

  it('renders input for number field', () => {
    const { container } = render(
      <FieldRowWrapper field={numberField} confidence="high" />
    )
    expect(container.querySelector('input')).toBeTruthy()
  })

  it('renders textarea for textarea field', () => {
    const { container } = render(
      <FieldRowWrapper field={textareaField} confidence="not_found" />
    )
    expect(container.querySelector('textarea')).toBeTruthy()
  })

  it('renders select trigger for select field', () => {
    const { getByRole } = render(
      <FieldRowWrapper field={selectField} confidence="not_found" />
    )
    expect(getByRole('combobox')).toBeTruthy()
  })
})
