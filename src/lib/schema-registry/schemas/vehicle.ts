import type { AssetSchema } from '../types'

export const vehicleSchema: AssetSchema = {
  assetType: 'vehicle',
  displayName: 'Vehicle',
  subtypes: [
    { key: 'dual_cab_ute',    label: 'Dual Cab Ute' },
    { key: 'single_cab_ute',  label: 'Single Cab Ute' },
    { key: 'extra_cab_ute',   label: 'Extra Cab Ute' },
    { key: 'sedan',           label: 'Sedan' },
    { key: 'suv',             label: 'SUV' },
    { key: 'wagon',           label: 'Wagon' },
    { key: 'hatchback',       label: 'Hatchback' },
    { key: 'van',             label: 'Van' },
    { key: 'coupe',           label: 'Coupe' },
    { key: 'convertible',     label: 'Convertible' },
    { key: '4wd',             label: '4WD / Off-Road' },
    { key: 'bus',             label: 'Bus / Minibus' },
    { key: 'motorcycle',      label: 'Motorcycle' },
    { key: 'other',           label: 'Other' },
  ],
  hasGlassValuation: false,
  fields: [
    // ── Section: Asset Information ──
    { key: 'make',                label: 'Make',                  sfOrder: 1,  inputType: 'text',     aiExtractable: true,  required: true,  aiHint: 'Badge on tailgate, grille, or steering wheel — manufacturer name (Toyota, Ford, Holden, Mazda, Hyundai, Kia, Nissan, Mitsubishi, Subaru, etc.). Read exactly as shown.' },
    { key: 'vin',                 label: 'VIN',                   sfOrder: 2,  inputType: 'text',     aiExtractable: true,  required: false, inspectionPriority: true, aiHint: 'Build plate (door jamb, engine bay, or windscreen base): 17-character VIN. May be labelled "VIN", "Chassis No", or stamped on chassis rail. Never infer — only extract if directly visible.' },
    { key: 'variant',             label: 'Variant',               sfOrder: 3,  inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Badge on tailgate or boot lid — variant/trim level (e.g. "SR5", "XLT", "Ascent Sport", "ST-L", "GXL", "Titanium", "Wildtrak"). Read exactly as badged.' },
    { key: 'suspension',          label: 'Suspension',            sfOrder: 4,  inputType: 'select',   aiExtractable: true,  required: false, options: ['Airbag', 'Spring', 'Other'], aiHint: 'Infer from vehicle type: most passenger vehicles = Spring (coil/leaf). Commercial vans and heavy utes may have leaf spring rear. Air suspension on luxury SUVs (Range Rover, Mercedes GLS). Default to Spring for standard vehicles.' },
    { key: 'year',                label: 'Year of Manufacture',   sfOrder: 5,  inputType: 'number',   aiExtractable: true,  required: false, aiHint: 'Build plate or compliance plate: Year of Manufacture / DOM. 4-digit year. If not on plate, estimate from model generation using your training knowledge.' },
    { key: 'registration_number', label: 'Registration Number',   sfOrder: 6,  inputType: 'text',     aiExtractable: true,  required: false, inspectionPriority: true, aiHint: 'Registration plate on front or rear. Australian formats vary by state (NSW: XX-XX-XX, QLD: 123-ABC, VIC: XXX-000). Read exactly as shown.' },
    { key: 'chassis_number',      label: 'Chassis Number',        sfOrder: 7,  inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Stamped on chassis rail or build plate. May differ from VIN on older vehicles. Only extract if separately labelled — if same as VIN, return null.' },
    { key: 'engine_number',       label: 'Engine Number',         sfOrder: 8,  inputType: 'text',     aiExtractable: true,  required: false, inspectionPriority: true, aiHint: 'Stamped on engine block (usually near exhaust manifold side). Alphanumeric, varies by manufacturer. Only extract if directly visible.' },
    { key: 'engine_manufacturer', label: 'Engine Manufacturer',   sfOrder: 9,  inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Usually same as vehicle make for passenger vehicles. Exceptions: Isuzu D-Max uses Isuzu engines, Ford Ranger uses Ford engines. Infer from make/model knowledge.' },

    // ── Section: Vehicle Specifications ──
    { key: 'model',               label: 'Model',                 sfOrder: 10, inputType: 'text',     aiExtractable: true,  required: true,  aiHint: 'Badge on tailgate or boot lid — model name (Hilux, Ranger, Corolla, CX-5, i30, Sportage, Outlander, etc.). Do NOT include variant here — just the model name.' },
    { key: 'series',              label: 'Series',                sfOrder: 11, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Model series/generation code if visible on build plate (e.g. "GUN126R", "PX MkIII", "ZRE182R"). Common on Toyota/Ford/Mazda build plates. Infer from make/model/year if not visible.' },
    { key: 'transmission',        label: 'Transmission',          sfOrder: 12, inputType: 'select',   aiExtractable: true,  required: false, options: ['Automatic', 'Manual', 'CVT'], aiHint: 'Build plate or interior: gear selector type. Column/floor shifter with P-R-N-D = Automatic. Visible clutch pedal = Manual. Infer from model if not visible.' },
    { key: 'drive_type',          label: 'Drive Type',            sfOrder: 13, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Badges: "4x4", "4WD", "AWD", "4MATIC", "xDrive", "Quattro", "ATTESA" = 4WD/AWD. Most sedans/hatches = FWD. Most utes = RWD or 4WD. Infer from model variant.' },
    { key: 'body',                label: 'Body',                  sfOrder: 14, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Body builder or configuration: "Alloy Tray", "Steel Tray", "Canopy", "Cab Chassis", "Service Body", etc. For standard passenger vehicles, return null — this field is for modified/commercial bodies.' },
    { key: 'body_type',           label: 'Body Type',             sfOrder: 15, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Visual identification: Sedan, Hatchback, SUV, Dual Cab Ute, Single Cab Ute, Van, Wagon, Coupe, Convertible, Bus, Cab Chassis.' },
    { key: 'compliance_date',     label: 'Compliance Date',       sfOrder: 16, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Compliance plate (door jamb or engine bay): format MM/YYYY. Australian compliance date — may differ from Year of Manufacture for imported vehicles.' },
    { key: 'registration_expiry', label: 'Registration Expiry',   sfOrder: 17, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Rego sticker on windscreen or plate. Format: MM/YYYY or DD/MM/YYYY.' },
    { key: 'colour',              label: 'Colour',                sfOrder: 18, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Exterior body colour from photos. Use common names (White, Silver, Black, Red, Blue, Grey, etc.). If two-tone, list both.' },
    { key: 'fuel_type',           label: 'Fuel Type',             sfOrder: 19, inputType: 'select',   aiExtractable: true,  required: false, options: ['Petrol', 'Diesel', 'LPG', 'Hybrid', 'Electric', 'Petrol and Gas'], aiHint: 'Build plate, fuel filler cap, or infer from make/model. Most sedans/hatches = Petrol. Utes often Diesel. Check for "TDI", "D4D", "CDI", "dCi" badges = Diesel. "HEV"/"PHEV" = Hybrid.' },

    // ── Section: Technical & Identification ──
    { key: 'engine_size',         label: 'Engine Size',           sfOrder: 20, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Build plate or engine bay: displacement (e.g. "2.5L", "3.0L", "5.6L"). Infer from make/model/year if not visible on plate.' },
    { key: 'engine_type',         label: 'Engine Type',           sfOrder: 21, inputType: 'text',     aiExtractable: true,  required: false, aiHint: 'Configuration: "4-Cylinder Turbo Diesel", "V8 Petrol", "4-Cylinder Petrol", "V6 Turbo Diesel", "Electric Motor". Infer from make/model/year knowledge.' },
    { key: 'master_key',          label: 'Master Key',            sfOrder: 22, inputType: 'select',   aiExtractable: false, required: false, options: ['Yes', 'No'] },
    { key: 'spare_key',           label: 'Spare Key',             sfOrder: 23, inputType: 'select',   aiExtractable: false, required: false, options: ['Yes', 'No'] },
    { key: 'odometer',            label: 'Odometer (km)',         sfOrder: 24, inputType: 'number',   aiExtractable: true,  required: false, inspectionPriority: true, aiHint: 'Instrument cluster: odometer reading in km. Read the full number exactly — digits only. If blurry or uncertain, return null.' },
    { key: 'gvm',                 label: 'GVM (kgs)',             sfOrder: 25, inputType: 'number',   aiExtractable: true,  required: false, aiHint: 'Build plate or door jamb: Gross Vehicle Mass in kg. Digits only. Infer from make/model knowledge for common vehicles.' },
    { key: 'gcm',                 label: 'GCM (kgs)',             sfOrder: 26, inputType: 'number',   aiExtractable: true,  required: false, aiHint: 'Build plate: Gross Combination Mass in kg. Usually only on vehicles rated for towing. Digits only.' },
    { key: 'owners_manual',       label: "Owner's Manual",        sfOrder: 27, inputType: 'select',   aiExtractable: false, required: false, options: ['Yes', 'No'] },

    // ── Section: Operational & Logistics ──
    { key: 'service_history',     label: 'Service History',       sfOrder: 28, inputType: 'select',   aiExtractable: false, required: false, options: ['Full Log Books', 'Partial Log Books', 'No Log Books', 'Unknown'] },
    { key: 'accessories',         label: 'Accessories',           sfOrder: 29, inputType: 'textarea', aiExtractable: true,  required: false, aiHint: 'Visible accessories from photos: bull bar, tow bar, roof racks, canopy, tonneau cover, side steps, spot lights, snorkel, winch, UHF radio, dash cam, cargo barrier.' },
    { key: 'extras',              label: 'Extras',                sfOrder: 30, inputType: 'textarea', aiExtractable: true,  required: false, aiHint: 'Features visible in interior/exterior photos: alloy wheels, sunroof, leather seats, heated seats, sat nav, reverse camera, parking sensors, Apple CarPlay, premium audio.' },

    // ── Section: Damage ──
    { key: 'driveable',           label: 'Driveable',             sfOrder: 31, inputType: 'select',   aiExtractable: false, required: false, options: ['Yes', 'No'] },
    { key: 'damage',              label: 'Damage',                sfOrder: 32, inputType: 'textarea', aiExtractable: true,  required: false, aiHint: 'Concise Salesforce-ready summary of ALL visible damage. Write exactly as Slattery staff would paste into Salesforce. Real examples: "Scratches and dents visible around vehicle", "Dent to driver side rear door, scratches to passenger side", "Minor scratches, stone chips to bonnet", "Damage to front bumper, cracked headlight LHS", "Hail damage evident across roof and bonnet". Use location terms: driver/passenger, front/rear, LHS/RHS. Combine multiple items with commas. Be specific but concise — one line, no bullet points. If no damage visible in any photo, return null.' },
    { key: 'damage_notes',        label: 'Damage Notes',          sfOrder: 33, inputType: 'textarea', aiExtractable: true,  required: false, aiHint: 'List each body panel and its damage. Format as "Panel - Damage" on each line. Only list panels where damage is visible. Example:\nFront Bumper - Stone chips, light scratches\nBonnet - Stone chips along leading edge\nDriver Front Guard - Deep scratch through paint\nDriver Rear Door - Dent approx 150mm\nRear Bumper - Scuff marks, minor crack LHS\nWindscreen - Stone chip lower LHS\nDo NOT list panels with no damage. Only include panels you can see damage on in the photos. Staff may also type mechanical damage or issues not visible in photos.' },
  ],
  descriptionTemplate: (_fields, _subtype) => '',
}
