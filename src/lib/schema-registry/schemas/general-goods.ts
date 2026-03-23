import type { AssetSchema } from '../types'

export const generalGoodsSchema: AssetSchema = {
  assetType: 'general_goods',
  displayName: 'General Goods',
  subtypes: [
    { key: 'agriculture',                    label: 'Agriculture' },
    { key: 'gardening_landscaping',          label: 'Gardening & Landscaping' },
    { key: 'goodwill',                       label: 'Goodwill' },
    { key: 'health_fitness',                 label: 'Health & Fitness' },
    { key: 'hospitality',                    label: 'Hospitality' },
    { key: 'it_computers',                   label: 'IT & Computers' },
    { key: 'jewellery_watches_collectables', label: 'Jewellery/Watches/Collectables' },
    { key: 'medical',                        label: 'Medical' },
    { key: 'miscellaneous',                  label: 'Miscellaneous' },
    { key: 'office',                         label: 'Office' },
    { key: 'other',                          label: 'Other' },
    { key: 'plant_equipment',               label: 'Plant & Equipment' },
    { key: 'retail_fit_out',                 label: 'Retail Fit Out' },
    { key: 'retail_stock',                   label: 'Retail Stock' },
    { key: 'signage',                        label: 'Signage' },
    { key: 'tools_toolboxes',               label: 'Tools & Toolboxes' },
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
