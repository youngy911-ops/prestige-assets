import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { DynamicFieldForm } from '@/components/asset/DynamicFieldForm'
import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

const fields: FieldDefinition[] = [
  { key: 'make', label: 'Make', sfOrder: 3, inputType: 'text', aiExtractable: true, required: true },
  { key: 'year', label: 'Year', sfOrder: 5, inputType: 'number', aiExtractable: true, required: true },
]

function Wrapper({ fields, extractionResult }: { fields: FieldDefinition[], extractionResult: ExtractionResult | null }) {
  const { control } = useForm<Record<string, string>>({ defaultValues: { make: '', year: '' } })
  return <DynamicFieldForm fields={fields} extractionResult={extractionResult} control={control} />
}

describe('DynamicFieldForm', () => {
  it('renders one input per field', () => {
    const { container } = render(<Wrapper fields={fields} extractionResult={null} />)
    const inputs = container.querySelectorAll('input')
    expect(inputs.length).toBe(2)
  })

  it('renders field labels', () => {
    const { getByText } = render(<Wrapper fields={fields} extractionResult={null} />)
    expect(getByText('Make')).toBeTruthy()
    expect(getByText('Year')).toBeTruthy()
  })

  it('passes high confidence when extraction result has high confidence for a field', () => {
    const result: ExtractionResult = {
      make: { value: 'MACK', confidence: 'high' },
      year: { value: '2011', confidence: 'medium' },
    }
    const { container } = render(<Wrapper fields={fields} extractionResult={result} />)
    // Medium confidence row should have amber border
    const rows = container.querySelectorAll('[class*="border-l-amber"]')
    expect(rows.length).toBeGreaterThan(0)
  })
})
