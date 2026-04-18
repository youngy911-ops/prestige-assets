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

SUBTYPE HINTS for common Australian auction assets:
- vehicle: dual_cab_ute (4-door tray/ute), single_cab_ute (2-door), suv (raised, wagon-like), sedan, van (transit/sprinter/hiace cargo), bus, 4wd
- truck: tipper (hydraulic tipping body), tray_truck (flat tray), pantech (enclosed box body), prime_mover (semi tractor, 5th wheel), cab_chassis (no body fitted), service_truck (crane or service body), refrigerated_pantech, flat_deck, water_truck, vacuum_truck
- trailer: tipper_trailer, flat_deck_trailer, curtainsider_trailer, pantech_trailer, low_loader, skel_trailer
- earthmoving: excavator, bulldozer, wheel_loader, motor_grader, skid_steer, dump_truck, compactor, telehandler
- forklift: clearview_mast (standard warehouse forklift), container_mast (tall mast), walkie_stacker, electric_pallet_jack
- agriculture: tractor, combine_harvester, spray_rig, baler, air_seeder
- marine: trailer_boat, personal_watercraft, barge, commercial_vessel
- caravan: caravan, camper_trailer, motorhome

If you cannot confidently identify a subtype from the photos available, return null for asset_subtype.

Confidence guide:
- "high": asset type and subtype clearly identifiable
- "medium": asset type clear but subtype ambiguous
- "low": poor image quality or asset could belong to multiple types`,
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
