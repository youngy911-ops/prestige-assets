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
    { key: 'make',          label: 'Make',                 sfOrder: 1, inputType: 'text',     aiExtractable: true,  required: true,  aiHint: 'Exterior badge or data plate label: manufacturer/brand name (e.g. Honda, DeWalt, Kaeser, Atlas Copco, Grundfos, Ingersoll Rand, Caterpillar, Makita). Read exactly as shown.' },
    { key: 'model',         label: 'Model',                sfOrder: 2, inputType: 'text',     aiExtractable: true,  required: true,  aiHint: 'Data plate or body label: model designation. Read exactly as printed (e.g. EU3000iS, DCP60, SM15, GX390). Null if not visible on any label or badge.' },
    { key: 'year',          label: 'Year',                 sfOrder: 3, inputType: 'number',   aiExtractable: true,  required: false, aiHint: 'Data plate: Year of Manufacture or DOM. 4-digit year. If not on plate, estimate from model era using your training knowledge.' },
    { key: 'serial_number', label: 'Serial Number',        sfOrder: 4, inputType: 'text',     aiExtractable: true,  required: false, inspectionPriority: true, aiHint: 'Data plate or sticker on machine body: Serial Number or S/N field. Alphanumeric format varies by brand. Never infer — only extract if directly visible.' },
    { key: 'extras',        label: 'Extras / Notes',       sfOrder: 5, inputType: 'textarea', aiExtractable: true,  required: false, aiHint: 'Visible accessories, attachments, or condition notes from photos. List items separated by commas. Include any damage, missing parts, or notable condition details visible in photos.' },
  ],
  descriptionTemplate: (_fields, _subtype) => '',
}
