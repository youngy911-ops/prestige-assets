import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60
import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { buildExtractionSchema, buildSystemPrompt, buildUserPrompt } from '@/lib/ai/extraction-schema'
import type { AssetType } from '@/lib/schema-registry/types'
import { parseStructuredFields } from '@/lib/utils/parseStructuredFields'

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

  // 3 + 4. Load asset and photos in parallel (independent queries)
  const [{ data: asset }, { data: photos }] = await Promise.all([
    supabase
      .from('assets')
      .select('id, asset_type, asset_subtype, inspection_notes')
      .eq('id', assetId)
      .single(),
    supabase
      .from('asset_photos')
      .select('storage_path')
      .eq('asset_id', assetId)
      .order('sort_order', { ascending: true }),
  ])
  if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 })

  // 5. Generate signed URLs in a single batch call (one API call regardless of photo count)
  const photoList = photos ?? []
  const { data: signedUrlData } = photoList.length > 0
    ? await supabase.storage.from('photos').createSignedUrls(
        photoList.map(p => p.storage_path),
        3600
      )
    : { data: [] }
  const signedUrls = (signedUrlData ?? [])
    .map(r => r.signedUrl)
    .filter((url): url is string => !!url)

  // 6. Build extraction schema + prompts
  const assetType = asset.asset_type as AssetType
  const schema = buildExtractionSchema(assetType)

  // Short-circuit: if no fields are AI-extractable (e.g. General Goods), skip the AI call
  if (Object.keys(schema.shape).length === 0) {
    await supabase
      .from('assets')
      .update({ extraction_result: {}, extraction_stale: false })
      .eq('id', assetId)
      .eq('user_id', user.id)
    return Response.json({ success: true, extraction_result: {} })
  }

  const systemPrompt = buildSystemPrompt(asset.asset_type, asset.asset_subtype ?? '')

  const structuredFields = parseStructuredFields(asset.inspection_notes)

  const userPrompt = buildUserPrompt(asset.inspection_notes, structuredFields)

  // 7. Call GPT-4o via Vercel AI SDK — use generateText + Output.object() (not deprecated generateObject)
  const { output } = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({ schema }),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          ...signedUrls.map(url => ({ type: 'image' as const, image: url })),
        ],
      },
    ],
  })

  // 8. Write extraction_result to DB — NEVER touch assets.fields
  await supabase
    .from('assets')
    .update({
      extraction_result: output,
      extraction_stale: false,
    })
    .eq('id', assetId)
    .eq('user_id', user.id)

  return Response.json({ success: true, extraction_result: output })
}
