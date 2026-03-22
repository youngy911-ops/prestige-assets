import { describe, it, expect } from 'vitest'
import { parseStructuredFields, extractFreeformNotes } from '@/lib/utils/parseStructuredFields'

describe('parseStructuredFields', () => {
  it('returns {} for null input', () => {
    expect(parseStructuredFields(null)).toEqual({})
  })

  it('returns {} for empty string', () => {
    expect(parseStructuredFields('')).toEqual({})
  })

  it('parses "key: value\\nkey2: value2" into { key: value, key2: value2 }', () => {
    const result = parseStructuredFields('vin: ABC123\nodometer: 187450')
    expect(result).toEqual({ vin: 'ABC123', odometer: '187450' })
  })

  it('excludes the Notes freeform key', () => {
    const result = parseStructuredFields('vin: ABC123\nNotes: runs well')
    expect(result).toEqual({ vin: 'ABC123' })
  })

  it('excludes lines without ": " separator', () => {
    const result = parseStructuredFields('malformed line\nvin: ABC123')
    expect(result).toEqual({ vin: 'ABC123' })
  })

  it('excludes lines with empty value after trim', () => {
    const result = parseStructuredFields('vin:   \nodometer: 187450')
    expect(result).toEqual({ odometer: '187450' })
  })
})

describe('extractFreeformNotes', () => {
  it('returns "" for null input', () => {
    expect(extractFreeformNotes(null)).toBe('')
  })

  it('returns the text after "Notes: " prefix', () => {
    expect(extractFreeformNotes('vin: ABC123\nNotes: runs well')).toBe('runs well')
  })

  it('returns "" when no Notes line is present', () => {
    expect(extractFreeformNotes('vin: ABC123\nodometer: 50000')).toBe('')
  })

  it('returns "" when Notes line has no text after prefix', () => {
    expect(extractFreeformNotes('vin: ABC123\nNotes: ')).toBe('')
  })

  it('works when Notes line appears before other lines', () => {
    expect(extractFreeformNotes('Notes: runs well\nvin: ABC123')).toBe('runs well')
  })
})
