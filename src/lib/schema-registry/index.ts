import type { AssetType, AssetSchema, AssetSubtype, FieldDefinition } from './types'
import { truckSchema } from './schemas/truck'
import { trailerSchema } from './schemas/trailer'
import { earthmovingSchema } from './schemas/earthmoving'
import { agricultureSchema } from './schemas/agriculture'
import { forkliftSchema } from './schemas/forklift'
import { caravanSchema } from './schemas/caravan'
import { generalGoodsSchema } from './schemas/general-goods'
import { marineSchema } from './schemas/marine'
import { vehicleSchema } from './schemas/vehicle'

export type { AssetType, AssetSchema, AssetSubtype, FieldDefinition } from './types'
export { ASSET_TYPES } from './types'

export const SCHEMA_REGISTRY: Record<AssetType, AssetSchema> = {
  truck:         truckSchema,
  trailer:       trailerSchema,
  earthmoving:   earthmovingSchema,
  agriculture:   agricultureSchema,
  forklift:      forkliftSchema,
  caravan:       caravanSchema,
  general_goods: generalGoodsSchema,
  marine:        marineSchema,
  vehicle:       vehicleSchema,
}

export function getSchema(assetType: AssetType): AssetSchema {
  return SCHEMA_REGISTRY[assetType]
}

export function getSubtypes(assetType: AssetType): AssetSubtype[] {
  return SCHEMA_REGISTRY[assetType].subtypes
}

export function getAIExtractableFields(assetType: AssetType): string[] {
  return SCHEMA_REGISTRY[assetType].fields
    .filter(f => f.aiExtractable)
    .map(f => f.key)
}

export function getAIExtractableFieldDefs(assetType: AssetType): FieldDefinition[] {
  return SCHEMA_REGISTRY[assetType].fields.filter(f => f.aiExtractable)
}

export function getFieldsSortedBySfOrder(assetType: AssetType) {
  const schema = SCHEMA_REGISTRY[assetType]
  if (!schema) return []
  return [...schema.fields].sort((a, b) => a.sfOrder - b.sfOrder)
}

export function getInspectionPriorityFields(assetType: AssetType): FieldDefinition[] {
  if (!SCHEMA_REGISTRY[assetType]) return []
  return SCHEMA_REGISTRY[assetType].fields
    .filter(f => f.inspectionPriority === true)
    .sort((a, b) => a.sfOrder - b.sfOrder)
}

export function getAssetDisplayTitle(assetType: string, assetSubtype: string | null): string {
  const schema = SCHEMA_REGISTRY[assetType as AssetType]
  const typeName = schema?.displayName ?? assetType
  if (!assetSubtype) return typeName
  const subtypeLabel = schema?.subtypes?.find(s => s.key === assetSubtype)?.label
  return subtypeLabel ? `${typeName} — ${subtypeLabel}` : typeName
}
