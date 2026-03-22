import type { AssetSchema } from '../types'

export const generalGoodsSchema: AssetSchema = {
  assetType: 'general_goods',
  displayName: 'General Goods',
  subtypes: [
    { key: 'tools_equipment',    label: 'Tools & Equipment' },
    { key: 'attachments',        label: 'Attachments' },
    { key: 'workshop_equipment', label: 'Workshop Equipment' },
    { key: 'office_it',          label: 'Office & IT' },
    { key: 'miscellaneous',      label: 'Miscellaneous' },
  ],
  hasGlassValuation: false,
  fields: [
    { key: 'make',          label: 'Make',                 sfOrder: 1, inputType: 'text',     aiExtractable: true,  required: true,  aiHint: 'Manufacturer or brand name from build plate, badge, or label (e.g. Kubota, Honda, Atlas Copco, Ingersoll Rand, DeWalt, Kaeser, Grundfos, Caterpillar). Read exactly as shown.' },
    { key: 'model',         label: 'Model',                sfOrder: 2, inputType: 'text',     aiExtractable: true,  required: true,  aiHint: 'Model designation from build plate or body label. Read exactly as printed. Null if not visible.' },
    { key: 'serial_number', label: 'Serial Number',        sfOrder: 3, inputType: 'text',     aiExtractable: true,  required: false, inspectionPriority: true, aiHint: 'Serial number from build plate or data plate. Format varies by manufacturer. Never infer — only extract if directly visible.' },
    { key: 'dom',           label: 'Date of Manufacture',  sfOrder: 4, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Date of manufacture from build plate or compliance plate. Format MM/YYYY or 4-digit year. Null if not present.' },
    { key: 'extras',        label: 'Extras',               sfOrder: 5, inputType: 'textarea', aiExtractable: false, required: false },
  ],
  descriptionTemplate: (_fields, _subtype) => '',
}
