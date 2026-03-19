import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { buildFormSchema, buildDefaultValues } from '@/lib/review/build-form-schema'
import { BLOCKING_FIELD_KEYS, isBlocking } from '@/lib/review/blocking-fields'
import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

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

describe('isBlocking', () => {
  it('returns true for vin', () => expect(isBlocking('vin')).toBe(true))
  it('returns true for registration_number', () => expect(isBlocking('registration_number')).toBe(true))
  it('returns false for pin', () => expect(isBlocking('pin')).toBe(false))
  it('returns true for serial', () => expect(isBlocking('serial')).toBe(true))
  it('returns false for make', () => expect(isBlocking('make')).toBe(false))
  it('returns false for extras', () => expect(isBlocking('extras')).toBe(false))
})

describe('BLOCKING_FIELD_KEYS', () => {
  it('contains exactly vin, registration_number, serial', () => {
    expect(BLOCKING_FIELD_KEYS.has('vin')).toBe(true)
    expect(BLOCKING_FIELD_KEYS.has('registration_number')).toBe(true)
    expect(BLOCKING_FIELD_KEYS.has('pin')).toBe(false)
    expect(BLOCKING_FIELD_KEYS.has('serial')).toBe(true)
    expect(BLOCKING_FIELD_KEYS.size).toBe(3)
  })
})

describe('buildFormSchema', () => {
  it('accepts string for text field', () => {
    const schema = buildFormSchema([textField])
    expect(() => schema.parse({ make: 'MACK' })).not.toThrow()
  })
  it('rejects non-numeric string for number field', () => {
    const schema = buildFormSchema([numberField])
    const result = schema.safeParse({ year: 'abc' })
    expect(result.success).toBe(false)
  })
  it('accepts numeric string for number field', () => {
    const schema = buildFormSchema([numberField])
    expect(() => schema.parse({ year: '2011' })).not.toThrow()
  })
  it('accepts empty string for number field', () => {
    const schema = buildFormSchema([numberField])
    expect(() => schema.parse({ year: '' })).not.toThrow()
  })
  it('accepts string for select field', () => {
    const schema = buildFormSchema([selectField])
    expect(() => schema.parse({ fuel_type: 'Diesel' })).not.toThrow()
  })
  it('accepts string for textarea field', () => {
    const schema = buildFormSchema([textareaField])
    expect(() => schema.parse({ extras: 'Some text' })).not.toThrow()
  })
})

describe('buildDefaultValues', () => {
  const fields = [textField, numberField]
  const extractionResult: ExtractionResult = {
    make: { value: 'MACK', confidence: 'high' },
    year: { value: '2011', confidence: 'medium' },
  }

  it('pre-fills from extraction_result when no savedFields', () => {
    const defaults = buildDefaultValues(fields, extractionResult)
    expect(defaults.make).toBe('MACK')
    expect(defaults.year).toBe('2011')
  })

  it('prefers savedFields over extraction_result', () => {
    const defaults = buildDefaultValues(fields, extractionResult, { make: 'Kenworth' })
    expect(defaults.make).toBe('Kenworth')
    expect(defaults.year).toBe('2011')
  })

  it('defaults to empty string when neither source has value', () => {
    const defaults = buildDefaultValues([textareaField], null)
    expect(defaults.extras).toBe('')
  })

  it('defaults to empty string when extractionResult is null', () => {
    const defaults = buildDefaultValues(fields, null)
    expect(defaults.make).toBe('')
    expect(defaults.year).toBe('')
  })

  it('defaults to empty string when extracted value is null', () => {
    const nullResult: ExtractionResult = { make: { value: null, confidence: null } }
    const defaults = buildDefaultValues([textField], nullResult)
    expect(defaults.make).toBe('')
  })
})
