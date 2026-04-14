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

  let imageUrl: string
  try {
    const body = await req.json()
    imageUrl = body.imageUrl
    if (!imageUrl) return Response.json({ error: 'imageUrl required' }, { status: 400 })
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
Classify the asset shown in the photo into one of these types and subtypes:

${typeList}

Return the exact key values (snake_case) from the list above. If you cannot confidently identify a subtype, return null for asset_subtype.`,
      },
      {
        role: 'user',
        content: [{ type: 'image', image: imageUrl }],
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
