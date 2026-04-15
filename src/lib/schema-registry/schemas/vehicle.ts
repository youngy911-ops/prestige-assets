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

    // ── Section: Condition Assessment ──
    { key: 'driveable',           label: 'Driveable',             sfOrder: 31, inputType: 'select',   aiExtractable: false, required: false, options: ['Yes', 'No'] },
    { key: 'airconditioned',      label: 'Airconditioned',        sfOrder: 32, inputType: 'select',   aiExtractable: false, required: false, options: ['Yes', 'No', 'Unknown'] },
    { key: 'body_condition',      label: 'Body Condition',        sfOrder: 33, inputType: 'select',   aiExtractable: true,  required: false, options: ['Excellent', 'Good', 'Average', 'Poor', 'Damaged'], aiHint: 'Assess from exterior photos: look for dents, scratches, panel damage, faded paint, missing trim. Excellent = near-new. Good = minor marks. Average = visible wear. Poor = significant damage. Damaged = major panel damage.' },
    { key: 'interior_condition',  label: 'Interior Condition',    sfOrder: 34, inputType: 'select',   aiExtractable: true,  required: false, options: ['Excellent', 'Good', 'Average', 'Poor', 'Damaged'], aiHint: 'Assess from interior photos: dashboard, console, door trims. Look for cracks, fading, wear, stains, missing parts.' },
    { key: 'paint_condition',     label: 'Paint Condition',       sfOrder: 35, inputType: 'select',   aiExtractable: true,  required: false, options: ['Excellent', 'Good', 'Average', 'Poor', 'Damaged'], aiHint: 'Assess from exterior photos: look for fading, peeling, oxidation, mismatched panels, overspray.' },
    { key: 'rust_condition',      label: 'Rust Condition',        sfOrder: 36, inputType: 'select',   aiExtractable: true,  required: false, options: ['None', 'Minor', 'Moderate', 'Severe'], aiHint: 'Assess from exterior photos: check wheel arches, sills, door bottoms, tailgate, underbody. None = clean. Minor = surface spots. Moderate = visible rust patches. Severe = structural rust.' },
    { key: 'seat_condition',      label: 'Seat Condition',        sfOrder: 37, inputType: 'select',   aiExtractable: true,  required: false, options: ['Excellent', 'Good', 'Average', 'Poor', 'Damaged'], aiHint: 'Assess from interior photos: look for tears, wear, stains, bolster damage, sagging.' },
    { key: 'carpet_condition',    label: 'Carpet Condition',      sfOrder: 38, inputType: 'select',   aiExtractable: false, required: false, options: ['Excellent', 'Good', 'Average', 'Poor', 'Damaged'] },
    { key: 'brake_condition',     label: 'Brake Condition',       sfOrder: 39, inputType: 'select',   aiExtractable: false, required: false, options: ['Excellent', 'Good', 'Average', 'Poor'] },
    { key: 'tyre_driver_front',   label: 'Tyres - Driver Front',  sfOrder: 40, inputType: 'select',   aiExtractable: true,  required: false, options: ['New', 'Good', 'Average', 'Fair', 'Poor', 'Bald'], aiHint: 'Assess tread depth from tyre photos. New = full tread. Good = 70%+. Average = 40-70%. Fair = 20-40%. Poor = minimal tread. Bald = no tread / wire showing.' },
    { key: 'tyre_driver_rear',    label: 'Tyres - Driver Rear',   sfOrder: 41, inputType: 'select',   aiExtractable: true,  required: false, options: ['New', 'Good', 'Average', 'Fair', 'Poor', 'Bald'], aiHint: 'Assess tread depth from tyre photos.' },
    { key: 'tyre_passenger_front',label: 'Tyres - Passenger Front',sfOrder: 42, inputType: 'select',  aiExtractable: true,  required: false, options: ['New', 'Good', 'Average', 'Fair', 'Poor', 'Bald'], aiHint: 'Assess tread depth from tyre photos.' },
    { key: 'tyre_passenger_rear', label: 'Tyres - Passenger Rear',sfOrder: 43, inputType: 'select',   aiExtractable: true,  required: false, options: ['New', 'Good', 'Average', 'Fair', 'Poor', 'Bald'], aiHint: 'Assess tread depth from tyre photos.' },
    { key: 'tyre_spare',          label: 'Tyres - Spare',         sfOrder: 44, inputType: 'select',   aiExtractable: false, required: false, options: ['Full Size', 'Space Saver', 'None', 'Unknown'] },

    // ── Section: Damage ──
    { key: 'damage',              label: 'Damage',                sfOrder: 45, inputType: 'textarea', aiExtractable: true,  required: false, aiHint: 'Concise Salesforce summary of ALL visible damage. Format exactly like: "Scratches and dents visible around vehicle" or "Dent on driver rear door, scratches along passenger side, cracked tail light RHS". Use location terms: driver/passenger, front/rear, LHS/RHS. If no damage visible in any photo, return null.' },
    { key: 'damage_notes',        label: 'Damage Notes',          sfOrder: 46, inputType: 'textarea', aiExtractable: true,  required: false, aiHint: 'Detailed breakdown of each damage item with location, severity, and approximate size. E.g. "1. Large dent on driver rear quarter panel approx 200mm diameter. 2. Deep scratches along passenger side from front guard to rear door. 3. Cracked tail light lens RHS — appears impact damage. 4. Stone chips across bonnet leading edge. 5. Minor rust bubbling on both rear wheel arches."' },
  ],
  descriptionTemplate: (_fields, _subtype) => '',
}
