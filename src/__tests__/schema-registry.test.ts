import { describe, it, expect } from 'vitest'
import { SCHEMA_REGISTRY, ASSET_TYPES, getSchema, getSubtypes, getAIExtractableFields } from '@/lib/schema-registry/index'

describe('SCHEMA_REGISTRY structure', () => {
  it('contains exactly 8 asset types', () => {
    expect(Object.keys(SCHEMA_REGISTRY)).toHaveLength(8)
  })

  it('ASSET_TYPES tuple has exactly 8 entries', () => {
    expect(ASSET_TYPES).toHaveLength(8)
  })

  it('every asset type in ASSET_TYPES has a corresponding registry entry', () => {
    for (const type of ASSET_TYPES) {
      expect(SCHEMA_REGISTRY[type]).toBeDefined()
    }
  })

  it('every schema has at least 1 subtype', () => {
    for (const type of ASSET_TYPES) {
      const schema = getSchema(type)
      expect(schema.subtypes.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('general_goods has exactly 1 subtype with key "general"', () => {
    const subtypes = getSubtypes('general_goods')
    expect(subtypes).toHaveLength(1)
    expect(subtypes[0].key).toBe('general')
  })

  it('caravan has hasGlassValuation: true', () => {
    expect(getSchema('caravan').hasGlassValuation).toBe(true)
  })

  it('no other type has hasGlassValuation: true', () => {
    const typesWithGlass = ASSET_TYPES.filter(t => t !== 'caravan' && getSchema(t).hasGlassValuation)
    expect(typesWithGlass).toHaveLength(0)
  })
})

describe('FieldDefinition completeness', () => {
  for (const type of ASSET_TYPES) {
    describe(`${type} schema`, () => {
      it('every field has all required properties', () => {
        const schema = getSchema(type)
        for (const field of schema.fields) {
          expect(field.key, `${type}.${field.key} missing key`).toBeTruthy()
          expect(field.label, `${type}.${field.key} missing label`).toBeTruthy()
          expect(typeof field.sfOrder, `${type}.${field.key} sfOrder not number`).toBe('number')
          expect(typeof field.aiExtractable, `${type}.${field.key} aiExtractable not boolean`).toBe('boolean')
          expect(typeof field.required, `${type}.${field.key} required not boolean`).toBe('boolean')
          expect(['text', 'number', 'select', 'textarea'], `${type}.${field.key} invalid inputType`).toContain(field.inputType)
        }
      })

      it('sfOrder values are unique within the schema', () => {
        const schema = getSchema(type)
        const orders = schema.fields.map(f => f.sfOrder)
        expect(new Set(orders).size).toBe(orders.length)
      })

      it('select fields have options array with at least 1 option', () => {
        const schema = getSchema(type)
        for (const field of schema.fields.filter(f => f.inputType === 'select')) {
          expect(field.options, `${type}.${field.key} select field has no options`).toBeDefined()
          expect(field.options!.length).toBeGreaterThan(0)
        }
      })
    })
  }
})

describe('AI-extractable fields', () => {
  it('truck has vin flagged as aiExtractable', () => {
    expect(getAIExtractableFields('truck')).toContain('vin')
  })

  it('truck has make, model, year flagged as aiExtractable', () => {
    const fields = getAIExtractableFields('truck')
    expect(fields).toContain('make')
    expect(fields).toContain('model')
    expect(fields).toContain('year')
  })

  it('earthmoving has pin and serial flagged as aiExtractable', () => {
    const fields = getAIExtractableFields('earthmoving')
    expect(fields).toContain('pin')
    expect(fields).toContain('serial')
  })

  it('general_goods has aiExtractable fields: make, model, serial_number, dom', () => {
    expect(getAIExtractableFields('general_goods')).toEqual(['make', 'model', 'serial_number', 'dom'])
  })
})

describe('aiHint convention enforcement', () => {
  it('every aiExtractable: true field with non-textarea inputType has aiHint defined', () => {
    for (const type of ASSET_TYPES) {
      const schema = getSchema(type)
      for (const field of schema.fields) {
        if (field.aiExtractable && field.inputType !== 'textarea') {
          expect(
            field.aiHint,
            `${type}.${field.key} is aiExtractable but missing aiHint`
          ).toBeDefined()
          expect(
            field.aiHint!.length,
            `${type}.${field.key} aiHint is empty string`
          ).toBeGreaterThan(0)
        }
      }
    }
  })
})
