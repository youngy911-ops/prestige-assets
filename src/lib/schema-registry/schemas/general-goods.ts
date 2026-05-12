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
    { key: 'make',          label: 'Make',                 sfOrder: 1, inputType: 'text',     aiExtractable: true,  required: true,  aiHint: 'Exterior badge, data plate, or embossed logo on housing: manufacturer/brand name. Check front panel, side panel, and any metal/sticker data plates. Common brands by category — Generators: Honda, Yamaha, Denyo, Airman, Atlas Copco; Compressors: Kaeser, Atlas Copco, Ingersoll Rand, CompAir, Sullair; Pumps: Grundfos, Flygt, Godwin, Honda, Tsurumi; Welders: Lincoln, Miller, Cigweld; Light towers: Allmand, Generac, Atlas Copco; Tools: Makita, DeWalt, Hilti, Milwaukee, Bosch. Read exactly as shown. If no data plate is present, read the brand from the item body, logo, or colour scheme. Common tool brand identifiers: DeWalt=yellow/black body; Makita=teal/turquoise; Hilti=red; Milwaukee=red/black; Bosch Professional=blue; Ryobi=green; Stanley=yellow; Irwin=blue/red; Sidchrome=red (Australian). For non-power items: read any embossed or printed text on the item body.' },
    { key: 'model',         label: 'Model',                sfOrder: 2, inputType: 'text',     aiExtractable: true,  required: true,  aiHint: 'Data plate or body label: model designation. Read exactly as printed (e.g. EU3000iS, DCP60, SM15, GX390). Null if not visible on any label or badge. If no data plate, read model number from printed text on the item body, handle, trigger guard, or gearbox housing. Common locations: drills — gearbox housing or handle; grinders — guard or gearbox; ladders — top cap label or side rail sticker; compressors — front panel label.' },
    { key: 'year',          label: 'Year',                 sfOrder: 3, inputType: 'number',   aiExtractable: true,  required: false, aiHint: 'Data plate: Year of Manufacture, DOM, or date code field. 4-digit year only. Common locations: Honda generators have date code on lower frame plate; compressors have plate inside control panel door; welders have rear data plate. If not on plate, estimate from model generation era.' },
    { key: 'serial_number', label: 'Serial Number',        sfOrder: 4, inputType: 'text',     aiExtractable: true,  required: false, inspectionPriority: true, aiHint: 'Data plate or sticker on machine body: Serial Number or S/N field. Alphanumeric format varies by brand. Never infer — only extract if directly visible.' },
    { key: 'extras',        label: 'Extras / Notes',       sfOrder: 5, inputType: 'textarea', aiExtractable: true,  required: false, aiHint: 'Visible accessories, attachments, or condition notes from photos. Capture subcategory-specific details: plant_equipment — rated output (kVA, CFM, bar, kW), enclosure type, phase, start type, tank size; tools_toolboxes — item count (e.g. "approx 15x hand tools"), toolbox dimensions and drawer count; hospitality — capacity in litres, phase (240V single / 415V 3-phase), dimensions (W x D x H mm); agriculture — pin sizes and working width in mm for attachments; gardening_landscaping — deck size (mowers), bar length (chainsaws); it_computers — processor, RAM, storage, screen size; medical — certification or service label details; office — quantity and type for furniture lots; retail_fit_out — shelving dimensions; signage — dimensions, material, illuminated or not; miscellaneous / goodwill / retail_stock / jewellery_watches_collectables / health_fitness / other — describe visible contents with quantity estimate and notable branded items. Always include any damage, missing parts, or notable condition details visible in photos. List items separated by commas.' },
  ],
  descriptionTemplate: (_fields, _subtype) => '',
}
