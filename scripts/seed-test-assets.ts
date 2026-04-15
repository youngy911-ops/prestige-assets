/**
 * Seed script — creates realistic test assets in Supabase for development/testing.
 *
 * Usage:
 *   npx tsx scripts/seed-test-assets.ts --email you@example.com --password yourpass
 *   npx tsx scripts/seed-test-assets.ts --email you@example.com --password yourpass --count 20
 *   npx tsx scripts/seed-test-assets.ts --email you@example.com --password yourpass --branch brisbane
 *   npx tsx scripts/seed-test-assets.ts --email you@example.com --password yourpass --type truck
 *   npx tsx scripts/seed-test-assets.ts --email you@example.com --password yourpass --with-photos
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 * Signs in as the given user to create assets under their account (respects RLS).
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ---------------------------------------------------------------------------
// Config from .env.local
// ---------------------------------------------------------------------------
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.+)$/)
  if (match) env[match[1]] = match[2]
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, anonKey)

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const EMAIL = getArg('email')
const PASSWORD = getArg('password')
const COUNT = parseInt(getArg('count') ?? '10', 10)
const BRANCH_FILTER = getArg('branch') ?? null
const TYPE_FILTER = getArg('type') ?? null
const WITH_PHOTOS = hasFlag('with-photos')
const CLEAR = hasFlag('clear')

if (!EMAIL || !PASSWORD) {
  console.error('Usage: npx tsx scripts/seed-test-assets.ts --email <email> --password <password> [--count N] [--branch X] [--type X] [--with-photos] [--clear]')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Test data templates — realistic Australian auction assets
// ---------------------------------------------------------------------------

type TestAsset = {
  asset_type: string
  asset_subtype: string
  fields: Record<string, string>
}

const BRANCHES = [
  'brisbane', 'roma', 'mackay', 'newcastle', 'sydney',
  'canberra', 'melbourne', 'perth', 'adelaide', 'karratha',
]

const TEST_ASSETS: TestAsset[] = [
  // --- TRUCKS ---
  {
    asset_type: 'truck', asset_subtype: 'prime_mover',
    fields: { make: 'Kenworth', model: 'T610', year: '2019', vin: '6DKXT50C7KL123456', odometer: '487250', engine_make: 'Cummins', engine_model: 'X15', engine_hp: '550', transmission: 'Eaton 18 Speed Manual', gvm: '36000', fuel_type: 'Diesel', body_type: 'Prime Mover' },
  },
  {
    asset_type: 'truck', asset_subtype: 'tipper',
    fields: { make: 'Isuzu', model: 'FVZ260-300', year: '2017', vin: 'JALFVZ26THZ654321', odometer: '195400', engine_make: 'Isuzu', engine_model: '6HK1', engine_hp: '300', transmission: '6 Speed Manual', gvm: '26000', fuel_type: 'Diesel', body_type: 'Tipper' },
  },
  {
    asset_type: 'truck', asset_subtype: 'pantech',
    fields: { make: 'Hino', model: '500 Series 1628', year: '2021', vin: 'JHDFC8JN6MX001234', odometer: '68340', engine_make: 'Hino', engine_model: 'A05C', engine_hp: '280', transmission: '6 Speed Allison Auto', gvm: '16000', fuel_type: 'Diesel', body_type: 'Pantech' },
  },
  {
    asset_type: 'truck', asset_subtype: 'tray',
    fields: { make: 'Mitsubishi', model: 'Canter 515', year: '2020', vin: 'JLCFEB71SKK005678', odometer: '112300', engine_make: 'Mitsubishi', engine_model: '4P10', engine_hp: '150', transmission: '6 Speed Duonic AMT', gvm: '5500', fuel_type: 'Diesel', body_type: 'Tray' },
  },
  {
    asset_type: 'truck', asset_subtype: 'crane_truck',
    fields: { make: 'Volvo', model: 'FM 500', year: '2016', vin: 'YV2XTA0GXGA987654', odometer: '340120', engine_make: 'Volvo', engine_model: 'D13K', engine_hp: '500' },
  },
  {
    asset_type: 'truck', asset_subtype: 'service_truck',
    fields: { make: 'Hino', model: '300 Series 717', year: '2022', vin: 'JHDXZU71TMK009876', odometer: '42100', engine_make: 'Hino', engine_model: 'N04C', engine_hp: '165', transmission: '6 Speed Manual', gvm: '7500', fuel_type: 'Diesel', body_type: 'Service Body' },
  },

  // --- TRAILERS ---
  {
    asset_type: 'trailer', asset_subtype: 'flat_top',
    fields: { make: 'Krueger', model: 'ST-3', year: '2015', serial_number: 'KR2015FT04567', trailer_length: '45 ft', tare: '7800', atm: '45000', suspension: 'Air Bag', axle_configuration: 'Tri Axle' },
  },
  {
    asset_type: 'trailer', asset_subtype: 'tipper_trailer',
    fields: { make: 'Azmeb', model: 'Tri-Axle Side Tipper', year: '2018', serial_number: 'AZ18ST09876', trailer_length: '34 ft', tare: '9200', atm: '42000', suspension: 'Air Bag' },
  },
  {
    asset_type: 'trailer', asset_subtype: 'curtainsider',
    fields: { make: 'Vawdrey', model: 'VB-S3', year: '2020', serial_number: 'VW2020CS12345', trailer_length: '48 ft', tare: '8100', atm: '44000' },
  },
  {
    asset_type: 'trailer', asset_subtype: 'refrigerated',
    fields: { make: 'MaxiTRANS', model: 'Freighter ST3', year: '2019', serial_number: 'MT19RF56789', trailer_length: '44 ft', tare: '9500', atm: '42000', extras: 'Thermo King T-1200R unit, multi-temp capable, meat rails' },
  },

  // --- EARTHMOVING ---
  {
    asset_type: 'earthmoving', asset_subtype: 'excavator',
    fields: { make: 'Caterpillar', model: '320F L', year: '2018', serial_number: 'ZAP08765', hours: '6840', engine_make: 'CAT', engine_model: 'C4.4 ACERT', engine_hp: '162', operating_weight: '22200', bucket_capacity: '1.19 m3' },
  },
  {
    asset_type: 'earthmoving', asset_subtype: 'wheel_loader',
    fields: { make: 'Komatsu', model: 'WA380-8', year: '2020', serial_number: 'A89001', hours: '4520', engine_make: 'Komatsu', engine_model: 'SAA6D114E-6', engine_hp: '242', operating_weight: '19400', bucket_capacity: '3.8 m3' },
  },
  {
    asset_type: 'earthmoving', asset_subtype: 'skid_steer',
    fields: { make: 'Bobcat', model: 'S570', year: '2019', serial_number: 'B3NZ14567', hours: '3210', engine_hp: '61', operating_weight: '2710' },
  },
  {
    asset_type: 'earthmoving', asset_subtype: 'dozer',
    fields: { make: 'Caterpillar', model: 'D6T XL', year: '2015', serial_number: 'WRG02345', hours: '11400', engine_make: 'CAT', engine_model: 'C9.3 ACERT', engine_hp: '215', operating_weight: '22700' },
  },
  {
    asset_type: 'earthmoving', asset_subtype: 'grader',
    fields: { make: 'Caterpillar', model: '140M', year: '2014', serial_number: 'APM04567', hours: '9800', engine_make: 'CAT', engine_model: 'C7 ACERT', engine_hp: '183', operating_weight: '18000' },
  },
  {
    asset_type: 'earthmoving', asset_subtype: 'backhoe',
    fields: { make: 'JCB', model: '3CX', year: '2021', serial_number: 'JCB3CX21-56789', hours: '1650', engine_hp: '109', operating_weight: '8070' },
  },

  // --- AGRICULTURE ---
  {
    asset_type: 'agriculture', asset_subtype: 'tractor',
    fields: { make: 'John Deere', model: '6130R', year: '2021', serial_number: '1L06130RPML123456', hours: '2100', engine_make: 'John Deere', engine_model: 'PowerTech PVS 4.5L', engine_hp: '130', transmission: 'AutoPowr IVT' },
  },
  {
    asset_type: 'agriculture', asset_subtype: 'harvester',
    fields: { make: 'Case IH', model: '8250 Axial-Flow', year: '2019', serial_number: 'YJT043210', hours: '1850', extras: '40ft MacDon draper front, GPS guidance, yield monitor' },
  },
  {
    asset_type: 'agriculture', asset_subtype: 'sprayer',
    fields: { make: 'Goldacres', model: 'G6 6036', year: '2022', serial_number: 'GA2022SP001', hours: '890', extras: '36m boom, 6000L tank, AutoBoom height control, GPS section control' },
  },

  // --- FORKLIFTS ---
  {
    asset_type: 'forklift', asset_subtype: 'counterbalance',
    fields: { make: 'Toyota', model: '8FG25', year: '2018', serial_number: '8FG25-74321', hours: '5670', fuel_type: 'LPG', max_lift_capacity: '2500 kg', max_lift_height: '4500 mm', transmission: 'Torque Converter Auto' },
  },
  {
    asset_type: 'forklift', asset_subtype: 'reach_truck',
    fields: { make: 'Crown', model: 'ESR5260-2.0', year: '2020', serial_number: 'CR2020RT5678', hours: '3400', fuel_type: 'Electric', max_lift_capacity: '2000 kg', max_lift_height: '10500 mm' },
  },
  {
    asset_type: 'forklift', asset_subtype: 'counterbalance',
    fields: { make: 'Hyster', model: 'H3.0FT', year: '2016', serial_number: 'D177B25432J', hours: '8900', fuel_type: 'Diesel', max_lift_capacity: '3000 kg', max_lift_height: '4300 mm' },
  },

  // --- CARAVANS ---
  {
    asset_type: 'caravan', asset_subtype: 'caravan',
    fields: { make: 'Jayco', model: 'Journey Outback 17.58-3', year: '2022', vin: '6T9CJ22N3NA012345', registration_number: '1ABC234', odometer: '18400', tare: '1875', atm: '2490', extras: 'Solar panel, satellite dish, ensuite, reverse camera, Anderson plug' },
  },
  {
    asset_type: 'caravan', asset_subtype: 'motorhome',
    fields: { make: 'Winnebago', model: 'Minnie 2455BHS', year: '2019', vin: '5B4MP67G19H654321', odometer: '43200', extras: 'Slide-out living area, ducted A/C, 4kW generator, tow bar' },
  },

  // --- MARINE ---
  {
    asset_type: 'marine', asset_subtype: 'runabout',
    fields: { make: 'Quintrex', model: '510 Cruiseabout', year: '2021', serial_number: 'AU-QTX21RAB001', engine_make: 'Mercury', engine_model: '115 FourStroke', engine_hp: '115', extras: 'Bimini top, fish finder, live bait tank, trailer included' },
  },

  // --- GENERAL GOODS ---
  {
    asset_type: 'general_goods', asset_subtype: 'tools_toolboxes',
    fields: { make: 'Kincrome', model: 'Contour Tool Chest 26"', year: '2023', serial_number: 'KC2023-8765', extras: 'Full set of sockets, spanners, screwdrivers. Good condition, minor surface marks.' },
  },
  {
    asset_type: 'general_goods', asset_subtype: 'plant_equipment',
    fields: { make: 'Atlas Copco', model: 'XAS 185', year: '2017', serial_number: 'ACA185-2017-04321', extras: '185 CFM portable air compressor, Deutz diesel engine, approx 3,200 hours, aftercooler fitted' },
  },
  {
    asset_type: 'general_goods', asset_subtype: 'it_computers',
    fields: { make: 'Dell', model: 'OptiPlex 7090 Tower', year: '2022', extras: 'Pallet of 12 units, i7-11700, 16GB RAM, 512GB SSD, no monitors' },
  },
  {
    asset_type: 'general_goods', asset_subtype: 'hospitality',
    fields: { make: 'Hoshizaki', model: 'IM-240ANE', year: '2020', serial_number: 'HSZ-2020-IC-789', extras: 'Commercial ice maker, 240kg/day capacity, stainless steel, recently serviced' },
  },
  {
    asset_type: 'general_goods', asset_subtype: 'medical',
    fields: { make: 'Hill-Rom', model: 'Centrella Smart+ Bed', year: '2021', serial_number: 'HR-CSP-44321', extras: 'Electric hospital bed, integrated scale, bed exit alarm, side rails' },
  },
  {
    asset_type: 'general_goods', asset_subtype: 'miscellaneous',
    fields: { make: 'Honda', model: 'EU3000iS', year: '2023', serial_number: 'EZBJ-1234567', extras: '3000W inverter generator, electric start, fuel injection, very low hours' },
  },
  {
    asset_type: 'general_goods', asset_subtype: 'gardening_landscaping',
    fields: { make: 'Husqvarna', model: 'Z254F', year: '2023', serial_number: 'HVA-Z254F-92341', extras: '54" zero-turn mower, Kawasaki engine, 128 hours, mulch kit fitted' },
  },
  {
    asset_type: 'general_goods', asset_subtype: 'retail_stock',
    fields: { make: 'Various', model: 'Mixed Pallet', extras: 'Pallet lot of assorted cleaning products, approx 200 units, mixed brands' },
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Sign in
  console.log(`Signing in as ${EMAIL}...`)
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL!,
    password: PASSWORD!,
  })
  if (authError || !auth.user) {
    console.error(`Sign in failed: ${authError?.message ?? 'Unknown error'}`)
    process.exit(1)
  }
  const userId = auth.user.id
  console.log(`Signed in as ${auth.user.email} (${userId})\n`)

  // Optional: clear existing test data
  if (CLEAR) {
    console.log('Clearing existing assets...')
    const { error: delError } = await supabase
      .from('assets')
      .delete()
      .eq('user_id', userId)
    if (delError) console.error(`Delete failed: ${delError.message}`)
    else console.log('Cleared existing assets.\n')
  }

  // Filter templates
  let templates = [...TEST_ASSETS]
  if (TYPE_FILTER) templates = templates.filter(t => t.asset_type === TYPE_FILTER)
  if (templates.length === 0) {
    console.error(`No templates match type "${TYPE_FILTER}". Available: truck, trailer, earthmoving, agriculture, forklift, caravan, marine, general_goods`)
    process.exit(1)
  }

  console.log(`Seeding ${COUNT} test assets${WITH_PHOTOS ? ' with photos' : ''}...`)

  let created = 0
  let photoCount = 0

  for (let i = 0; i < COUNT; i++) {
    const template = templates[i % templates.length]
    const branch = BRANCH_FILTER ?? BRANCHES[Math.floor(Math.random() * BRANCHES.length)]

    // Randomise fields slightly to avoid exact duplicates
    const fields = { ...template.fields }
    if (fields.odometer) fields.odometer = String(parseInt(fields.odometer) + Math.floor(Math.random() * 50000))
    if (fields.hours) fields.hours = String(parseInt(fields.hours) + Math.floor(Math.random() * 2000))
    if (fields.year) fields.year = String(parseInt(fields.year) - Math.floor(Math.random() * 3))

    // 70% confirmed, 30% draft
    const status = Math.random() > 0.3 ? 'confirmed' : 'draft'

    // Stagger across the last 30 days
    const daysAgo = Math.floor(Math.random() * 30)
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString()

    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        user_id: userId,
        branch,
        asset_type: template.asset_type,
        asset_subtype: template.asset_subtype,
        fields,
        status,
        created_at: createdAt,
        updated_at: createdAt,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`  FAIL ${template.asset_type}/${template.asset_subtype}: ${error.message}`)
      continue
    }

    created++
    const label = `${fields.make ?? ''} ${fields.model ?? ''}`.trim() || template.asset_subtype

    // Download and upload placeholder photos
    if (WITH_PHOTOS) {
      const numPhotos = 1 + Math.floor(Math.random() * 3) // 1-3 photos
      for (let p = 0; p < numPhotos; p++) {
        try {
          // picsum with seed gives consistent, different images
          const imageUrl = `https://picsum.photos/seed/asset${i * 10 + p}/1200/900`
          const res = await fetch(imageUrl, { redirect: 'follow' })
          if (!res.ok) continue
          const blob = await res.arrayBuffer()

          const storagePath = `${userId}/${asset.id}/seed-${Date.now()}-${p}.jpg`
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: false })

          if (uploadError) continue

          await supabase
            .from('asset_photos')
            .insert({ asset_id: asset.id, storage_path: storagePath, sort_order: p })

          photoCount++
        } catch {
          // Non-fatal
        }
      }
    }

    console.log(`  [${created}/${COUNT}] ${template.asset_type}/${template.asset_subtype} — ${label} (${branch}, ${status})`)
  }

  console.log(`\nDone! Created ${created} assets${WITH_PHOTOS ? ` with ${photoCount} photos` : ''}.`)
  console.log('\nRefresh the app to see them.')
}

main().catch(console.error)
