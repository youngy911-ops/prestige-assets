import type { AssetSchema } from '../types'

export const generalGoodsSchema: AssetSchema = {
  assetType: 'general_goods',
  displayName: 'General Goods',
  subtypes: [
    { key: 'general', label: 'General' },
  ],
  hasGlassValuation: false,
  fields: [
    { key: 'description', label: 'Description', sfOrder: 1, inputType: 'textarea', aiExtractable: false, required: true },
  ],
  descriptionTemplate: (_fields, _subtype) => '',
}
