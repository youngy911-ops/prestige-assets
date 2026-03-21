export const ASSET_TYPES = [
  'truck',
  'trailer',
  'earthmoving',
  'agriculture',
  'forklift',
  'caravan',
  'general_goods',
] as const

export type AssetType = (typeof ASSET_TYPES)[number]

export type AssetSubtype = {
  key: string    // internal snake_case key stored in DB
  label: string  // display label shown in UI
}

export type FieldDefinition = {
  key: string              // internal key — used in DB fields JSONB and form state
  label: string            // exact Salesforce display label (copy-paste accuracy matters)
  sfOrder: number          // position in Salesforce fields block output (1-indexed, unique per type)
  inputType: 'text' | 'number' | 'select' | 'textarea'
  options?: string[]       // only for inputType: 'select'
  aiExtractable: boolean   // true if AI vision extraction should attempt this field
  aiHint?: string          // guidance for GPT on where to find / how to infer this field
  inspectionPriority?: boolean  // true = show as structured input on photos page (up to 5 per type)
  required: boolean        // true if the field must be populated before output generation
}

export type AssetSchema = {
  assetType: AssetType
  displayName: string
  subtypes: AssetSubtype[]
  fields: FieldDefinition[]
  hasGlassValuation: boolean  // true only for 'caravan'
  descriptionTemplate: (fields: Record<string, string>, subtype: string) => string
}
