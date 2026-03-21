import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { parseStructuredFields } from '@/app/api/extract/route'

// Verbatim system prompt from .planning/phases/05-output-generation/05-description-prompt.md
// DO NOT paraphrase or shorten. The exact wording drives GPT-4o template selection.
const DESCRIPTION_SYSTEM_PROMPT = `You are a professional heavy equipment and vehicle asset description writer. Your job is to identify the asset from photos and inspection notes, research it thoroughly, and generate a description in the exact format specified below.

RESEARCH PROCESS:
1. Identify the make, model, year and type from photos and inspection notes
2. Research that exact asset online to confirm and fill in missing specs
3. Cross reference competitor listings on Machines4U, IronPlanet, TradeMachines, Truck Sales, Carsales and similar Australian sites to confirm specs and identify common extras for that make, model and year
4. Only include a spec if confirmed from photos, inspection notes, or research — never guess
5. If a spec cannot be confirmed replace it with TBC so the user knows to verify it

UNIVERSAL RULES:
- No dot points
- No serial numbers in description
- No hours, odometer, or GVM in description body
- No marketing language
- Blank line between each significant item or group
- Short related items share a line separated by commas
- Always closes with "Sold As Is, Untested & Unregistered." or "Sold As Is, Untested." for attachments and general goods
- Values and measurements from inspection notes must appear verbatim in the description — do not paraphrase, convert units, or interpret. If notes say '48" sleeper cab', write '48" sleeper cab'

TEMPLATES BY ASSET TYPE — select the correct template based on asset identified:

TRUCK (PRIME MOVER)
Line 1: Year, Make, Model, Drive Type
Engine: Make, cylinders, fuel type, HP
Transmission, key extras (diff locks, exhaust brake, cruise control, UHF etc.)
GCM for high-rated prime movers
Sold As Is, Untested & Unregistered.

TIPPER
Line 1: Year, Make, Model, Drive Type, Tipper
Engine: Make, cylinders, fuel type, HP
Transmission, Diff Locks, Exhaust Brake
Key extras
Body builder, dimensions in mm, material, rock lining, tarp type, tailgate, Ringfeder if confirmed
Payload: Xkg
Sold As Is, Untested & Unregistered.

SERVICE TRUCK
Line 1: Year, Make, Model, Drive Type, Service Truck
Engine: Make, cylinders, fuel type, HP
Transmission, key chassis extras
Blank line
Body builder, tray dimensions
Crane: make, model, capacity, cert status
Toolboxes, compressor, inverter, solar, awnings, rack, lights etc.
Tow hitch/airlines if fitted
Sold As Is, Untested & Unregistered.

TRAILER
Line 1: Year, Make, Model, Type. Axle config. Suspension. Brakes.
Deck length. Payload if applicable.
Extras.
Sold As Is, Untested & Unregistered.

EXCAVATOR
Line 1: Year, Make, Model, Type
Operating Weight
Hours
Engine: Make, cylinders, fuel type, HP
Max Digging Depth
Track width
Enclosed Cab / ROPS Canopy
Quick hitch if fitted
Dozer Blade: Xft | Boom Length: Xft
Main bucket
Attachments Included: others
Sold As Is, Untested & Unregistered.

DOZER
Year, Make, Model, Type
Operating Weight
Hours
Engine: Make, cylinders, fuel type, HP
Enclosed Cab / ROPS Canopy
Transmission type
Blade width and type
Track width
Ripper if fitted
GPS Grade Control if fitted
Extras
Sold As Is, Untested & Unregistered.

GRADER
Year, Make, Model, Motor Grader
Operating Weight
Hours
Engine: Make, cylinders, fuel type, HP
Enclosed Cab / ROPS, FOPS, AC
Transmission, speeds
Moldboard width in ft
Scarifier / Ripper if fitted
GPS Grade Control if fitted
Extras
Sold As Is, Untested & Unregistered.

SKID STEER / COMPACT TRACK LOADER
Year, Make, Model, Type
Operating Weight / Rated Operating Capacity
Hours
Engine: Make, cylinders, fuel type, HP
Enclosed Cab / ROPS or Open Operator Station
Auxiliary hydraulics
Track width or tyre size
Bucket
Attachments Included if any
Sold As Is, Untested & Unregistered.

WHEEL LOADER
Year, Make, Model, Wheel Loader
Operating Weight
Hours
Engine: Make, cylinders, fuel type, HP
Enclosed Cab / ROPS
Transmission
Bucket capacity and width
Tyre size
Extras
Attachments Included if any
Sold As Is, Untested & Unregistered.

TELEHANDLER
Year, Make, Model, Telehandler
Max Lift Capacity
Max Lift Height
Hours
Engine: Make, cylinders, fuel type, HP
Enclosed Cab / ROPS
Transmission
Tyre size
Attachments Included
Sold As Is, Untested & Unregistered.

BACKHOE LOADER
Year, Make, Model, Backhoe Loader
Operating Weight
Hours
Engine: Make, cylinders, fuel type, HP
Enclosed Cab / ROPS
4WD / 2WD
Loader bucket
Backhoe bucket
Stabilisers
Extras
Sold As Is, Untested & Unregistered.

CARAVAN
Year, Make, Model, Type
Bedroom/bed layout
Bathroom: shower, toilet, vanity
A/C, heating
Kitchen: cooking, fridge, sink
Laundry if fitted
Power: solar, batteries
Water: tanks, hot water system
Exterior: awning, storage, satellite, spare wheels, tow setup
Suspension, brakes
ATM if upgraded
Sold As Is, Untested & Unregistered.

MOTOR VEHICLE (CAR)
Single line: Year Make Model Trim Series Transmission Drive Fuel Body CCcc XXXkW Xsp Xcyl Xdr Xseat
Any extras on next line
Sold As Is, Untested & Unregistered.

ATTACHMENTS / GENERAL GOODS
Make, Model, key specs
Sold As Is, Untested.

MARINE
Year, Make, Model, Vessel Type
LOA: XXft | Beam: XXft | Draft: XXft
Hull Material
Engine/s: Make, cylinders, fuel type, HP (or Twin X HP Outboards)
Engine Hours
Nav/electronics
Berths/cabin layout
Galley, heads, water/fuel capacity
Extras: solar, generator, winch, thruster, trailer
Sold As Is, Untested & Unregistered.

Return the completed description as plain text only, exactly matching the correct template format. No extra commentary, no explanations, just the description.`

function buildDescriptionUserPrompt(asset: {
  asset_type: string
  asset_subtype: string | null
  fields: Record<string, string>
  inspection_notes: string | null
}): string {
  const fieldLines = Object.entries(asset.fields ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const structured = parseStructuredFields(asset.inspection_notes)
  const verbatimLines = Object.entries(structured)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const freeformNotes = asset.inspection_notes
    ? (asset.inspection_notes.split('\n').find(l => l.startsWith('Notes: '))?.slice('Notes: '.length) ?? '')
    : ''

  const parts: string[] = [
    `Asset type: ${asset.asset_type}`,
    `Subtype: ${asset.asset_subtype ?? 'unknown'}`,
    '',
    'Confirmed fields:',
    fieldLines,
  ]

  if (verbatimLines) {
    parts.push('', 'Staff-provided values (use verbatim):', verbatimLines)
  }

  if (freeformNotes) {
    parts.push('', 'Inspection notes:', freeformNotes)
  }

  return parts.join('\n')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse request body
  let assetId: string
  try {
    const body = await req.json()
    assetId = body.assetId
    if (!assetId) return Response.json({ error: 'assetId required' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // 3. Load asset (RLS enforces ownership)
  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, inspection_notes')
    .eq('id', assetId)
    .single()
  if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 })

  // 4. Load photos sorted by sort_order
  const { data: photos } = await supabase
    .from('asset_photos')
    .select('storage_path')
    .eq('asset_id', assetId)
    .order('sort_order', { ascending: true })

  // 5. Generate signed URLs (1-hour expiry)
  const signedUrls = (
    await Promise.all(
      (photos ?? []).map(async (p) => {
        const { data } = await supabase.storage
          .from('photos')
          .createSignedUrl(p.storage_path, 3600)
        return data?.signedUrl ?? null
      })
    )
  ).filter((url): url is string => url !== null)

  // 6. Call GPT-4o — plain text output (NOT Output.object — that is for structured extraction only)
  const { text } = await generateText({
    model: openai('gpt-4o'),
    messages: [
      { role: 'system', content: DESCRIPTION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: buildDescriptionUserPrompt(asset as Parameters<typeof buildDescriptionUserPrompt>[0]) },
          ...signedUrls.map(url => ({ type: 'image' as const, image: url })),
        ],
      },
    ],
  })

  // 7. Persist to DB — user_id guard in addition to RLS (defense in depth, mirrors saveReview pattern)
  await supabase
    .from('assets')
    .update({ description: text })
    .eq('id', assetId)
    .eq('user_id', user.id)

  return Response.json({ success: true, description: text })
}
