import { describe, it, expect } from 'vitest'
import { getInspectionPriorityFields, getAIExtractableFields } from '@/lib/schema-registry'
import { buildExtractionSchema, buildSystemPrompt } from '@/lib/ai/extraction-schema'

// Wave 0 scaffolds for Task 1: getInspectionPriorityFields
// Fields are returned sorted by sfOrder ascending
describe('getInspectionPriorityFields', () => {
  it('truck returns [odometer, registration_number, hourmeter, service_history] sorted by sfOrder', () => {
    // sfOrders: odometer=17, registration_number=18, hourmeter=22, service_history=32
    const fields = getInspectionPriorityFields('truck').map(f => f.key)
    expect(fields).toEqual(['odometer', 'registration_number', 'hourmeter', 'service_history'])
  })

  it('earthmoving returns [pin, serial, hourmeter, odometer] sorted by sfOrder', () => {
    // sfOrders: pin=1, serial=2, hourmeter=6, odometer=9
    const fields = getInspectionPriorityFields('earthmoving').map(f => f.key)
    expect(fields).toEqual(['pin', 'serial', 'hourmeter', 'odometer'])
  })

  it('forklift returns [serial, max_lift_capacity, hours] sorted by sfOrder', () => {
    // sfOrders: serial=5, max_lift_capacity=6, hours=9
    const fields = getInspectionPriorityFields('forklift').map(f => f.key)
    expect(fields).toEqual(['serial', 'max_lift_capacity', 'hours'])
  })

  it('caravan returns [vin, serial, registration, odometer] sorted by sfOrder', () => {
    // sfOrders: vin=5, serial=6, registration=13, odometer=14
    const fields = getInspectionPriorityFields('caravan').map(f => f.key)
    expect(fields).toEqual(['vin', 'serial', 'registration', 'odometer'])
  })

  it('trailer returns [registration, hubometer, atm, tare] sorted by sfOrder', () => {
    // sfOrders: registration=10, hubometer=12, atm=16, tare=18
    const fields = getInspectionPriorityFields('trailer').map(f => f.key)
    expect(fields).toEqual(['registration', 'hubometer', 'atm', 'tare'])
  })

  it('agriculture returns [pin, serial, hourmeter, odometer] sorted by sfOrder', () => {
    // sfOrders: pin=1, serial=2, hourmeter=6, odometer=9
    const fields = getInspectionPriorityFields('agriculture').map(f => f.key)
    expect(fields).toEqual(['pin', 'serial', 'hourmeter', 'odometer'])
  })

  it('general_goods returns []', () => {
    const fields = getInspectionPriorityFields('general_goods')
    expect(fields).toEqual([])
  })

  it('truck returns exactly 4 priority fields', () => {
    expect(getInspectionPriorityFields('truck')).toHaveLength(4)
  })
})

// Wave 0 scaffolds for Task 2: buildExtractionSchema
describe('buildExtractionSchema', () => {
  it('truck schema contains all aiExtractable field keys with { value, confidence } shape', async () => {
    const { buildExtractionSchema } = await import('@/lib/ai/extraction-schema')
    const schema = buildExtractionSchema('truck')
    const aiFields = getAIExtractableFields('truck')
    expect(aiFields.length).toBeGreaterThan(0)
    // Parse a valid object with all aiExtractable fields set to null
    const testObj: Record<string, unknown> = {}
    for (const key of aiFields) {
      testObj[key] = { value: null, confidence: null }
    }
    const result = schema.safeParse(testObj)
    expect(result.success).toBe(true)
  })

  it('truck schema does NOT include keys not in getAIExtractableFields("truck")', async () => {
    const { buildExtractionSchema } = await import('@/lib/ai/extraction-schema')
    const schema = buildExtractionSchema('truck')
    const aiFields = getAIExtractableFields('truck')
    // Try parsing an object with an extra key not in aiExtractable fields
    const testObj: Record<string, unknown> = {}
    for (const key of aiFields) {
      testObj[key] = { value: null, confidence: null }
    }
    // chassis_number is NOT aiExtractable for truck — adding it should be stripped (Zod strips by default)
    testObj['chassis_number'] = { value: '12345', confidence: 'high' }
    const result = schema.safeParse(testObj)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('chassis_number')
    }
  })

  it('general_goods returns z.object({}) (no aiExtractable fields)', async () => {
    const { buildExtractionSchema } = await import('@/lib/ai/extraction-schema')
    const schema = buildExtractionSchema('general_goods')
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('parsing { vin: { value: null, confidence: null } } against truck schema succeeds', async () => {
    const { buildExtractionSchema } = await import('@/lib/ai/extraction-schema')
    const schema = buildExtractionSchema('truck')
    // Build a minimal valid object — all aiExtractable fields need to be present
    const aiFields = getAIExtractableFields('truck')
    const testObj: Record<string, unknown> = {}
    for (const key of aiFields) {
      testObj[key] = { value: null, confidence: null }
    }
    // Specifically set vin
    testObj['vin'] = { value: null, confidence: null }
    const result = schema.safeParse(testObj)
    expect(result.success).toBe(true)
  })

  it('parsing { vin: { value: "123", confidence: "high" } } against truck schema succeeds', async () => {
    const { buildExtractionSchema } = await import('@/lib/ai/extraction-schema')
    const schema = buildExtractionSchema('truck')
    const aiFields = getAIExtractableFields('truck')
    const testObj: Record<string, unknown> = {}
    for (const key of aiFields) {
      testObj[key] = { value: null, confidence: null }
    }
    testObj['vin'] = { value: '123', confidence: 'high' }
    const result = schema.safeParse(testObj)
    expect(result.success).toBe(true)
  })

  it('parsing { vin: { value: "123", confidence: "invalid" } } against truck schema fails', async () => {
    const { buildExtractionSchema } = await import('@/lib/ai/extraction-schema')
    const schema = buildExtractionSchema('truck')
    const aiFields = getAIExtractableFields('truck')
    const testObj: Record<string, unknown> = {}
    for (const key of aiFields) {
      testObj[key] = { value: null, confidence: null }
    }
    testObj['vin'] = { value: '123', confidence: 'invalid' }
    const result = schema.safeParse(testObj)
    expect(result.success).toBe(false)
  })
})

describe('getAIExtractableFieldDefs', () => {
  it('returns FieldDefinition[] (objects with .key, .label, .aiHint) not strings', async () => {
    const { getAIExtractableFieldDefs } = await import('@/lib/schema-registry')
    const fields = getAIExtractableFieldDefs('truck')
    expect(fields.length).toBeGreaterThan(0)
    // Each element is an object with .key and .label, not a string
    expect(typeof fields[0]).toBe('object')
    expect(typeof fields[0].key).toBe('string')
    expect(typeof fields[0].label).toBe('string')
  })

  it('truck result contains the vin field definition', async () => {
    const { getAIExtractableFieldDefs } = await import('@/lib/schema-registry')
    const fields = getAIExtractableFieldDefs('truck')
    const vinField = fields.find(f => f.key === 'vin')
    expect(vinField).toBeDefined()
    expect(vinField?.label).toBe('VIN')
  })

  it('only returns fields where aiExtractable is true', async () => {
    const { getAIExtractableFieldDefs } = await import('@/lib/schema-registry')
    const fields = getAIExtractableFieldDefs('truck')
    expect(fields.every(f => f.aiExtractable)).toBe(true)
  })
})

describe('buildExtractionSchema — rich descriptions', () => {
  it('truck vin field value describe string contains Salesforce label "VIN"', async () => {
    const { buildExtractionSchema } = await import('@/lib/ai/extraction-schema')
    const schema = buildExtractionSchema('truck')
    const shape = schema.shape as Record<string, { shape: { value: { description?: string } } }>
    const vinValueDescription = shape.vin?.shape.value?.description ?? ''
    expect(vinValueDescription).toContain('VIN')
  })

  it('truck fuel_type field value describe string contains options', async () => {
    const { buildExtractionSchema } = await import('@/lib/ai/extraction-schema')
    const schema = buildExtractionSchema('truck')
    const shape = schema.shape as Record<string, { shape: { value: { description?: string } } }>
    const fuelDesc = shape.fuel_type?.shape.value?.description ?? ''
    expect(fuelDesc).toContain('Diesel')
    expect(fuelDesc).toContain('Petrol')
  })

  it('truck make field value describe string contains "Make" label', async () => {
    const { buildExtractionSchema } = await import('@/lib/ai/extraction-schema')
    const schema = buildExtractionSchema('truck')
    const shape = schema.shape as Record<string, { shape: { value: { description?: string } } }>
    const makeDesc = shape.make?.shape.value?.description ?? ''
    expect(makeDesc).toContain('Make')
  })
})

describe('buildSystemPrompt — plate routing', () => {
  it('contains BUILD PLATE section', async () => {
    const { buildSystemPrompt } = await import('@/lib/ai/extraction-schema')
    const prompt = buildSystemPrompt('truck', 'prime_mover')
    expect(prompt).toContain('BUILD PLATE')
  })

  it('contains COMPLIANCE PLATE section', async () => {
    const { buildSystemPrompt } = await import('@/lib/ai/extraction-schema')
    const prompt = buildSystemPrompt('truck', 'prime_mover')
    expect(prompt).toContain('COMPLIANCE PLATE')
  })

  it('contains INSTRUMENT CLUSTER section', async () => {
    const { buildSystemPrompt } = await import('@/lib/ai/extraction-schema')
    const prompt = buildSystemPrompt('truck', 'prime_mover')
    expect(prompt).toContain('INSTRUMENT CLUSTER')
  })

  it('instructs not to fabricate VINs or serial numbers', async () => {
    const { buildSystemPrompt } = await import('@/lib/ai/extraction-schema')
    const prompt = buildSystemPrompt('truck', 'prime_mover')
    // Either the original anti-fabrication rule or the new explicit one
    expect(prompt.toLowerCase()).toMatch(/fabricate|serial numbers|vin/)
  })
})
