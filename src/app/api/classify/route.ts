import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { ASSET_TYPES } from '@/lib/schema-registry/types'
import { SCHEMA_REGISTRY } from '@/lib/schema-registry'

export const maxDuration = 30

const ClassifySchema = z.object({
  asset_type: z.enum([...ASSET_TYPES] as [string, ...string[]]),
  asset_subtype: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let imageUrls: string[]
  try {
    const body = await req.json()
    // Accept either imageUrl (single) or imageUrls (multiple)
    if (Array.isArray(body.imageUrls)) {
      imageUrls = body.imageUrls.slice(0, 4)
    } else if (typeof body.imageUrl === 'string') {
      imageUrls = [body.imageUrl]
    } else {
      return Response.json({ error: 'imageUrl or imageUrls required' }, { status: 400 })
    }
    if (imageUrls.length === 0 || imageUrls.some(u => !u.startsWith('data:image/'))) {
      return Response.json({ error: 'Only base64 data URLs accepted' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Build list of valid types and subtypes for the prompt
  const typeList = ASSET_TYPES.map(t => {
    const subtypes = SCHEMA_REGISTRY[t].subtypes.map(s => s.key).join(', ')
    return `${t} (subtypes: ${subtypes || 'none'})`
  }).join('\n')

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: ClassifySchema,
    messages: [
      {
        role: 'system',
        content: `You are an expert heavy equipment and vehicle classifier for an Australian auction house.
You will be shown one or more photos of the same asset — use ALL photos together to make the most accurate classification.

Classify the asset into one of these types and subtypes:

${typeList}

Return the exact key values (snake_case) from the list above.

IMPORTANT: You MUST always return an asset_type. Even if the photo is blurry, dark, or only shows a partial view, make your best guess. Use every visual cue available — shape, colour, tyres, cab style, attachments, tracks, mast, tray, body type. Never refuse to classify.

VISUAL IDENTIFICATION CUES:
- Tracks + boom arm = earthmoving (excavator most common)
- Yellow body + bucket/blade = earthmoving
- Mast + forks at front = forklift
- 5th wheel coupling on tray = truck (prime_mover)
- Hydraulic tipping body = truck (tipper) or trailer (tipper_trailer)
- 4-door tray with towbar = vehicle (dual_cab_ute)
- Enclosed box body on rigid chassis = truck (pantech)
- Long trailer, curtains on sides = trailer (curtainsider_trailer)
- Boat hull on trailer = marine (trailer_boat)
- Drawbar + living quarters = caravan
- Large tyres + open operator station + boom = agriculture (tractor or telehandler)
- Orange/red warning lights on roof = likely service_truck or emergency vehicle
- Spray booms folded on sides = agriculture (spray_rig)

SUBTYPE HINTS:
- vehicle: dual_cab_ute (4-door tray/ute), single_cab_ute (2-door tray), suv (raised, wagon-like), sedan, van (transit/sprinter/hiace cargo), bus, 4wd (large SUV with visible lift or off-road tyres)
- truck: tipper (hydraulic tipping body, rams visible), tray_truck (flat steel tray), pantech (enclosed box body), prime_mover (semi tractor, 5th wheel plate on tray, no body), cab_chassis (bare chassis, no body fitted), service_truck (knuckle boom crane or service body with drawers), refrigerated_pantech (white insulated box body), water_truck (round tank on tray), vacuum_truck (cylindrical tank + hose reel)
- trailer: tipper_trailer (tipping body on trailer), flat_deck_trailer (bare flat deck), curtainsider_trailer (side curtains, skeletal ends), pantech_trailer (enclosed box), low_loader (dropped deck for machinery), skel_trailer (skeletal frame for containers)
- earthmoving: excavator (tracks + cab + boom arm), bulldozer (blade at front + tracks), wheel_loader (bucket at front + wheels), motor_grader (long blade underneath), skid_steer (compact, bucket, 4 wheels), dump_truck (large rigid haul truck with tipping body), compactor (drum roller), telehandler (telescopic boom forklift)
- forklift: clearview_mast (standard counterbalance forklift), container_mast (very tall mast 4m+), walkie_stacker (pedestrian stacker), electric_pallet_jack (ride-on or walk-behind pallet jack)
- agriculture: tractor (cab + large rear tyres), combine_harvester (large header at front), spray_rig (boom arms extending from sides), baler (intake + discharge chute at rear), air_seeder (large tank + distribution tubes)
- marine: trailer_boat (boat hull on road trailer), personal_watercraft (jet ski), barge (flat-bottom work vessel), commercial_vessel (larger work or passenger boat)
- caravan: caravan (tow-behind living quarters), camper_trailer (fold-out tent trailer), motorhome (self-propelled living vehicle)

Subtype: If you can identify a subtype, return it. If truly ambiguous between two subtypes, pick the most common one for Australian auctions. Return null only if there is genuinely no meaningful subtype distinction possible.

Confidence guide:
- "high": asset type and subtype clearly identifiable from photos
- "medium": asset type clear but subtype uncertain, OR one good photo but partially obscured
- "low": poor quality, heavily cropped, or ambiguous — but still return your best guess`,
      },
      {
        role: 'user',
        content: imageUrls.map(url => ({ type: 'image' as const, image: url })),
      },
    ],
  })

  const schema = SCHEMA_REGISTRY[object.asset_type as keyof typeof SCHEMA_REGISTRY]
  const subtypeLabel = schema?.subtypes?.find(s => s.key === object.asset_subtype)?.label ?? object.asset_subtype
  const typeLabel = schema?.displayName ?? object.asset_type

  return Response.json({
    asset_type: object.asset_type,
    asset_subtype: object.asset_subtype,
    type_label: typeLabel,
    subtype_label: subtypeLabel,
    confidence: object.confidence,
    reasoning: object.reasoning,
  })
}
