import { describe, it, expect } from 'vitest'
import { SCHEMA_REGISTRY, ASSET_TYPES, getSchema, getSubtypes, getAIExtractableFields } from '@/lib/schema-registry/index'

describe('SCHEMA_REGISTRY structure', () => {
  it('contains exactly 9 asset types', () => {
    expect(Object.keys(SCHEMA_REGISTRY)).toHaveLength(9)
  })

  it('ASSET_TYPES tuple has exactly 9 entries', () => {
    expect(ASSET_TYPES).toHaveLength(9)
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

  it('truck has exactly 25 subtypes — 21 SF plus EWP, Tilt Tray, Flat Deck, plus Tipper', () => {
    const subtypes = getSubtypes('truck')
    expect(subtypes).toHaveLength(25)
    expect(subtypes.map(s => s.key)).toContain('service_truck')
    expect(subtypes.map(s => s.key)).not.toContain('service')
    expect(subtypes.map(s => s.key)).toContain('crane_truck')
    expect(subtypes.map(s => s.key)).toContain('coupe')
    expect(subtypes.map(s => s.key)).toContain('ewp')
    expect(subtypes.map(s => s.key)).toContain('tilt_tray')
    expect(subtypes.map(s => s.key)).toContain('flat_deck')
    expect(subtypes.map(s => s.key)).toContain('prime_mover')
    expect(subtypes.map(s => s.key)).toContain('tipper')
    expect(subtypes.map(s => s.key)).toContain('other')
    const concrete_agitator = subtypes.find(s => s.key === 'concrete_agitator')
    expect(concrete_agitator?.label).toBe('Concrete - Agitator')
    const concrete_pump = subtypes.find(s => s.key === 'concrete_pump')
    expect(concrete_pump?.label).toBe('Concrete - Pump')
  })

  it('trailer has exactly 24 subtypes matching SF list', () => {
    const subtypes = getSubtypes('trailer')
    expect(subtypes).toHaveLength(24)
    expect(subtypes.map(s => s.key)).toContain('walking_floor')
    expect(subtypes.map(s => s.key)).toContain('refrigerated_curtainsider')
    expect(subtypes.map(s => s.key)).toContain('timber_jinker')
    expect(subtypes.map(s => s.key)).toContain('low_loader')
    expect(subtypes.map(s => s.key)).toContain('coupe')
    expect(subtypes.map(s => s.key)).not.toContain('extendable')
    expect(subtypes.map(s => s.key)).not.toContain('drop_deck')
  })

  it('earthmoving has exactly 19 subtypes with Bulldozer/Crawler Tractor merged', () => {
    const subtypes = getSubtypes('earthmoving')
    expect(subtypes).toHaveLength(19)
    expect(subtypes.map(s => s.key)).toContain('bulldozer_crawler_tractor')
    expect(subtypes.map(s => s.key)).not.toContain('bulldozer')
    expect(subtypes.map(s => s.key)).not.toContain('crawler_tractor')
    expect(subtypes.map(s => s.key)).toContain('backhoe')
    expect(subtypes.map(s => s.key)).not.toContain('backhoe_loader')
    expect(subtypes.map(s => s.key)).not.toContain('telehandler')
    expect(subtypes.map(s => s.key)).not.toContain('trencher')
    expect(subtypes.map(s => s.key)).toContain('skid_steer_loader')
    expect(subtypes.map(s => s.key)).toContain('motor_grader')
    expect(subtypes.map(s => s.key)).toContain('other')
    const merged = subtypes.find(s => s.key === 'bulldozer_crawler_tractor')
    expect(merged?.label).toBe('Bulldozer/Crawler Tractor')
    const conveyors = subtypes.find(s => s.key === 'conveyors_stackers')
    expect(conveyors?.label).toBe('Conveyors / Stackers')
  })

  it('agriculture has exactly 12 subtypes — new SF selector', () => {
    const subtypes = getSubtypes('agriculture')
    expect(subtypes).toHaveLength(12)
    expect(subtypes.map(s => s.key)).toContain('mower_conditioner')
    expect(subtypes.map(s => s.key)).toContain('combine_harvester')
    expect(subtypes.map(s => s.key)).toContain('air_seeder')
    expect(subtypes.map(s => s.key)).toContain('coupe')
    expect(subtypes.map(s => s.key)).not.toContain('header')
    expect(subtypes.map(s => s.key)).not.toContain('sprayer')
    expect(subtypes.map(s => s.key)).not.toContain('planter')
    expect(subtypes.map(s => s.key)).not.toContain('cultivation')
    const mower = subtypes.find(s => s.key === 'mower_conditioner')
    expect(mower?.label).toBe('Mower/Conditioner')
  })

  it('forklift has exactly 9 subtypes — new SF selector with telehandler', () => {
    const subtypes = getSubtypes('forklift')
    expect(subtypes).toHaveLength(9)
    expect(subtypes.map(s => s.key)).toContain('telehandler')
    expect(subtypes.map(s => s.key)).toContain('electric_pallet_jack')
    expect(subtypes.map(s => s.key)).toContain('walkie_stacker')
    expect(subtypes.map(s => s.key)).toContain('ewp')
    expect(subtypes.map(s => s.key)).not.toContain('counterbalance')
    expect(subtypes.map(s => s.key)).not.toContain('reach_truck')
    expect(subtypes.map(s => s.key)).not.toContain('order_picker')
  })

  it('caravan has exactly 5 subtypes — motorhome key (no space)', () => {
    const subtypes = getSubtypes('caravan')
    expect(subtypes).toHaveLength(5)
    expect(subtypes.map(s => s.key)).toContain('motorhome')
    expect(subtypes.map(s => s.key)).not.toContain('motor_home')
    expect(subtypes.map(s => s.key)).toContain('coupe')
    expect(subtypes.map(s => s.key)).toContain('camper_trailer')
    const motorhome = subtypes.find(s => s.key === 'motorhome')
    expect(motorhome?.label).toBe('Motorhome')
  })

  it('marine has exactly 10 subtypes replacing Boat/Yacht/Jet Ski', () => {
    const subtypes = getSubtypes('marine')
    expect(subtypes).toHaveLength(10)
    expect(subtypes.map(s => s.key)).toContain('personal_watercraft')
    expect(subtypes.map(s => s.key)).toContain('trailer_boat')
    expect(subtypes.map(s => s.key)).toContain('tug')
    expect(subtypes.map(s => s.key)).toContain('coupe')
    expect(subtypes.map(s => s.key)).not.toContain('boat')
    expect(subtypes.map(s => s.key)).not.toContain('yacht')
    expect(subtypes.map(s => s.key)).not.toContain('jet_ski')
  })

  it('general_goods has exactly 16 subtypes matching SF list', () => {
    const subtypes = getSubtypes('general_goods')
    expect(subtypes).toHaveLength(16)
    expect(subtypes.map(s => s.key)).toContain('jewellery_watches_collectables')
    expect(subtypes.map(s => s.key)).toContain('gardening_landscaping')
    expect(subtypes.map(s => s.key)).toContain('tools_toolboxes')
    expect(subtypes.map(s => s.key)).toContain('plant_equipment')
    expect(subtypes.map(s => s.key)).not.toContain('tools_equipment')
    expect(subtypes.map(s => s.key)).not.toContain('workshop_equipment')
    expect(subtypes.map(s => s.key)).not.toContain('office_it')
    const jewellery = subtypes.find(s => s.key === 'jewellery_watches_collectables')
    expect(jewellery?.label).toBe('Jewellery/Watches/Collectables')
    const gardening = subtypes.find(s => s.key === 'gardening_landscaping')
    expect(gardening?.label).toBe('Gardening & Landscaping')
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

  it('general_goods has aiExtractable fields: make, model, year, serial_number, extras', () => {
    expect(getAIExtractableFields('general_goods')).toEqual(['make', 'model', 'year', 'serial_number', 'extras'])
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
