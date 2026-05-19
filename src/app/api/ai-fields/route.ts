import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { getFieldsSortedBySfOrder } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let assetId: string, message: string, assetType: string
  try {
    const body = await req.json()
    assetId = body.assetId
    message = body.message?.trim().slice(0, 500) ?? ''
    assetType = body.assetType ?? 'general_goods'
    if (!assetId || !message) return Response.json({ error: 'assetId and message required' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Get the field definitions for this asset type
  const fields = getFieldsSortedBySfOrder(assetType as AssetType)
  if (fields.length === 0) return Response.json({ fields: [], confidence: 'low' })
  const fieldList = fields
    .map(f => `${f.key}: "${f.label}"${f.options ? ` (options: ${f.options.join(', ')})` : ''}`)
    .join('\n')

  const schema = z.object({
    fields: z.array(z.object({
      key: z.string(),
      value: z.string(),
    })).describe('List of field key/value pairs to update'),
    confidence: z.enum(['high', 'medium', 'low']),
  })

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema,
    system: `You are an assistant that maps plain-English inspector notes to specific asset data fields for an Australian auction house.

Available fields for this ${assetType}:
${fieldList}

Rules:
- Only return fields you are confident about from the user's message
- For select fields, you MUST use one of the listed options exactly
- "no keys" or "no key" → master_key: "No", spare_key: "No"
- "one key" or "has key" → master_key: "Yes", spare_key: "No"
- "two keys" or "full set" → master_key: "Yes", spare_key: "Yes"
- "non runner" or "doesn't start" or "no start" → driveable: "No"
- "runs" or "starts fine" or "drives" → driveable: "Yes"
- "log books" or "service history" or "full logs" → service_history: "Full Service History — Log Books"
- "no history" or "no log books" → service_history: "No Service History"
- Colours, odometer readings, registration numbers, VINs etc. map directly
- If the message is ambiguous or doesn't clearly map to any field, return an empty fields array
- Never guess or hallucinate field values`,
    messages: [{
      role: 'user',
      content: `Inspector said: "${message}"`,
    }],
  })

  return Response.json({ fields: object.fields, confidence: object.confidence })
}
