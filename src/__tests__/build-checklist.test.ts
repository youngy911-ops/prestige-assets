import { describe, it, expect } from 'vitest'
import { buildChecklist, canSave } from '@/lib/review/build-checklist'
import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

const vinField: FieldDefinition = {
  key: 'vin', label: 'VIN', sfOrder: 2, inputType: 'text',
  aiExtractable: true, required: false, inspectionPriority: true,
}
const makeField: FieldDefinition = {
  key: 'make', label: 'Make', sfOrder: 3, inputType: 'text',
  aiExtractable: true, required: true,
}
const extrasField: FieldDefinition = {
  key: 'extras', label: 'Extras', sfOrder: 33, inputType: 'textarea',
  aiExtractable: false, required: true,
}

describe('buildChecklist', () => {
  it('includes field with null extraction value and empty current value', () => {
    const result: ExtractionResult = { vin: { value: null, confidence: null } }
    const checklist = buildChecklist([vinField], result, { vin: '' })
    expect(checklist).toHaveLength(1)
    expect(checklist[0].field.key).toBe('vin')
  })

  it('includes field with low confidence and empty current value', () => {
    const result: ExtractionResult = { vin: { value: 'ABC', confidence: 'low' } }
    const checklist = buildChecklist([vinField], result, { vin: '' })
    expect(checklist).toHaveLength(1)
  })

  it('excludes field with high confidence and non-null value', () => {
    const result: ExtractionResult = { make: { value: 'MACK', confidence: 'high' } }
    const checklist = buildChecklist([makeField], result, { make: 'MACK' })
    expect(checklist).toHaveLength(0)
  })

  it('excludes field when current form value is non-empty (regardless of extraction)', () => {
    const result: ExtractionResult = { vin: { value: null, confidence: null } }
    const checklist = buildChecklist([vinField], result, { vin: '1HGCM826' })
    expect(checklist).toHaveLength(0)
  })

  it('excludes field with medium confidence and non-null value', () => {
    const result: ExtractionResult = { make: { value: 'MACK', confidence: 'medium' } }
    const checklist = buildChecklist([makeField], result, { make: '' })
    expect(checklist).toHaveLength(0)
  })

  it('sets isBlocking true for vin', () => {
    const result: ExtractionResult = { vin: { value: null, confidence: null } }
    const checklist = buildChecklist([vinField], result, { vin: '' })
    expect(checklist[0].isBlocking).toBe(true)
  })

  it('sets isBlocking false for extras', () => {
    const checklist = buildChecklist([extrasField], null, { extras: '' })
    expect(checklist[0].isBlocking).toBe(false)
  })

  it('uses status from savedState when available', () => {
    const result: ExtractionResult = { vin: { value: null, confidence: null } }
    const checklist = buildChecklist([vinField], result, { vin: '' }, { vin: 'unknown' })
    expect(checklist[0].status).toBe('unknown')
  })

  it('defaults status to flagged when not in savedState', () => {
    const result: ExtractionResult = { vin: { value: null, confidence: null } }
    const checklist = buildChecklist([vinField], result, { vin: '' })
    expect(checklist[0].status).toBe('flagged')
  })
})

describe('canSave', () => {
  it('returns false when a blocking field is flagged', () => {
    const checklist = [
      { field: vinField, isBlocking: true, status: 'flagged' as const },
    ]
    expect(canSave(checklist)).toBe(false)
  })

  it('returns true when all blocking fields are confirmed', () => {
    const checklist = [
      { field: vinField, isBlocking: true, status: 'confirmed' as const },
    ]
    expect(canSave(checklist)).toBe(true)
  })

  it('returns true when all blocking fields are unknown', () => {
    const checklist = [
      { field: vinField, isBlocking: true, status: 'unknown' as const },
    ]
    expect(canSave(checklist)).toBe(true)
  })

  it('returns true when all blocking fields are dismissed-na', () => {
    const checklist = [
      { field: vinField, isBlocking: true, status: 'dismissed-na' as const },
    ]
    expect(canSave(checklist)).toBe(true)
  })

  it('returns true when checklist is empty', () => {
    expect(canSave([])).toBe(true)
  })

  it('returns true when only non-blocking entries exist regardless of status', () => {
    const checklist = [
      { field: extrasField, isBlocking: false, status: 'flagged' as const },
    ]
    expect(canSave(checklist)).toBe(true)
  })
})
