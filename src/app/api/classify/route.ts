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

  let object: z.infer<typeof ClassifySchema>
  try {
    const result = await generateObject({
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
- Tracks + offset boom arm (swings side to side) = earthmoving excavator — NOT bulldozer (bulldozer has a straight blade bolted to the front, no articulating boom)
- Yellow body + bucket/blade = earthmoving
- Mast + forks fixed at front, no telescopic boom = forklift — NOT telehandler (telehandler has a single extending arm that tilts up like a crane)
- Telescopic boom extending forward from cab = earthmoving (telehandler), NOT forklift
- 5th wheel coupling plate on tray (large circular coupling behind cab) = truck (prime_mover) — no body, just the tractor unit
- Hydraulic tipping body with visible rams = truck (tipper) if it has a cab; trailer (tipper) if no cab
- Knuckle boom crane or service body with tool drawers = truck (service_truck)
- Two-wheeled powered vehicle with handlebar steering = vehicle (motorcycle)
- 4-door cab + open tray/tub at rear + towbar = vehicle (dual_cab_ute)
- Raised ride height + wagon/SUV body, no tray = vehicle (suv or 4wd)
- Standard 4-door saloon body = vehicle (sedan); compact 3/5-door = vehicle (hatchback)
- Enclosed box body on rigid chassis with cab = truck (pantech)
- Long trailer, curtains on sides = trailer (curtainsider)
- Boat hull on trailer = marine (trailer_boat)
- Drawbar + living quarters = caravan
- Large tyres + open operator station + boom = agriculture (tractor or telehandler)
- Orange/red warning lights on roof = likely service_truck or emergency vehicle
- Spray booms folded on sides = agriculture (spray_rig)
- Long chassis with NO cab, drawbar or kingpin plate at front, axle group at rear = trailer (pick closest subtype)
- Flat steel deck, no sides, no cab, multiple axles = trailer (flat_deck)
- Build plate showing ATM or tare but no GVM, no cab visible = trailer
- Any large towed asset with multiple axles and no engine/cab = trailer NOT general_goods
- Car, sedan, hatchback, SUV, passenger vehicle, ute = vehicle (not general_goods)
- general_goods is ONLY for individual items: tools, small machinery, furniture, equipment lots — never for trailers, trucks, or vehicles

SUBTYPE HINTS:
- vehicle: dual_cab_ute (4-door cab + open tray/tub), single_cab_ute (2-door cab + tray), suv (raised wagon-like body, no tray), sedan (standard 4-door car), hatchback (compact car, short rear), van (transit/sprinter/hiace cargo), bus, 4wd (large SUV with visible lift or aggressive off-road tyres), motorcycle (2-wheeled powered: road bike, sports bike, cruiser, dirt bike, scooter, moped)
- truck: tipper (hydraulic tipping body, rams visible), tray_truck (flat steel tray), pantech (enclosed box body), prime_mover (semi tractor unit, 5th wheel coupling plate on tray, no cargo body), cab_chassis (bare chassis, no body fitted), service_truck (knuckle boom crane or service body with drawers), refrigerated_pantech (white insulated box body)
- trailer: flat_deck (bare flat deck, no sides), curtainsider (side curtains that pull open), pantech (enclosed box body on trailer), low_loader (dropped/stepped deck for machinery), skel (skeletal frame for containers), dog (tag trailer with drawbar and rear axle group), stock (slatted livestock crate sides), side_tipper (hydraulic side-tipping body), tipper (rear-tipping body on trailer)
- earthmoving: excavator (tracks + cab + offset boom arm that swings — NOT a front blade), bulldozer (blade bolted straight to front + tracks, no articulating boom), wheel_loader (large articulated machine, bucket at front, full-size cab — NOT compact), skid_steer (compact, 4 wheels, turns by wheel speed not steering), motor_grader (long blade underneath), dump_truck (large rigid haul truck with tipping body), compactor (drum roller), telehandler (telescopic boom that extends and tilts — NOT a fixed mast)
- forklift: clearview_mast (standard counterbalance forklift, fixed vertical mast + forks), container_mast (very tall mast 4m+), walkie_stacker (pedestrian stacker), electric_pallet_jack (ride-on or walk-behind pallet jack)
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
    object = result.object
  } catch {
    return Response.json({ error: 'Classification failed' }, { status: 502 })
  }

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
