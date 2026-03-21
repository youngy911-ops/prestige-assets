import { describe, it, expect } from 'vitest'
import { generateFieldsBlock } from '@/lib/output/generateFieldsBlock'
import { getFieldsSortedBySfOrder } from '@/lib/schema-registry'

describe('generateFieldsBlock', () => {
  it('returns a string with every line matching "Label: value" format', () => {
    const result = generateFieldsBlock('truck', { vin: 'ABC123' })
    const lines = result.split('\n')
    lines.forEach(line => {
      expect(line).toMatch(/^.+: .*$/)
    })
  })

  it('includes fields with null value as "Label: " (not omitted)', () => {
    const fields = getFieldsSortedBySfOrder('truck')
    const nullFields: Record<string, string> = {}
    // Pass no fields — all will be null/missing
    const result = generateFieldsBlock('truck', nullFields)
    const lines = result.split('\n')
    expect(lines.length).toBe(fields.length)
    // Every line ends with ': ' (colon-space, no value)
    lines.forEach(line => {
      expect(line).toMatch(/: $/)
    })
  })

  it('includes fields with undefined value as "Label: "', () => {
    const result = generateFieldsBlock('truck', {} as Record<string, string>)
    const lines = result.split('\n')
    lines.forEach(line => {
      expect(line).toMatch(/^.+: $/)
    })
  })

  it('includes fields with empty string value as "Label: "', () => {
    // Get truck fields and set all to empty string
    const fields = getFieldsSortedBySfOrder('truck')
    const emptyFields = Object.fromEntries(fields.map(f => [f.key, '']))
    const result = generateFieldsBlock('truck', emptyFields)
    const lines = result.split('\n')
    lines.forEach(line => {
      expect(line).toMatch(/^.+: $/)
    })
  })

  it('line count equals schema field count for truck', () => {
    const schemaFields = getFieldsSortedBySfOrder('truck')
    const result = generateFieldsBlock('truck', {})
    const lines = result.split('\n')
    expect(lines.length).toBe(schemaFields.length)
  })

  it('first line uses label of field with lowest sfOrder', () => {
    const schemaFields = getFieldsSortedBySfOrder('truck')
    const firstField = schemaFields[0]
    const result = generateFieldsBlock('truck', { [firstField.key]: 'TestValue' })
    const firstLine = result.split('\n')[0]
    expect(firstLine).toBe(`${firstField.label}: TestValue`)
  })

  it('snapshot: truck with representative field values', () => {
    const result = generateFieldsBlock('truck', {
      vin: '1FUJA6CK49DAB1234',
      make: 'Kenworth',
      model: 'T610',
      year: '2019',
      registration: 'TRK123',
      odometer: '450000',
    })
    expect(result).toMatchSnapshot()
  })

  it('snapshot: truck with all fields empty', () => {
    const result = generateFieldsBlock('truck', {})
    expect(result).toMatchSnapshot()
  })

  it('snapshot: trailer with all fields empty', () => {
    const result = generateFieldsBlock('trailer', {})
    expect(result).toMatchSnapshot()
  })

  it('snapshot: earthmoving with all fields empty', () => {
    const result = generateFieldsBlock('earthmoving', {})
    expect(result).toMatchSnapshot()
  })

  it('snapshot: general_goods with all fields empty', () => {
    const result = generateFieldsBlock('general_goods', {})
    expect(result).toMatchSnapshot()
  })
})
